// Keep these lines for a best effort IntelliSense of Visual Studio 2017.
/// <reference path="../../Packages/Beckhoff.TwinCAT.HMI.Framework.12.742.5/runtimes/native1.12-tchmi/TcHmi.d.ts" />

class GraphCanvas extends LGraphCanvas {

    constructor(canvas, graph, options) {
        super(canvas, graph, options);
        super.resize();
        //window.addEventListener("resize", function () { super.resize(); });
        this.render_canvas_border = false;
    };

    onMenuNodeMode(value, options, e, menu, node) {
        var menuItems = ["Cyclic", "On Trigger", "On Port Change", "Never"];
        var removeItems = function (menuItem, menuItems) {

            var index = menuItems.indexOf(menuItem);
            if (index !== -1) {
                menuItems.splice(index, 1);
            }

            return menuItems;
        }

        if (!node.inputs) {
            menuItems = removeItems("On Port Change", menuItems);
            menuItems = removeItems("On Trigger", menuItems);

        } else {

            if (node.inputs.filter(function (e) { return e.type === LiteGraph.ACTION; }).length == 0) {
                menuItems = removeItems("On Trigger", menuItems);
            }
        }

        new LiteGraph.ContextMenu(
            menuItems,
            { event: e, callback: inner_clicked, parentMenu: menu, node: node }
        );

        function inner_clicked(v) {
            if (!node) {
                return;
            }
            switch (v) {
                case "On Port Change":
                    node.mode = LiteGraph.ON_EVENT;
                    break;
                case "On Trigger":
                    node.mode = LiteGraph.ON_TRIGGER;
                    break;
                case "Never":
                    node.mode = LiteGraph.NEVER;
                    break;
                case "Cyclic":
                default:
                    node.mode = LiteGraph.ALWAYS;
                    break;
            }
            node.graph.configurationHasChanged();
        }

        return false;
    };

    // custom side panel
    onShowNodePanel = function (n) {
        var node = n;

        window.SELECTED_NODE = node;

        var panel = document.querySelector("#node-panel");
        if (panel)
            panel.close();

        var ref_window = this.getCanvasWindow();
        panel = this.createPanel(node.title || "", { closable: true, window: ref_window });
        panel.id = "node-panel";
        panel.node = node;
        panel.classList.add("settings");
        panel.style.zIndex = "10";

        var graphcanvas = this;

        panel.refreshPanel = function () {

            panel.previousJsonView = $('#json-renderer', $(panel.content.innerHTML).context);

            panel.content.innerHTML = "";

            panel.addHTML("<span class='node_type'>" + panel.node.type + "</span><span class='node_desc'>" + (panel.node.description || "") + "</span><span class='separator'></span>");

            if (panel.node.informationUrls) {

                panel.addHTML("<h3>Links</h3>");

                var tableData = '';

                panel.node.informationUrls.map(function (informationUrl) { tableData += ('<tr><td><a class="link-button-rounded" target="_blank" href="' + informationUrl.url + '">' + informationUrl.name + '</a></td></tr>') });
                panel.addHTML('<table><tbody id="tbody">' + tableData + '</tbody></table>');

                panel.addSeparator();
            }


            panel.addHTML("<h3>Errors</h3>");
            if (panel.node && panel.node.currentStatus && panel.node.currentStatus.error) {

                var tableData = '';
                panel.node.currentStatus.error.map(function (e) { tableData += ('<tr><td>' + e.message + '</td><td>' + e.reason + '</td></tr>') });
                panel.addHTML('<table><tbody id="tbody">' + tableData + '</tbody></table>');

            }

            panel.addSeparator();

            panel.addHTML('<h3>Json</h3><div><pre id="json-renderer"></pre></div>');

            $('#json-renderer').jsonViewer(panel.node.currentStatus, {}, panel.previousJsonView);

            panel.addSeparator();

            if (panel.node.onShowCustomPanelInfo)
                panel.node.onShowCustomPanelInfo(panel);

        }

        this.canvas.parentNode.appendChild(panel);
        panel.refreshPanel();

    };

    drawNodeShape(node, ctx, size, fgcolor, bgcolor, selected, mouse_over) {
        if (!node.has_errors)
            node.styleMap.forEach(function (style) {
                if (style.fgcolor)
                    fgcolor = style.fgcolor;

                if (style.bgcolor)
                    bgcolor = style.bgcolor;
            })
        else {
            fgcolor = "#750000";
            bgcolor = "#96000c";
        }

        super.drawNodeShape(node, ctx, size, fgcolor, bgcolor, selected, mouse_over);
    };

    // full override of the draw node function.  
    // this was needed in order to add a conditional check on drawing the trigger port. 
    // if the node is in any other mode then this port shall be greyed out.
    drawNode(node, ctx) {

        var temp_vec2 = new Float32Array(2); // <--- different from original
        var glow = false;
        this.current_node = node;

        var color = node.color || node.constructor.color || LiteGraph.NODE_DEFAULT_COLOR;
        var bgcolor = node.bgcolor || node.constructor.bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;

        //shadow and glow
        if (node.mouseOver) {
            glow = true;
        }

        var low_quality = this.ds.scale < 0.6; //zoomed out

        //only render if it forces it to do it
        if (this.live_mode) {
            if (!node.flags.collapsed) {
                ctx.shadowColor = "transparent";
                if (node.onDrawForeground) {
                    node.onDrawForeground(ctx, this, this.canvas);
                }
            }
            return;
        }

        var editor_alpha = this.editor_alpha;
        ctx.globalAlpha = editor_alpha;

        if (this.render_shadows && !low_quality) {
            ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
            ctx.shadowOffsetX = 2 * this.ds.scale;
            ctx.shadowOffsetY = 2 * this.ds.scale;
            ctx.shadowBlur = 3 * this.ds.scale;
        } else {
            ctx.shadowColor = "transparent";
        }

        //custom draw collapsed method (draw after shadows because they are affected)
        if (
            node.flags.collapsed &&
            node.onDrawCollapsed &&
            node.onDrawCollapsed(ctx, this) == true
        ) {
            return;
        }

        //clip if required (mask)
        var shape = node._shape || LiteGraph.BOX_SHAPE;
        var size = temp_vec2;
        temp_vec2.set(node.size);
        var horizontal = node.horizontal; // || node.flags.horizontal;

        if (node.flags.collapsed) {
            ctx.font = this.inner_text_font;
            var title = node.getTitle ? node.getTitle() : node.title;
            if (title != null) {
                node._collapsed_width = Math.min(
                    node.size[0],
                    ctx.measureText(title).width +
                        LiteGraph.NODE_TITLE_HEIGHT * 2
                ); //LiteGraph.NODE_COLLAPSED_WIDTH;
                size[0] = node._collapsed_width;
                size[1] = 0;
            }
        }

        if (node.clip_area) {
            //Start clipping
            ctx.save();
            ctx.beginPath();
            if (shape == LiteGraph.BOX_SHAPE) {
                ctx.rect(0, 0, size[0], size[1]);
            } else if (shape == LiteGraph.ROUND_SHAPE) {
                ctx.roundRect(0, 0, size[0], size[1], 10);
            } else if (shape == LiteGraph.CIRCLE_SHAPE) {
                ctx.arc(
                    size[0] * 0.5,
                    size[1] * 0.5,
                    size[0] * 0.5,
                    0,
                    Math.PI * 2
                );
            }
            ctx.clip();
        }

        //draw shape
        if (node.has_errors) {
            bgcolor = "red";
        }
        this.drawNodeShape(
            node,
            ctx,
            size,
            color,
            bgcolor,
            node.is_selected,
            node.mouseOver
        );
        ctx.shadowColor = "transparent";

        //draw foreground
        if (node.onDrawForeground) {
            node.onDrawForeground(ctx, this, this.canvas);
        }

        //connection slots
        ctx.textAlign = horizontal ? "center" : "left";
        ctx.font = this.inner_text_font;

        var render_text = !low_quality;

        var out_slot = this.connecting_output;
        ctx.lineWidth = 1;

        var max_y = 0;
        var slot_pos = new Float32Array(2); //to reuse

        //render inputs and outputs
        if (!node.flags.collapsed) {

            //input connection slots         
            max_y = this.drawNodeInputs(node, ctx, max_y);

            //output connection slots
            if (this.connecting_node) {
                ctx.globalAlpha = 0.4 * editor_alpha;
            }

            ctx.textAlign = horizontal ? "center" : "right";
            ctx.strokeStyle = "black";

            max_y = this.drawNodeOutputs(node, ctx, max_y)

            ctx.textAlign = "left";
            ctx.globalAlpha = 1;

            if (node.widgets) {
                var widgets_y = max_y;
                if (horizontal || node.widgets_up) {
                    widgets_y = 2;
                }
                if (node.widgets_start_y != null)
                    widgets_y = node.widgets_start_y;
                this.drawNodeWidgets(
                    node,
                    widgets_y,
                    ctx,
                    this.node_widget && this.node_widget[0] == node
                        ? this.node_widget[1]
                        : null
                );

                max_y = this.drawNodeWidgetInputs(node, ctx, max_y);
            }
        } else if (this.render_collapsed_slots) {

            var input_slot = null;

            if (node.inputs) {
                for (var i = 0; i < node.inputs.length; i++) {
                    var slot = node.inputs[i];
                    if (slot.link == null) {
                        continue;
                    }
                    input_slot = slot;
                    break;
                }
            } out_slot

            if (input_slot) {
                var x = 0;
                var y = LiteGraph.NODE_TITLE_HEIGHT * -0.5; //center
                if (horizontal) {
                    x = node._collapsed_width * 0.5;
                    y = -LiteGraph.NODE_TITLE_HEIGHT;
                }
                ctx.fillStyle = "#686";
                ctx.beginPath();
                if (
                    slot.type === LiteGraph.EVENT ||
                    slot.shape === LiteGraph.BOX_SHAPE
                ) {
                    ctx.rect(x - 7 + 0.5, y - 4, 14, 8);
                } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                    ctx.moveTo(x + 8, y);
                    ctx.lineTo(x + -4, y - 4);
                    ctx.lineTo(x + -4, y + 4);
                    ctx.closePath();
                } else {
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                }
                ctx.fill();
            }

            var output_slot = null;

            if (node.outputs) {
                for (var i = 0; i < node.outputs.length; i++) {
                    var slot = node.outputs[i];
                    if (!slot.links || !slot.links.length) {
                        continue;
                    }
                    output_slot = slot;
                }
            }

            if (output_slot) {
                var x = node._collapsed_width;
                var y = LiteGraph.NODE_TITLE_HEIGHT * -0.5; //center
                if (horizontal) {
                    x = node._collapsed_width * 0.5;
                    y = 0;
                }
                ctx.fillStyle = "#686";
                ctx.strokeStyle = "black";
                ctx.beginPath();
                if (
                    slot.type === LiteGraph.EVENT ||
                    slot.shape === LiteGraph.BOX_SHAPE
                ) {
                    ctx.rect(x - 7 + 0.5, y - 4, 14, 8);
                } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                    ctx.moveTo(x + 6, y);
                    ctx.lineTo(x - 6, y - 4);
                    ctx.lineTo(x - 6, y + 4);
                    ctx.closePath();
                } else {
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                }
                ctx.fill();

            }
        }

        if (node.clip_area) {
            ctx.restore();
        }

        ctx.globalAlpha = 1.0;
    };

    drawNodeInputs(node, ctx, max_y) {

        var out_slot = this.connecting_output;
        var low_quality = this.ds.scale < 0.6;
        var render_text = !low_quality;
        var horizontal = node.horizontal;
        var editor_alpha = this.editor_alpha;

        var slot_pos = new Float32Array(2);

        if (node.inputs) {
            for (var i = 0; i < node.inputs.length; i++) {
                var slot = node.inputs[i];

                if (typeof slot.widget_slot !== 'undefined')
                    continue;

                ctx.globalAlpha = editor_alpha;

                if (this.connecting_node && !LiteGraph.isValidConnection(slot.type, out_slot.type)) {
                    ctx.globalAlpha = 0.4 * editor_alpha;
                }

                ctx.fillStyle =
                    slot.link != null
                        ? slot.color_on ||
                          this.default_connection_color.input_on
                        : slot.color_off ||
                          this.default_connection_color.input_off;

                var pos = node.getConnectionPos(true, i, slot_pos);
                pos[0] -= node.pos[0];
                pos[1] -= node.pos[1];
                if (max_y < pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5) {
                    max_y = pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5;
                }

                ctx.beginPath();

                var ctx_saved = false;

                if (
                    slot.type === LiteGraph.EVENT ||
                    slot.shape === LiteGraph.BOX_SHAPE
                ) {
                    if (horizontal) {
                        ctx.rect(
                            pos[0] - 5 + 0.5,
                            pos[1] - 8 + 0.5,
                            10,
                            14
                        );
                    } else {

                        ctx.save();
                        ctx_saved = true;

                        if (node.mode != LiteGraph.ON_TRIGGER && slot.type === LiteGraph.EVENT) {
                            ctx.globalAlpha = 0.4 * editor_alpha;
                        }

                        ctx.rect(
                            pos[0] - 6 + 0.5,
                            pos[1] - 5 + 0.5,
                            14,
                            10
                        );

                    }
                } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                    ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
                    ctx.closePath();
                } else {
                    if (low_quality)
                        ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8); //faster
                    else
                        ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2);
                }
                ctx.fill();

                if (render_text) {
                    var text = slot.label != null ? slot.label : slot.name;
                    if (text) {
                        ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                        if (horizontal || slot.dir == LiteGraph.UP) {
                            ctx.fillText(text, pos[0], pos[1] - 10);
                        } else {
                            ctx.fillText(text, pos[0] + 10, pos[1] + 5);
                        }
                    }
                }

                if (ctx_saved)
                    ctx.restore();
                
            }
        }

        return max_y;

    };

    drawNodeOutputs(node, ctx, max_y) {

        var low_quality = this.ds.scale < 0.6; 
        var render_text = !low_quality;
        var horizontal = node.horizontal; 

        var slot_pos = new Float32Array(2);

        if (node.outputs) {
            for (var i = 0; i < node.outputs.length; i++) {
                var slot = node.outputs[i];

                var pos = node.getConnectionPos(false, i, slot_pos);
                pos[0] -= node.pos[0];
                pos[1] -= node.pos[1];
                if (max_y < pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5) {
                    max_y = pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5;
                }

                ctx.fillStyle =
                    slot.links && slot.links.length
                        ? slot.color_on ||
                          this.default_connection_color.output_on
                        : slot.color_off ||
                          this.default_connection_color.output_off;
                ctx.beginPath();

                if (
                    slot.type === LiteGraph.EVENT ||
                    slot.shape === LiteGraph.BOX_SHAPE
                ) {
                    if (horizontal) {
                        ctx.rect(
                            pos[0] - 5 + 0.5,
                            pos[1] - 8 + 0.5,
                            10,
                            14
                        );
                    } else {
                        ctx.rect(
                            pos[0] - 6 + 0.5,
                            pos[1] - 5 + 0.5,
                            14,
                            10
                        );
                    }
                } else if (slot.shape === LiteGraph.ARROW_SHAPE) {
                    ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
                    ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
                    ctx.closePath();
                } else {
                    if (low_quality)
                        ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8);
                    else
                        ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2);
                }

                ctx.fill();
                if (!low_quality)
                    ctx.stroke();

                if (render_text) {
                    var text = slot.label != null ? slot.label : slot.name;
                    if (text) {
                        ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                        if (horizontal || slot.dir == LiteGraph.DOWN) {
                            ctx.fillText(text, pos[0], pos[1] - 8);
                        } else {
                            ctx.fillText(text, pos[0] - 10, pos[1] + 5);
                        }
                    }
                }
            }
        }

        return max_y;
    };

    drawNodeWidgetInputs(node, ctx, max_y) {

        var out_slot = this.connecting_output;
        var low_quality = this.ds.scale < 0.6;
        var render_text = !low_quality;
        var horizontal = node.horizontal;
        var editor_alpha = this.editor_alpha;

        var slot_pos = new Float32Array(2);

        if (node.inputs) {
            for (var i = 0; i < node.inputs.length; i++) {
                var slot = node.inputs[i];

                if (typeof slot.widget_slot === 'undefined')
                    continue;

                ctx.globalAlpha = editor_alpha;

                if (this.connecting_node && !LiteGraph.isValidConnection(slot.type, out_slot.type)) {
                    ctx.globalAlpha = 0.4 * editor_alpha;
                }

                ctx.fillStyle =
                    slot.link != null
                        ? slot.color_on ||
                          this.default_connection_color.input_on
                        : slot.color_off ||
                          this.default_connection_color.input_off;

                var pos = node.getConnectionPos(true, i, slot_pos);
                pos[0] -= node.pos[0];
                pos[1] -= node.pos[1];
                if (max_y < pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5) {
                    max_y = pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5;
                }

                ctx.beginPath();

                var ctx_saved = false;

  
                if (low_quality)
                    ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8); //faster
                else
                    ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2);
                
                ctx.fill();

                if (slot.link) {
                    var text = slot.label != null ? slot.label : slot.name;
                    if (text) {
                        ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                        if (horizontal || slot.dir == LiteGraph.UP) {
                            ctx.fillText(text, pos[0], pos[1] - 10);
                        } else {
                            ctx.fillText(text, pos[0] + 10, pos[1] + 5);
                        }
                    }
                }

                if (ctx_saved)
                    ctx.restore();

            }
        }

        return max_y;

    };
};

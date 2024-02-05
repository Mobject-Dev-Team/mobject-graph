// Keep these lines for a best effort IntelliSense of Visual Studio 2017.
/// <reference path="../../../Packages/Beckhoff.TwinCAT.HMI.Framework.12.746.3/runtimes/native1.12-tchmi/TcHmi.d.ts" />

var PlcApi = (function (symbol, graph) {

    var api = {

        loadGraph: function () {
        
            var graphJson = JSON.stringify(graph.serialize());

            console.log('Configuration Change');
            console.log(JSON.parse(graphJson));

            TcHmi.Server.writeSymbol(symbol + '.receivedGraphJson', graphJson);

        },

        updateNodeProperty: function () {

            var graphJson = JSON.stringify(graph.serialize());

            console.log('Property Change');
            console.log(JSON.parse(graphJson));

            TcHmi.Server.writeSymbol(symbol + '.receivedGraphJson', graphJson, function(data){
    if(data.error !== TcHmi.Errors.NONE){
        console.log(data.error);
                return;
            }
            var response = data.response;
            if (!response || response.error !== undefined) {
                console.log(response.error);
                return;
            }
            var commands = response.commands;
            if (commands === undefined) {
                console.log('no commands');
                return;
            }
            var command = commands[0];
            if (command === undefined) {
                console.log('no command 0');
                return;
            }
            if(command.error !== undefined){
                console.log(command.error);
                return;
            }
            // Handle result...
            console.log('seems ok');
        });

        },

        setupIncomingRoutes: function () {

            if (TcHmi.Server.isWebsocketReady()) {

                var commands = [{ 'symbol': symbol + '.graphStatus' }];

                var requestId = TcHmi.Server.subscribeEx(commands, 500, { timeout: 2000 }, function (data) {
                    if (data.error !== TcHmi.Errors.NONE) { return; }

                    var response = data.response;
                    if (!response || response.error !== undefined) { return; }
                        
                    var commands = response.commands;
                    if (commands === undefined) { return; }
                       
                    for (var i = 0, ii = commands.length; i < ii; i++) {

                        var command = commands[i];
                        if (command === undefined) { return; }                          
                        if (command.error !== undefined) { return; }        

                        let statusObject = JSON.parse(command.readValue);

                        graph.updateStatus(statusObject);

                    }
                });
            }
        }
    }

    api.setupIncomingRoutes();

    graph.onConfigurationHasChanged = function () {
        api.loadGraph();
    }

    graph.onPropertyHasChanged = function (node, name, value) {
        api.updateNodeProperty(); 
    }

    return api;

});

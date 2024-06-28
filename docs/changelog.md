# Changelog

## v0.9.0-alpha

- added option to install a whole pack (both nodepack and datatype pack at the same time)
- improved efficiency of the getStatus and loadGraph api calls
- updated to support mobject-core v0.3.0
- added iec primitive datatypes pack
- changed api to take server as a constructor
- changed api to use cyclic call
- updated to support mobject-server v0.10.0
- performance updates
  - GetStatus RPC API - now provides condensed output
  - CreateGraph RPC API - now provides condensed output
  - All hosts now use NOT.IsEmpty rather than .Count > 0.
  - Execute no longer creates enumerator each call.

## v0.8.0-alpha

- updated to support mobject-core v0.2.0
- updated to support mobject-server v0.9.0

## v0.7.0-alpha

- updated to support mobject-core v0.1.0
- merged mobject-graph-api for simplicity
- added dependency to mobject-server v0.8.0

## v0.6.0-alpha

- updated to support mobject-datatypes v0.10.0, this brings the ability to support interfaces
- updated to also include interface datatypes where needed

## v0.5.0-alpha

- updated to support mobject-datatypes v0.9.0, this brings the ability to support \_bit
- updated to support mobject-deserialization v0.3.0
- updated to support mobject-collections v1.3.0
- updated to support mobject-disposable v1.1.1
- updated to support mobject-errors v0.3.0
- updated to support mobject-events v1.1.0
- updated to support mobject-serialization v0.5.0
- updated to support mobject-enumerable v1.2.0

## v0.4.0-alpha

- updated to support mobject-collections v1.2.0
- updated to support deserialization v0.2.0
- updated to support mobject-datatypes v0.7.0
- changed hosts to OrderedDictionary

## v0.3.0-alpha

- added autogeneration of literal, display, unbundle and bundle nodes
- updated to support mobject-datatypes v0.6.0
- changed prototype path back to / style i.e. "Group A/Group B/Group N/Node Name"

## v0.2.0-alpha

- updated to support mobject-datatypes v0.5.0

## v0.1.0-alpha

- Initial

# History

## mobject-graph-api v0.8.0-alpha

- added support for mobject-graph v0.6.0

## mobject-graph-api v0.7.0-alpha

- added support for mobject-server v0.7.0
- changed api to now support plc cycle "async" processing

## mobject-graph-api v0.6.0-alpha

- added support for mobject-graph v0.5.0
- added support for mobject-deserialization v0.3.0
- added support for mobject-server v0.6.0
- added support for mobject-collections v1.3.0
- added support for mobject-events v1.1.0
- added support for mobject-serialization v0.5.0

## mobject-graph-api v0.5.0-alpha

- added support for mobject-collections v1.2.0
- added support for mobject-deserialization v0.2.0
- added support for mobject-graph v0.4.0
- added support for mobject-server v0.5.0

## mobject-graph-api v0.4.0-alpha

- added support for mobject-server v0.4.0

## mobject-graph-api v0.3.0-alpha

- added support for mobject-graph v0.3.0

## mobject-graph-api v0.2.0-alpha

- removed datatypes until they are needed
- added support for mobject-graph v0.2.0

## mobject-graph-api v0.1.0-alpha

- Initial code

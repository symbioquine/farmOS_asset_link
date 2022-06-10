# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Model default plugin configuration using config entities and provide management UI
- Allow reloading plugin lists and improve when the option to remove plugin lists is shown
- Add "context multiplexing" so slot plugins can fan out to provide multiple instances of a slot
- Add some test data to the provided development farmOS instance configuration
- Implement a "visual carousel" on the asset page and add the asset's photos to it
- Implement a way for slot plugins to provide weights
- Add some rudimentary documentation about the Asset Link extension model
- Implement a way for widget decorator plugins to provide weights
- Add some additional test data - "Dolly the sheep"

### Changed

- Set the weight on the asset visual carousel to move it above the actions
- Add a `pageName` field to the page slot context and filter by it for the asset actions and visual carousel
- Allow loading of plugins relative to the plugin list

### Fixed

- Honor enabled/disabled status of default plugins
- Handle HTTP failures when retrieving plugin sources
- Fix bug in accessing Orbit.js sources via NonReactiveAssetLinkDecorator

## [0.2.1] - 2022-05-31

### Changed

- Improved caching of vue component plugins to speed up loading
- Introduced slot system so plugins can render arbitrary components on pages
- Converted asset page to be a plugin
- Refactored asset actions to be rendered by a page slot plugin
- Refactored actions to just be another type of slot
- Introduced a widget system where plugins can render widgets that other plugins can decorate
- Implemented widget decorators to add sex and archived status widgets to the asset name

## [0.1.1] - 2022-05-27

### Added

- Automatically reload core plugins when they change in a development context
- Add the `//# sourceURL` pragma to the end of plugins so they appear nicely in the debugger
- Implement a "move asset" action provider plugin

### Fixed

- Return an HTTP 500 error when built artifacts are missing
- Removed some unnecessary logging
- Fixed support for custom dialogs
- Improve handling of plugin component parse errors
- Fixed how URLs are constructed for asset photos to work more generally

## [0.0.1] - 2022-04-18

### Added

- Initial dev release

[unreleased]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.2.1...HEAD
[0.2.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.1.1...unbuilt-v0.2.1
[0.1.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.0.1...unbuilt-v0.1.1
[0.0.1]: https://github.com/symbioquine/farmOS_asset_link/releases/tag/unbuilt-v0.0.1

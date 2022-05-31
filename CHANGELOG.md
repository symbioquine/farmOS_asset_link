# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [0.0.1] - 2022-04-18

### Added

- Initial dev release

[unreleased]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.1.1...HEAD
[0.1.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.0.1...unbuilt-v0.1.1
[0.0.1]: https://github.com/symbioquine/farmOS_asset_link/releases/tag/unbuilt-v0.0.1

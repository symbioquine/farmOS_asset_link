# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Autofocus the text search input when searching for assets

### Fixed

- Change how relationship schemas are loaded so they are valid as Orbit.js models

## [0.6.1] - 2022-08-31

### Added

- Make it simpler for other modules to provide default Asset Link plugins without their own controllers/routing

### Changed

- More aggressively rely on indexeddb caching in preference to network/worker caching

### Fixed

- Cleaned up some warnings and unnecessary logging
- Fixed a bug with how different browsers handle 'indexeddb://' plugin urls - #2
- Fixed a bug with how extra plugin lists are stored/updated - #3
- Don't cache requests to `/api` used to check connectivity/login status

## [0.6.0] - 2022-08-30

### Added

- Add a CodeEditor component based on CodeMirror 5
- Add the ability to enable/disable plugins by URL
- Add support for plugins stored (not just cached) locally in indexeddb
- Add the ability to create/edit plugins by writing their source code inside Asset Link
- Add a default plugin which shows the parent/child hierarchy of assets

### Changed

- Depend on the source files for the `assetlink-plugin-api` package rather than its bundle in the PWA/Sidecar so that code splitting will work correctly

### Fixed

- Apply Drupal 10 fixes from https://www.drupal.org/project/farmos_asset_link/issues/3305281#comment-14661933
- Clean up old default plugin files and config entities on building
- Fix bug in connection status detection to honor all "^2" versions, not just the dev "2.x" version
- Fix a bug with plugin reference tracking not dropping to zero correctly
- Fix a bug with plugin source not being set when plugins produce certain errors
- Fix a bug where plugins would get incorrectly fetched via HTTP after they are already loaded/cached
- Fix a bug with plugins not being loaded correctly when first added to the local plugin list

## [0.5.4] - 2022-08-23

### Added

- Add a connection status description to the bottom of the sync tray
- Add a menu to the bottom of the sync tray with an option to clear all local data
- Add support for the `some` operator when querying entity relationships
- Add a widget decorator for the asset name that shows the asset groups

### Changed

- Improved styling of asset selector to make the search results scroll and fit the page better
- Improve service-worker cache-clearing/unregistering behavior
- Load all asset relationships when loading assets
- Improved how asset location is loaded/displayed/refreshed
- Change the asset location to be a widget decorator on the asset name
- Change the asset location/group to be links to the related location/group asset(s)
- Move the "Asset:" prefix inside a span of the asset name render widget so widget decorator plugins can modify/hide it

### Fixed

- Show the asset search weight text under each search result
- Fix loading of schemas so it works with latest Drupal JSON:API schema data
- Fix reloading plugin lists so the `skipCache` parameter also skips the service worker cache
- Fix a bug with the initial value of the Orbit.js request queue autoProcess setting
- Fix a bug with the sync icon showing the wrong value when no network connection is available
- Fix warnings from Cookie SameSite attribute
- Fix warnings from non-function default slot in JS plugin component declarations
- Fix warnings from non-numeric boot progress values
- Fix warning for name of emitted event on the asset page
- Fix styling of asset selector to have a minimum size for the list of search results
- Fix more bad references to `assetLink.connectionStatus.isOnline`
- Fix data-flow for the in-memory Orbit.js source so the initial call to `assetLink.assetTypes()` can return data
- Remove `cacheOnly` behavior from asset name locations/groups wiget decorators since it was producing stale results
- Add `key` param to asset page asset resolver to ensure the page updates when navigating from one asset to another

## [0.5.3] - 2022-08-17

### Added

- Implement service worker refresh UI to cleanly update the PWA
- Add reload plugin button to the manage plugins page
- Add a more specific warning message for asset proximity search when location permissions are denied

### Fixed

- Re-add service-worker.js which got lost in the migration work
- Fixed logic to connect/disconnect Orbit.js JSON:API source queries based on online/offline status
- Fix reloading plugins so the `skipCache` parameter also skips the service worker cache
- Fix handling of dev certs when proxying https farmOS instances for development
- Actually show messages that are pushed into `assetLink.vm.messages`

## [0.5.2] - 2022-08-16

### Added

- Better docs for IAssetLink/IAssetLinkUI/IFarmOSConnectionStatus interfaces
- Data access and simple asset action plugin tutorials

### Changed

- Moved EventBus implementation to assetlink-plugin-api package to make documentation easier
- Include Vue runtime compiler in PWA/Sidecar builds

## [0.5.1] - 2022-08-15

### Added

- Add basic asset location slot to asset pages
- Add some additional test data - "Field A" and "Field B"
- Add rudimentary documention for the plugin API

### Changed

- Upgraded to Vue 3
- Migrated from Vuetify to Quasar
- Broke packages up and integrated Lerna for managing the build accross the resulting packages
- Extracted the plugin API into its own package in preparation for publishing that to NPM
- Allow plugins to provide custom search methods for assets
- Use plugins to define the buttons in the sidecar/SideBar within the farmOS UI

### Fixed

- Make move asset action plugin only search for locations, not all assets
- Fix a bug with main controller code to 404 on non-existent resources

## [0.4.1] - 2022-06-12

### Added

- Add support for loading plugins of arbitrary formats using other plugins

## [0.3.2] - 2022-06-09

### Fixed

- Fix bug with build writing config entity yml files to a nonexistent directory

## [0.3.1] - 2022-06-09

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
- Fixed how URLs are constructed for asset photos to work more generally

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

## [0.0.1] - 2022-04-18

### Added

- Initial dev release

[unreleased]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.6.1...HEAD
[0.6.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.6.0...unbuilt-v0.6.1
[0.6.0]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.5.4...unbuilt-v0.6.0
[0.5.4]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.5.3...unbuilt-v0.5.4
[0.5.3]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.5.2...unbuilt-v0.5.3
[0.5.2]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.5.1...unbuilt-v0.5.2
[0.5.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.4.1...unbuilt-v0.5.1
[0.4.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.3.2...unbuilt-v0.4.1
[0.3.2]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.3.1...unbuilt-v0.3.2
[0.3.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.2.1...unbuilt-v0.3.1
[0.2.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.1.1...unbuilt-v0.2.1
[0.1.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.0.1...unbuilt-v0.1.1
[0.0.1]: https://github.com/symbioquine/farmOS_asset_link/releases/tag/unbuilt-v0.0.1

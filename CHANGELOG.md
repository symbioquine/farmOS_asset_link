# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-alpha14] - 2024-04-23

### Added

- Expose the farmOS instance name, version, and system of measurement
- Add support for simple maps using farmOS-map

### Fixed

- Cleanup a few minor issues with the documentation

## [1.0.0-alpha13] - 2024-04-14

### Added

- Add docs with more examples of advanced queries via Orbit.js and the plugin API

### Fixed

- Fix a bug where the EntitySelect component `multiple` option is broken - #47

## [1.0.0-alpha12] - 2024-04-09

### Changed

- Update Vue to 3.4.15 and vue3-sfc-loader to 0.9.5

## [1.0.0-alpha11] - 2024-02-14

### Fixed

- Fix a bug in how urls are generated for Asset Link Sidecar

## [1.0.0-alpha10] - 2024-02-13

### Added

- Add a loading indicator for asset search
- Add an explanation of route prop handling to docs
- Add log owner to the log page
- Add log date decorator to log names
- Add package for a "lite" version of Asset Link which works without a farmOS server
- Add a welcome/explanation page to Asset Link Lite

### Changed

- Improved log page date formatting
- Switch to npm workspaces instead of lerna
- Load farmOS models via a special controller to improve performance/flexibility
- Refactor structural data preloading into separate/replaceable class
- Load default plugin list using path relative to Asset Link
- Make reload and "open in farmOS" meta actions appear only when relevant
- Update to work with farmOS 3.x

### Fixed

- Improve browser compatibility by avoiding `Blob::arrayBuffer()` fn
- Fix route prop handling for log and asset pages
- Improve asset/log page handling of unresolved state
- Improve handling for assets/logs without certain fields
- Handle resize events that occur before code editor is instantiated
- Cleanup some stale config from using Lerna
- Fix url encoding in handling of `$relateByName` directive

## [1.0.0-alpha9] - 2023-05-29

### Added

- Add documentation about how to build .vue plugins via Webpack

### Fixed

- Fix bug with sidecar UI breaking certain mobile clicks in farmOS - #42
- Improve compatibility with old versions of Safari avoiding elvis operator in Sidecar bootstrapping code
- Fix edge case bug with computing location relationships
- Fix URL building with 'IS NULL' and 'IS NOT NULL' operators for remote queries
- Improve responsiveness of searching and opening assets within Asset Link

## [1.0.0-alpha8] - 2023-04-04

### Fixed

- Fix some lint build errors

## [1.0.0-alpha7] - 2023-04-04

### Added

- Implement nested relationship attribute filtering
- Surface navigation for exact route matches above asset search results
- Surface option to install plugin and plugin list urls above asset search results
- Add support for built Asset Link plugins in assetlink-plugin-dev-support

### Changed

- Change to new utf-8 compatible data url encoding format for storing plugins

### Fixed

- Fix a bug with nested AND/OR query groups not being added as memberOf eachother
- Fix a bug with the UrlBasedAssetSearcher plugin

## [1.0.0-alpha6] - 2023-03-17

### Added

- Add menu action slots to manage plugins page
- Add a share menu action for exporting Asset Link plugins
- Add an installation and upgrades section to the docs

### Changed

- Made precaching opt-in and smarter about only caching new asset/log changes

### Fixed

- Fix precaching menu item so it isn't also a link to the manage plugins page

## [1.0.0-alpha5] - 2023-03-14

### Added

- Add support for AND/OR query groups in both cache and remote queries
- Add user defined asset log plugins with a wizard to create them
- Improve docs and add a rough outline of an Asset Link user guide

### Changed

- Make query behavior/operators more closely align with Drupal's JSON:API and add more tests

### Fixed

- Fix a bug when updating logs without specifying any attributes

## [1.0.0-alpha4] - 2023-03-06

### Added

- Add support for falling back on not using subrequests when it fails with a 403/404
- Improve behaviour of cache query operators to more closely match Drupal's JSON:API and add some tests

### Fixed

- Skip schema properties without definitions

## [1.0.0-alpha3] - 2023-03-01

### Fixed

- Fix handling of `options.pluginDir` in assetlink-plugin-dev-support

## [1.0.0-alpha2] - 2023-03-01

### Added

- Add a dev support package to improve the plugin dev experience - see https://www.npmjs.com/package/assetlink-plugin-dev-support

## [1.0.0-alpha1] - 2023-02-28

### Added

- Add a "Reload from Server" meta action to assets and logs
- Add support for asynchronous routes
- Add convenience mechanisms for working with taxonomy terms

### Changed

- Handle Ctrl-s/Cmd-s to save from the plugin code editor
- Update the test docker-compose environment to enable a few of the optional modules and add more default test data

### Fixed

- Make loading of group members & location occupants actually fall through the cache when online
- Make the remote search phase actually fall through the cache when online
- Honor `forceRemote` and new `verifyCacheIntegrity` options in FarmDataModelOrbitMemorySourceDecorator
- Make meta actions menu auto-close
- Load asset page title locations/groups refresh from the server (if online) upon log changes
- Make the find asset page load the asset again fully to ensure that all relationships are included
- Fix bug with inventory queries

## [0.13.0] - 2023-02-24

### Fixed

- Skip adding sidebar to map popups
- Fix connection status race condition and precache key structural data-model data

## [0.12.0] - 2023-02-20

### Added

- Add some functional tests in a more scalable fashion
- Add security warning/confirmation about installing untrusted plugins and plugin lists
- Add an option to disable subrequest grouping to simplify testing
- Update the memory cache when new data is supplied in the 'includes' field of remote server responses
- Locally compute inventory values when necessary
- Add a log page and basic support for viewing editing logs
- Add a tasks page for viewing upcoming/late/recent logs

### Changed

- Switch to connecting to the farm-faux-cloud on port 1880
- Conditionally compute location/geometry/group values
- Throw exceptions when log-types/asset-types/taxonomy-vocabularies are missing
- Clean up tests a little
- Rename OpenInFarmOSMetaActionProvider plugin to OpenAssetInFarmOSMetaActionProvider for clarity

### Fixed

- Fix a race condition related to going offline in one of the tests
- Fix bug where the asset geometry/locations computed fields aren't initially calculated for new assets
- Fix a bug with how query results are merged when `options.fullResponse` is set
- Fix populating missing geometry/location/group computed fields for new assets
- Cleanup logic around how querying location/group relations works
- Fix a bug where clearing local data fails in development without the service worker installed
- Fix a bug creating widget decorators via the shorthand without specifying a predicate
- Fix asset group and location members page slots to only apply to the asset page

## [0.11.0] - 2023-02-11

### Added

- Expose jmespath for import by plugins
- Implement "computed" group/location relationships
- Add a "persistent UX tray" area after the Asset Link toolbar title

### Changed

- Make updates non-blocking with the remote when offline
- Make the toolbar title decoratable
- Pin editor dialogs from manage plugins plugin in new persistent UX tray

### Fixed

- Fire "changed:" events after updates have been fully settled with the memory source
- Fix test for multiple movement locations/geometries and confirm that no fetch calls occur when offline

## [0.10.0] - 2023-02-05

### Added

- Added a updates DLQ and improved UX of sync icon/tray to show queries and allow retrying/deleting failed updates

### Changed

- Change the entity resolver component to use q-inner-loading so core Asset Link UI remains usable
- Move the top toolbar sync icon to the far left and make the sync tray appear under the toolbar
- Set the current timestamp in the query/update options so we can tell when queries were originally created
- Make location and groups asset title decorators query those relationships from the entity source, not its cache

### Fixed

- Fix bug with useServiceWorkerUX.js when not running the service worker (i.e. in dev mode)
- Fix AssetPageTitleWithGroupsWidgetDecorator plugin to not break when group assets/relationships are disabled
- Fix MoveAssetActionProvider plugin to filter the current asset out of possible move destinations
- Fix whitespace in test geometry comparison
- Fix how retry errors are stored so they don't break the tests due to fake-indexeddb serialization differences
- Fix retry logic so retries do not happen after AssetLink instance is halted
- Fix how change events are fired upon Orbit.js updates - was broken by recent refactoring
- Fix location occupants slot provider plugin such that a given occupant with only appear once

## [0.9.0] - 2023-02-02

### Changed

- Move logic for farmOS data model locations and group membership into the core of Asset Link
- Simplify location and group membership asset title plugins to use relationships from above refactoring

### Fixed

- Fix bug with file uploads caused by refactoring
- Fix bug where group membership calculation breaks when group module is not enabled
- Fix bug where inventory calculation breaks when inventory module is not enabled

## [0.8.2] - 2023-01-29

### Fixed

- Fix bug with Webpack resolution of Quasar Dialog plugin - breaking all dialogs

## [0.8.1] - 2023-01-29

### Fixed

- Fix bug with options handling injecting `fetch` into the AssetLink class

## [0.8.0] - 2023-01-29

### Added

- Add support for slot showIf predicates using jmespath
- Add support for widget decorator vue template shorthand
- Add support for slot shorthand context multiplexer
- Add some basic smoke testing of AssetLink initialization and entity resolution
- Add a AssetLink::halt method and test to show that resolving a cached asset involves no http requests

### Changed

- Automatically group requests via subrequests #1
- Refactor entity model loading into a separate class and add tests
- Refactor farm data access out into a new Asset Link core
- Change Orbit.js JSON:API request timeout from 10s to 5s
- Propagate transforms from memory to remote source synchronously

### Fixed

- Fix bug where changed events wouldn't be honored by the EntityResolver component
- Fix handling of farmOS installations that are at subpaths rather than '/'
- Fix handling of internal plugin data representation so it can be loaded in tests
- Fix handling of Orbit.js query failures to avoid gumming up internal request queues
- Cleaned up some unnecessary logging
- Fixed task failure propagation in OrbitPriorityTaskQueue
- Fixed handling of `fetch` requests that throw exceptions in SubrequestsGroupingRequestFetcher

## [0.7.6] - 2022-10-21

### Added

- Emit the 'changed:assetLogs' event when inventory quantities referencing an asset change
- Add a plugin to show asset inventory quantities as badges in the asset page title

### Changed

- Perform precaching with lower priority than other JSON:API requests
- Perform precaching requests serially to avoid blocking all browser request threads
- Debounce search requests to no more than 1 per 500ms

### Fixed

- Fix orbit.js record updated listener so it works when multiple update operations occur together
- Set the default plugin config entity yml 'user_defined' property to null to avoid that appearing in the config sync updates report

## [0.7.5] - 2022-10-18

### Changed

- Move the precaching out into a plugin since some use-cases will likely require precaching customization

### Fixed

- Fix the hook_entity_create_access implementation name so our file upload fix actually works

## [0.7.4] - 2022-10-09

### Added

- Add the ability to navigate by clicking on group members and location occupants on the asset page
- Add a entity searcher plugin to find entities by their old farmOS 1.x urls
- Accept pasted images in PhotoInput component
- Expose the AssetLink.fetch method to help support non-JSON:API or certain advanced use-cases

### Fixed

- Fix a bug where group members or location occupants not in the cache would break the display on the asset page
- Fix styling of search tabs so up to 5 can fit reasonably well
- Fix the exception types in BarrierAwareOrbitSourceDecorator
- Fix the resource field path inflector for Orbit.js so it doesn't 'dasherize' relationships like 'plant_type'

### Removed

- Remove the default routes/views for the home and about pages to open those route paths up for plugins in the future

## [0.7.3] - 2022-09-10

### Fixed

- Clean up stale files as part of release GitHub action to reduce release/install size

## [0.7.2] - 2022-09-10

### Added

- Add slot to 'add plugin' FAB menu so plugins can define their own buttons there
- Add a list of group members to the asset page when viewing group assets
- Add a list of location occupants to the asset page when viewing location assets

### Changed

- Support double-clicking on an result in the EntitySearch component to choose it immediately
- Improve reactivity of asynchronously defined plugin functionality - slots/widgets/etc

### Fixed

- Fix MoveAssetActionProvider to use the new EntitySearch component and resolve a minor warning
- Fix Sidecar FloatingSidebar to use newly generalized EntityResolver component
- Fix styling of manage plugins page so 'add plugin' FAB does not obscure plugin tree actions
- Fix Orbit.js 'some' queries to use Drupal JSON:API 'IN' operator

## [0.7.1] - 2022-09-09

### Added

- Added entity selection component
- Support custom styles in Vue plugins
- Expose currently logged in user id via the connection status detector
- Add support for creating/uploading 'file--file' entities as part of creating/updating entities

### Changed

- Generalized asset searching/resolution functionality to work for all entity types

### Fixed

- Fix dev server proxy for default plugins repo to pass through module-scoped plugin urls
- Fix loading of asset relationship type enums to always be `undefined` or a non-empty list
- Fix warnings from OpenInFarmOSMetaActionProvider
- Fix searching by entity UUID
- Fix PhotoInput to only show capture button when it is supported
- Fix JSON:API permission issue so non-admin users can upload files
- Fix race condition where Orbit.js queries/updates can fail while online/offline status is changing
- Hide the edit action for plugins without loaded source code e.g. disabled plugins

## [0.6.3] - 2022-09-04

- Create a new component to render decoratable entity name text

### Changed

- Set the page title in index.html and upon route changes
- Refactored the asset name rendering to distinguish page title and asset name decorators
- Set the route title for the asset and manage plugins pages
- Change the archived asset name icon to use a unicode icon that can also be rendered as the `document.title`
- Use the entity name component to render asset names in the asset selector component
- Use the entity name component to render asset names in the asset hierarchy dialog

## [0.6.2] - 2022-09-03

### Added

- Add support for creating/uploading 'file--file' entities as part of changing asset relationships
- Add a photo input widget to make capturing or providing image files easier
- Add a pane to the asset visual carousel for uploading asset images

### Changed

- Autofocus the text search input when searching for assets
- Improve the styling of the asset visual carousel so the controls are easier to see
- Improve how asset photos are loaded so the 'file--file' entity can come from the local cache if available
- Improved plugin model documentation

### Fixed

- Change how relationship schemas are loaded so they are valid as Orbit.js models
- Remove example plugin that should not have been checked in

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

[unreleased]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha14...HEAD
[1.0.0-alpha14]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha13...unbuilt-v1.0.0-alpha14
[1.0.0-alpha13]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha12...unbuilt-v1.0.0-alpha13
[1.0.0-alpha12]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha11...unbuilt-v1.0.0-alpha12
[1.0.0-alpha11]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha10...unbuilt-v1.0.0-alpha11
[1.0.0-alpha10]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha9...unbuilt-v1.0.0-alpha10
[1.0.0-alpha9]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha8...unbuilt-v1.0.0-alpha9
[1.0.0-alpha8]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha7...unbuilt-v1.0.0-alpha8
[1.0.0-alpha7]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha6...unbuilt-v1.0.0-alpha7
[1.0.0-alpha6]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha5...unbuilt-v1.0.0-alpha6
[1.0.0-alpha5]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha4...unbuilt-v1.0.0-alpha5
[1.0.0-alpha4]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha3...unbuilt-v1.0.0-alpha4
[1.0.0-alpha3]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha2...unbuilt-v1.0.0-alpha3
[1.0.0-alpha2]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v1.0.0-alpha1...unbuilt-v1.0.0-alpha2
[1.0.0-alpha1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.13.0...unbuilt-v1.0.0-alpha1
[0.13.0]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.12.0...unbuilt-v0.13.0
[0.12.0]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.11.0...unbuilt-v0.12.0
[0.11.0]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.10.0...unbuilt-v0.11.0
[0.10.0]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.9.0...unbuilt-v0.10.0
[0.9.0]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.8.2...unbuilt-v0.9.0
[0.8.2]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.8.1...unbuilt-v0.8.2
[0.8.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.8.0...unbuilt-v0.8.1
[0.8.0]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.7.6...unbuilt-v0.8.0
[0.7.6]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.7.5...unbuilt-v0.7.6
[0.7.5]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.7.4...unbuilt-v0.7.5
[0.7.4]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.7.3...unbuilt-v0.7.4
[0.7.3]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.7.2...unbuilt-v0.7.3
[0.7.2]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.7.1...unbuilt-v0.7.2
[0.7.1]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.6.3...unbuilt-v0.7.1
[0.6.3]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.6.2...unbuilt-v0.6.3
[0.6.2]: https://github.com/symbioquine/farmOS_asset_link/compare/unbuilt-v0.6.1...unbuilt-v0.6.2
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

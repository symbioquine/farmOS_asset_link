# farmOS_asset_link

farmOS_asset_link - A.K.A "Asset Link" - is a contrib module for farmOS 2.x that supercharges links to your farmOS assets with an extensible hybrid
PWA experience.

*Note: Some branches and tags include only the built module. See the [development branch][development branch] for the full source code.*

## Installation

Use Composer and Drush to install farmOS_asset_link in farmOS 2.x;

```sh
composer require drupal/farmos_asset_link
drush en farmos_asset_link
```

*Available released versions can be viewed at https://www.drupal.org/project/farmos_asset_link*

## FAQs

### Why would I want to use Asset Link?

You like how farmOS stores your data, but need a simpler interface for use in the field or by less technical collaborators.

### What does Asset Link actually do?

* Adds a floating right side bar with actions to the regular farmOS asset pages
* Hosts an alternate light-weight page for each farmOS asset
* Exposes an API where other modules can provide actions and UI elements

### How does it work?

Asset Link does several things;

1. Injects some javascript into all farmOS asset pages which provides offline caching and controls for interacting with "asset link" functionality
2. Provides an alternate extensible action-driven mobile UX for interacting with farmOS assets
3. Exposes an API where other modules can customize the display/behavior of specific assets or asset types within the "asset link" UX

### That last answer sounds like Klingon (unintelligible) to me. Can you explain more simply why I would want this?

Asset Link makes it so new/existing links to your farmOS assets can have an alternate simplified interface which is more convenient for use
from mobile devices in the field.

### How is this different from FieldKit?

Asset Link and FieldKit are very similar in their end goals of providing a mobile-friendly interface to farmOS. Where they differ is in terms
of the strategy employed to provide that.

FieldKit is a separate app which requires internet access to (initially) load, then provides an alternate way to access and interact with farmOS.

On the other hand, Asset Link is installed on your server with farmOS and directly enhances the functionality of farmOS itself. Among other things,
this means that farmOS_asset_link can work in non-internet-connected environments.

## Development

From the [development branch][development branch] of this repository:

**Start/recreate the farmOS container;**

```sh
cd docker/
./destroy_and_recreate_containers.sh
```

**Run the dev proxy server;**

```sh
npm install
npm run dev
```

Access the info page at http://localhost:8080/alink/info

### Procedure for pushing new versions

From the [development branch][development branch] of this repository:

```sh
# Add/commit your changes
git add [...]
# Update NPM package version and commit
npm --no-git-tag-version version --force patch
git commit
# Tag the release with the unbuilt prefix
git tag unbuilt-v9000.0.1
# Push the development branch and new tag
git push --atomic origin HEAD:development unbuilt-v9000.0.1
```

[development branch]: https://github.com/symbioquine/farmOS_asset_link/tree/development

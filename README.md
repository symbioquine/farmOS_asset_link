# farmOS_asset_link

A contrib module for farmOS 2.x that supercharges links to your farmOS assets with an extensible hybrid PWA experience.

*Note: Some branches and tags include only the built module. See the [development branch][development branch] for the full source code.*

## Installation

Use Composer and Drush to install farmOS_asset_link in farmOS 2.x;

```sh
composer require symbioquine/farmos_asset_link
drush en farmos_asset_link
```

*Available released versions can be viewed at https://www.drupal.org/project/farmos_asset_link*

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

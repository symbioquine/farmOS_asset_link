## Installation

Find the desired Asset Link release at https://www.drupal.org/project/farmos_asset_link/releases

Install the desired Asset Link version;

```shell
composer require 'drupal/farmos_asset_link:^9000'
drush en farmos_asset_link
```

## Upgrading

Upgrade to the desired version;

```shell
composer require 'drupal/farmos_asset_link:^9001'
```

Import any config entity changes;

```shell
drush cim -y --partial --source=modules/farmos_asset_link/config/install
```

## Uninstallation

```shell
drush pm-uninstall farmos_asset_link
composer remove 'drupal/farmos_asset_link:^9001'
```

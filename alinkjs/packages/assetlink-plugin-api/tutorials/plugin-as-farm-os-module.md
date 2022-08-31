**name_bob_alink_plugin.info.yml**

```
name: Name Bob Plugin for farmOS Asset Link
description: Provides an Asset Link asset action to name an asset "bob"
type: module
package: farmOS Asset Link Plugins
core_version_requirement: ^9
dependencies:
  - farmos_asset_link
```

**NameBobAssetActionProvider.alink.js**

See {@tutorial simple-asset-action-plugin}.

**config/install/farmos_asset_link.asset_link_default_plugin.NameBobAssetActionProvider.yml**

```yml
langcode: en
status: true
id: NameBobAssetActionProvider
dependencies:
  enforced:
    module:
      - name_bob_alink_plugin
url: '{module:name_bob_alink_plugin}/NameBobAssetActionProvider.alink.js'
```

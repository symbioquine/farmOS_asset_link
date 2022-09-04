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

**Important:** If the plugin is named "NameBobAssetActionProvider.alink.js", then the `id` field of the config yml must be
"NameBobAssetActionProvider" and the yml file itself must be named "farmos_asset_link.asset_link_default_plugin.NameBobAssetActionProvider.yml".
All three must match, otherwise the plugin cannot be served/loaded correctly by the Asset Link Drupal controller.

Alternatively, plugins urls can be prefixed with `{base_path}` to make them relative to the Drupal installation base path.

Plugin urls can also be absolute (starting with `/`) to make them relative to the domain or even fully qualified urls to other domains - that final
case would of course require that the server hosting the plugins handle sending [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) correctly.

The only requirement in general for all plugin urls is that the last part of the URL path follow the naming pattern `{PluginName}.alink.{ext}`.
(e.g. NameBobAssetActionProvider.alink.js)

Check out the {@tutorial extension-model} guide for more information about plugins and their naming.

## Optional plugins

The `yml` file above could be placed in `config/optional/` and list additional dependencies to make the plugin optional.

In that case the Asset Link plugin will only be installed when all the dependnecies are also installed.

For example:

**config/optional/farmos_asset_link.asset_link_default_plugin.NameBobAssetActionProvider.yml**

```yml
langcode: en
status: true
id: NameBobAssetActionProvider
dependencies:
  enforced:
    module:
      - name_bob_alink_plugin
      - farm_material
url: '{module:name_bob_alink_plugin}/NameBobAssetActionProvider.alink.js'
```

Then the plugin would only be installed when the farmOS Material asset type is also available.

Here is the most cogent description of this feature I have located so far: https://lightning.acquia.com/blog/optional-config-weirdness-drupal-8

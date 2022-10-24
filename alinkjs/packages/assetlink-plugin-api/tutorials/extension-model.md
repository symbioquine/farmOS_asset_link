## Plugins

Almost everything user-facing in Asset Link is implemented via plugins. A plugin is just a file with some code or data in it that Asset Link
knows how to load - usually via HTTP. Asset Link plugins must be named using the pattern `{PluginName}.alink.{ext}`.

Support for Javascript and Vue.js plugins is built into Asset Link. Plugins ending with `alink.js` or `alink.vue` must be valid Javascript and Vue.js
respectively. Other file types can be supported by way of plugins that interpret them.

When they are loaded, JS/Vue plugins are passed an [`AssetLink` instance](IAssetLink.html) which serves as the API entry-point for Asset Link and a
[handle object](IAssetLinkPluginHandle.html) which is used to define the plugin's functionality.

## Plugin Lists (repositories)

```
https://somewhere.example.com/folder-z/MyPluginList.repo.json
```

```json
{
  "plugins": [
    {
      "url": "https://elsewhere.example.com/MyPluginA.alink.js"
    },
    {
      "url": "/MyPluginB.alink.vue"
    },
    {
      "url": "./MyPluginC.alink.json"
    },
    {
      "url": "../MyPluginD.alink.yml"
    }
  ]
}
```

Would load the following absolute plugins;

```
https://elsewhere.example.com/MyPluginA.alink.js
https://somewhere.example.com/MyPluginB.alink.vue
https://somewhere.example.com/folder-z/MyPluginC.alink.json
https://somewhere.example.com/MyPluginD.alink.yml
```

### Default/Local plugin list

A default plugin list is provided with Asset Link and is pre-populated with some core plugins.

> `https://my-farmos-server.example.com/alink/backend/default-plugins.repo.json`

Additionally, plugins may be added locally to a plugin list in browser storage.

> `indexeddb://asset-link/data/local-plugin-list.repo.json`

## Plugin Structure

### Javascript

When a Javascript plugin is loaded, the static `onLoad` method of the default export is invoked so it can perform any required setup.

```javascript
export default class MyPluginA {
  static onLoad(handle, assetLink) {
    // Do something to set up...
  }

  // Other methods...
}
```

### Vue

When a Vue.js plugin is loaded, the "plugin instance" is the uninstantiated Vue component. This means the `onLoad` method
is static on the top-level exported object, **not** within `methods` - as is used in Vue to define methods on the component itself.

```vue
<template>
  <span>Hi!</span>
</template>

<script>
export default {
  onLoad(handle, assetLink) {
    // Do something to set up... usually this will involve calling some method on `handle`
    // to tell Asset Link how the component in this plugin will be used.
  }
}
</script>
```

### Handle Object

The handle object which is passed into plugins' `onLoad` method is an instance of {@link IAssetLinkPluginHandle}. It provides some helpers
with validation for hooking into Asset Link's pluggable rendering system.

Importantly, the component class itself must be accessed via the `AssetLinkPluginHandle::thisPlugin` property.

## Pluggable Asset/Log Search

TODO

## Pluggable Rendering Overview

```
routes/pages > widgets
routes/pages > slots > widgets
```

* Plugins define "routes" and specify what should be rendered at those routes i.e. pages
* Plugins define "slots" that other plugins can request when rendering pages or other slots
* Plugins define "widget decorators" which other plugins can request as part of rendering pages or slots

### Routes

Plugins can define URL Paths (routes) within Asset Link - e.g. `https://my-farmos-server.example.com/alink/my-page/tuesday`.

```javascript
  static onLoad(handle, assetLink) {

    handle.defineRoute('com.example.farmos_asset_link.routes.v0.my_page', pageRoute => {
      // See https://router.vuejs.org/guide/essentials/dynamic-matching.html for route path format
      pageRoute.path("/my-page/:arg");

      pageRoute.component(SomeVueComponent);
    });

  }
```

### Slots

```javascript
  static onLoad(handle) {

    handle.defineSlot('com.example.farmos_asset_link.slots.v0.my_slot', pageSlot => {
      pageSlot.type('page-slot');

      pageSlot.showIf(context => context.pageName === 'asset-page');

      pageSlot.component(SomeVueComponent);

    });

  }
```

#### Shorthand

Asset Link also provides a shorthand for defining simple slots. Instead of the following;

```vue
<template>
  <q-btn flat dense to="/another/asset-link-page" icon="mdi-alarm-bell"></q-btn>
</template>

<script>
export default {
  onLoad(handle, assetLink) {

    handle.defineSlot('com.example.farmos_asset_link.slots.v0.my_slot', slot => {
      slot.type('toolbar-item');

      slot.component(handle.thisPlugin);
    });

  }
}
</script>
```

The same slot can be defined via an attribute on the `<template>` tag;

```vue
<template
    alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]="toolbar-item">
  <q-btn flat dense to="/another/asset-link-page" icon="mdi-alarm-bell"></q-btn>
</template>
```

#### Shorthand with `weight` and `appliesIf` Predicate Arguments

The shorthand syntax also supports providing some kinds of arguments. For example, the following;

```vue
<template>
  <q-btn flat dense to="/another/asset-link-page" icon="mdi-alarm-bell"></q-btn>
</template>

<script>
export default {
  onLoad(handle, assetLink) {

    handle.defineSlot('com.example.farmos_asset_link.slots.v0.my_slot', slot => {
      slot.type('toolbar-item');

      slot.weight(200);

      slot.showIf(context => context.pageName === 'asset-page');

      slot.component(handle.thisPlugin);
    });

  }
}
</script>
```

can be rewritten as follows;

```vue
<template
    alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]="toolbar-item(weight: 200, showIf: 'pageName === `asset-page`')">
  <q-btn flat dense to="/another/asset-link-page" icon="mdi-alarm-bell"></q-btn>
</template>
```

Where the expression string provided to the `showIf` argument is a valid [JMESPath expression](https://jmespath.org/).

#### Consuming Slots

```vue
<component
    v-for="slotDef in assetLink.getSlots({ type: 'page-slot', route: $route, pageName: 'asset-page', asset })"
    :key="slotDef.id"
    :is="slotDef.component"
    v-bind="slotDef.props"></component>
```

### Widget Decorators

```javascript
<template>
  <span><slot></slot> &#9774;</span>
</template>

<script>
export default {
  onLoad(handle) {

    handle.defineWidgetDecorator('com.example.farmos_asset_link.widget_decorator.v0.asset_name_with_peace_sign', widgetDecorator => {
      widgetDecorator.targetWidgetName('asset-name');

      widgetDecorator.appliesIf(context => context.asset.attributes.status !== 'archived');

      widgetDecorator.component(handle.thisPlugin);
    });

  }
}
</script>
```

***Note:** The above example uses a Vue.js slot to render the content it is decorating. The slot concept
seen here is different from Asset Link slots.*

#### Consuming Widget Decorators

```vue
<h2>Asset: <render-widget
      name="asset-name"
      :context="{ asset }"
      >{{ asset.attributes.name }}</render-widget>
</h2>
```

## Plugin Dependencies

Asset Link Plugins can be loaded/unloaded/reloaded at any time - though normally they change infrequently. As such, dependencies
between plugins must be flexible.

To achieve that flexibility, Asset Link employs a loose dependency model. Asset Link facilitates a few types of dependencies
explicitly - such as those related to rendering and to searching farmOS data. Beyond that, plugins can form more complex
dependencies via plugin ingestion.

### Plugin Ingestion

In its `onLoad` method a plugin may choose to be notified about every other plugin by defining a plugin ingestor;

```javascript
    handle.definePluginIngestor(pluginIngestor => {
      pluginIngestor.onEveryPlugin(plugin => {
        // Do something with every other plugin regardless of loading order...
      });
    });
```

The method passed to `pluginIngestor.onEveryPlugin` here will be called once immediately for each plugin that is already loaded and
later when any new plugins are loaded.

Notably, defining a plugin ingestor does not currently provide a way to subscribe to plugins being unloaded. Instead most side-effects
should occur via an "attributed handle";

```javascript
    handle.definePluginIngestor(pluginIngestor => {
      pluginIngestor.onEveryPlugin(plugin => {

        handle.onBehalfOf(plugin, attributedHandle => {
          // Asset Link will manage the lifecycle of routes/slots/etc defined via attributedHandle
        });

      });
    });
```

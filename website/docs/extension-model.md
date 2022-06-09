# Extension Model

## Plugins

Almost everything user-facing in Asset Link is implemented via plugins. A plugin is just a file with some code or data in it that Asset Link
knows how to load - usually via HTTP. Asset Link plugins must be named using the pattern `{PluginName}.alink.{ext}`.

Support for Javascript and Vue.js plugins is built into Asset Link. Plugins ending with `alink.js` or `alink.vue` must be valid Javascript and Vue.js
respectively. Other file types can be supported by way of plugins that interpret them.

When they are loaded, JS/Vue plugins are passed an instance of the `AssetLink` class which serves as the API entry-point for Asset Link.

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

## Plugin Dependencies

Asset Link Plugins can be loaded/unloaded/reloaded at any time - though normally they change infrequently. As such, dependencies
between plugins must be flexible.

To achieve that flexibility, Asset Link employs a loose dependency model. Asset Link facilitates a few types of dependencies
explicitly - such as those related to rendering and to searching farmOS data. Beyond that, plugins can access each other via
the `AssetLink` class `plugins` property which contains a list of all the currently loaded plugins. Since plugins can be loaded
in any order or change at any time, such access should either be stateless or should respond to changes in that list of plugins
appropriately.

https://v2.vuejs.org/v2/api/#vm-watch

## Plugin Structure

### Javascript

When a Javascript plugin is loaded, it is instantiated and the `onLoad` method is invoked so it can perform any required setup.

```javascript
export default class MyPluginA {
  onLoad(handle, assetLink) {
    // Do something to set up...
  }

  // Other methods...
}
```

### Vue

When a Vue.js plugin is loaded, the "plugin instance" is the uninstantiated Vue component. In particular this means the `onLoad` method
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

The handle object which is passed into plugin's `onLoad` methods is an instance of [AssetLinkPluginHandle](TODO). It provides some helpers
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
  onLoad(handle, assetLink) {

    handle.defineRoute('com.example.farmos_asset_link.routes.v0.my_page', pageRoute => {
      // See https://v3.router.vuejs.org/guide/essentials/dynamic-matching.html for route path format
      pageRoute.path("/my-page/:arg");

      // `wrapper` is the component which is delegating to this render function
      // `h` (a.k.a. `createElement`) is Vue.js' Virtual DOM rendering function
      pageRoute.componentFn((wrapper, h) => h(SomeVueComponent));
    });

  }
```

### Slots

```javascript
  onLoad(handle) {

    handle.defineSlot('com.example.farmos_asset_link.slots.v0.my_slot', pageSlot => {
      pageSlot.type('page-slot');

      pageSlot.showIf(context => context.pageName === 'asset-page');

      pageSlot.componentFn((wrapper, h, context) => {
        return h(SomeVueComponent});
      });

    });

  }
```

#### Consuming Slots

```vue
<render-fn-wrapper
  v-for="slotDef in assetLink.getSlots({ type: 'page-slot', route: $route, pageName: 'asset-page', asset })" :key="slotDef.id"
  :render-fn="slotDef.componentFn"
></render-fn-wrapper>
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

      widgetDecorator.componentFn((wrapper, h, context, children) => {
        return h(handle.thisPlugin, { props: { asset: context.asset } }, children);
      });

    });

  }
}
</script>
```

***Note:** The above example uses a Vue.js slot to render the content it is decorating which is passed through the component
function via the `children` argument. The slot concept seen here is different from Asset Link slots.*

#### Consuming Widget Decorators

```vue
  <h2>Asset: <render-widget
        name="asset-name"
        :context="{ asset }"
        >{{ asset.attributes.name }}</render-widget>
  </h2>
```

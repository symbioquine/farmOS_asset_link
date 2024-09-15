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

#### Shorthand

Asset Link provides a shorthand for defining simple routes. The above route can be written like this;

```vue
<template alink-route[com.example.farmos_asset_link.routes.v0.my_page]="/my-page/:arg">
  <q-page padding class="text-left">
    <h4>My Custom page</h4>
    ...
  </q-page>
</template>
```

#### Params

If a route has params in the URL, those will be passed as string props to the Vue component.

For example;

```vue
<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});
</script>

<template alink-route[com.example.farmos_asset_link.routes.v0.greeter]="/greet/:name">
  <q-page padding class="text-left">
    <h4>Welcome {{ props.name }}</h4>
  </q-page>
</template>
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
    alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]="toolbar-item(weight: 200, showIf: 'pageName == `asset-page`')">
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

#### Slot Multiplexing

Sometimes a single slot should render multiple times based on a given context. In this scenario a context multiplexing function may be supplied
which maps from the context to N contexts which are used to render the slot multiple times.

```vue
<script setup>
const props = defineProps({
  symbol: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <q-btn flat dense to="/another/asset-link-page" :label="props.symbol"></q-btn>
</template>

<script>
export default {
  onLoad(handle, assetLink) {

    handle.defineSlot('com.example.farmos_asset_link.slots.v0.my_slot', slot => {
      slot.type('toolbar-item');

      slot.multiplexContext(context => ['\u{1F648}', '\u{1F649}', '\u{1F64A}'].map(wiseMonkey => ({ symbol: wiseMonkey })));

      slot.component(handle.thisPlugin);
    });

  }
}
</script>
```

#### Slot Multiplexing Shorthand

```vue
<script setup>
const props = defineProps({
  symbol: {
    type: String,
    required: true,
  },
});
</script>

<template alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]=
          'toolbar-item(multiplexContext: "[`\\uD83D\\uDE48`, `\\uD83D\\uDE49`, `\\uD83D\\uDE4A`][*].{ symbol: @ }")'>
  <q-btn flat dense to="/another/asset-link-page" :label="props.symbol"></q-btn>
</template>
```

> ![](./wise_monkeys_toolbar_items.png)

The above example is only slightly complicated by the detail that we're using an array literal of unicode characters that must be represented
with two escape characters. See http://www.russellcottrell.com/greek/utilities/SurrogatePairCalculator.htm For most practical purposes one would
actually be using JMESPath to transform the original context, not hard-code unicode characters, but it is still a fun example - thus included here.

More practically, here is another example showing the image relationships on an asset being multiplexed into multiple contexts - each of which
is rendered as text in a div;

```vue
<script setup>
const props = defineProps({
  imgRef: {
    type: Object,
    required: true,
  },
});
</script>

<template alink-slot[com.example.farmos_asset_link.slots.v0.image_ids]=
    'page-slot(showIf: "pageName == `asset-page`", multiplexContext: "asset.relationships.image.data[*].{ imgRef: @ }")'>
  <div>Image: {{ props.imgRef.type }} - {{ props.imgRef.id }}</div>
</template>
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

      widgetDecorator.weight(150);

      widgetDecorator.component(handle.thisPlugin);
    });

  }
}
</script>
```

***Note:** The above example uses a Vue.js slot to render the content it is decorating. The slot concept
seen here is different from Asset Link slots.*

#### Shorthand

Asset Link provides a shorthand for defining simple widget decorators. The above widget decorator can be written like this;

```vue
<template
    alink-widget-decorator[com.example.farmos_asset_link.widget_decorator.v0.asset_name_with_peace_sign]
      ="asset-name(weight: 150, appliesIf: 'asset.attributes.status != `archived`')">
  <span><slot></slot> &#9774;</span>
</template>
```

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
dependencies via plugin ingestion and plugin libraries.

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
          // Asset Link will manage the lifecycle of routes/slots/libraries/etc defined via attributedHandle
        });

      });
    });
```

### Plugin Libraries

Another common use-case is providing and consuming logic (or potentially state) from other plugins.

This can be achieved via the `provideLibrary` method in a plugin's `onLoad` and consumed using `import` statements in other plugins.

```javascript
    handle.provideLibrary('com.example.farmos_asset_link.libraryA', library => {
      library.provides(libraryA);
    });
```

The `libraryA` object passed can be any Javascript object. Then the `libraryA` object can be imported from another plugin.

```javascript
import libraryA from 'plugin-library:com.example.farmos_asset_link.libraryA';
```

It is also possible to do the following in an `async` context;

```javascript
const libraryA = await import('plugin-library:com.example.farmos_asset_link.libraryA');
```

In theory the promise returned by the `import` method could be used to conditionally provide alternate logic until/unless a given library is provided, but that should be rarely needed.

#### Missing Dependencies

If a plugin library dependency is not available, plugin loading and/or the execution of the plugin's `onLoad` method will be blocked until the required library becomes available.

#### Reloaded/Unloaded Dependencies

If a plugin `A` depends on another plugin `B`'s library and plugin `B` is reloaded/unloaded, plugin `A` will get reloaded also. In this way, a library could be updated and all its dependent plugins
would be updated as well.

#### Library Versions

Asset Link supports plugin libraries optionally specifying a [semantic version v2.0.0 string](https://semver.org/). Not specifying a version is equivalent to specifying version '0.0.1-alpha.1'.

```javascript
    handle.provideLibrary('com.example.farmos_asset_link.libraryA', library => {
      library.version('1.2.3');
      library.provides(libraryA);
    });
```

Dependent plugins can similarly specify a version requirement. If the required version is not available (yet?) it is equivalent to the plugin library not being loaded at all. Not specifying a version requirement is equivalent to accepting any version.

```javascript
// Require version >= 1.2.* and < 2.*.*
const libraryA = await import('plugin-library:com.example.farmos_asset_link.libraryA:^1.2');
```

It should be rare, but this means that multiple versions of the same library can coexist and be depended on by different plugins. Asset Link does impose the restriction that a given plugin can only depend on a single version of a particular library though.

Further, Asset Link eagerly satisfies library dependencies. If multiple versions of a library are available that would satisfy a dependency, Asset Link will choose the one with the largest version. However, it does not wait for all libraries to load before choosing so cannot guarantee that the version used *will* be the largest version by the time all the plugins have loaded/reloaded/etc. Thus, it is best to make library dependencies unambiguous and/or only have a single version of each library loaded at any time.

When considering the larger set of plugins loaded in Asset Link, it is the site admin's (or occasionally the user's) responsibility to make sure that the plugins all work together. We must recognize that it is not a tractable problem to capture all the nuances of code/dependency compatibility with versions and version requirements.

#### Asynchronous Library Loading

Libraries must be declared synchronously within a plugin's `onLoad` method. However, it is possible to pass a promise as the second argument to `handle.provideLibrary`. In that case, dependent plugin's `import` statements will not resolve until that promise is itself resolved.

#### Dependency Cycles

Due to the nature of this library mechanism, dependency cycles (e.g. Where `libraryA` depends on `libraryB` which itself depends on `libraryA`) do not cause an infinite loop or any other serious problems, however, they also do not work. A cycle would prevent any of the dependent functionality from actually ever becoming available.

In the future such cycles may be detected and reported, but for now Asset Link silently ignores them.

#### Library Delays and Dependency Tree Depth

Asset Link naively loads plugins in the order it encounters them. This means that, during loading, there may be some time when a library dependency is unavailable because the providing plugin just has not loaded yet. Usually this is not a problem, but sometimes the changes in functionality as plugins eventually load could be jarring to the user. The best way to avoid that is to keep the depth of the dependency tree fairly shallow and to ensure plugins that provide libraries load quickly - especially where they may be deeply depended on.

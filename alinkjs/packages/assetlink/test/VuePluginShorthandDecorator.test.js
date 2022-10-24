import { parseComponent } from 'vue-template-compiler';
import jmespath from 'jmespath';

import VuePluginShorthandDecorator from '../src/VuePluginShorthandDecorator';



test('jmespath learning tests', () => {
  expect(jmespath.search({ asset: { attributes: { status: 'pending' } } }, 'asset.attributes.status == `pending`')).toBe(true);
  expect(jmespath.search({ pageName: 'asset-page', other: 'value0' }, 'pageName == `asset-page`')).toBe(true);
});


test('route shorthand', () => {
  const rawPluginSource = `
    <script setup>
    </script>
    <template alink-route[com.example.farmos_asset_link.routes.v0.my_page]="/my-page/:arg">
      <span>Hello from Vue!</span>
    </template>
  `;

  const { handle } = decorateAndCallOnload(rawPluginSource);

  expect(handle.defineRoute.mock.calls[0][0]).toBe("com.example.farmos_asset_link.routes.v0.my_page");

  const routeHandle = {
      path: jest.fn(),
      component: jest.fn(),
  };

  handle.defineRoute.mock.calls[0][1](routeHandle);

  expect(routeHandle.path.mock.calls[0][0]).toBe("/my-page/:arg");
  expect(routeHandle.component.mock.calls[0][0]).toBe(handle.thisPlugin);
});

test('slot shorthand', () => {
  const rawPluginSource = `
    <script setup>
    </script>
    <template alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]="toolbar-item">
      <span>Hello from Vue!</span>
    </template>
  `;

  const { handle } = decorateAndCallOnload(rawPluginSource);

  expect(handle.defineSlot.mock.calls[0][0]).toBe("com.example.farmos_asset_link.slots.v0.my_slot");

  const slotHandle = {
      type: jest.fn(),
      component: jest.fn(),
  };

  handle.defineSlot.mock.calls[0][1](slotHandle);

  expect(slotHandle.type.mock.calls[0][0]).toBe("toolbar-item");
  expect(slotHandle.component.mock.calls[0][0]).toBe(handle.thisPlugin);
});

test('slot shorthand with weight', () => {
  const rawPluginSource = `
    <script setup>
    </script>
    <template alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]="toolbar-item(weight: 10)">
      <span>Hello from Vue!</span>
    </template>
  `;

  const { handle } = decorateAndCallOnload(rawPluginSource);

  expect(handle.defineSlot.mock.calls[0][0]).toBe("com.example.farmos_asset_link.slots.v0.my_slot");

  const slotHandle = {
      type: jest.fn(),
      weight: jest.fn(),
      component: jest.fn(),
  };

  handle.defineSlot.mock.calls[0][1](slotHandle);

  expect(slotHandle.type.mock.calls[0][0]).toBe("toolbar-item");
  expect(slotHandle.weight.mock.calls[0][0]).toBe(10);
  expect(slotHandle.component.mock.calls[0][0]).toBe(handle.thisPlugin);
});

test('slot shorthand with showIf predicate', () => {
  const rawPluginSource = `
    <script setup>
    </script>
    <template alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]='\t\t\n\rtoolbar-item ( showIf  : \t"asset.\\"attributes\\".status"\n )   '>
      <span>Hello from Vue!</span>
    </template>
  `;

  const { handle } = decorateAndCallOnload(rawPluginSource);

  expect(handle.defineSlot.mock.calls[0][0]).toBe("com.example.farmos_asset_link.slots.v0.my_slot");

  const slotHandle = {
      type: jest.fn(),
      showIf: jest.fn(),
      component: jest.fn(),
  };

  handle.defineSlot.mock.calls[0][1](slotHandle);

  expect(slotHandle.type.mock.calls[0][0]).toBe("toolbar-item");
  expect(slotHandle.component.mock.calls[0][0]).toBe(handle.thisPlugin);

  const predicate = slotHandle.showIf.mock.calls[0][0];

  expect(predicate({ asset: { attributes: { status: 'pending' } } })).toBeTruthy();
  expect(predicate({ asset: { attributes: { status: 'done' } } })).toBeTruthy();
  expect(predicate({ asset: { attributes: {  } } })).toBeFalsy();
  expect(predicate({ asset: {  } })).toBeFalsy();
  expect(predicate({})).toBeFalsy();
});

test('slot shorthand with broken showIf predicate - missing colon', () => {
  const rawPluginSource = `
    <script setup>
    </script>
    <template alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]="toolbar-item(showIf 'asset.attributes.status')">
      <span>Hello from Vue!</span>
    </template>
  `;

  expect(() => decorateAndCallOnload(rawPluginSource)).toThrow(/^Plugin shorthand args must have the arg name followed by a colon ':'\. Got: 'showIf 'asset\.attributes\.status''$/);
});

test('slot shorthand with broken showIf predicate - missing end quote', () => {
  const rawPluginSource = `
    <script setup>
    </script>
    <template alink-slot[com.example.farmos_asset_link.slots.v0.my_slot]="toolbar-item(showIf: 'asset.attributes.status)">
      <span>Hello from Vue!</span>
    </template>
  `;

  expect(() => decorateAndCallOnload(rawPluginSource)).toThrow(/^Plugin shorthand arg 'showIf' value has unclosed quotes\.$/);
});



test('widget decorator shorthand with appliesIf predicate and weight', () => {
  const rawPluginSource = `
    <template
        alink-widget-decorator[com.example.farmos_asset_link.widget_decorator.v0.asset_name_with_peace_sign]
          ="asset-name(weight: 150, appliesIf: 'asset.attributes.status != \`archived\`')">
      <span><slot></slot> &#9774;</span>
    </template>
  `;

  const { handle } = decorateAndCallOnload(rawPluginSource);

  expect(handle.defineWidgetDecorator.mock.calls[0][0]).toBe("com.example.farmos_asset_link.widget_decorator.v0.asset_name_with_peace_sign");

  const widgetDecoratorHandle = {
      targetWidgetName: jest.fn(),
      weight: jest.fn(),
      appliesIf: jest.fn(),
      component: jest.fn(),
  };

  handle.defineWidgetDecorator.mock.calls[0][1](widgetDecoratorHandle);

  expect(widgetDecoratorHandle.targetWidgetName.mock.calls[0][0]).toBe("asset-name");
  expect(widgetDecoratorHandle.weight.mock.calls[0][0]).toBe(150);
  expect(widgetDecoratorHandle.component.mock.calls[0][0]).toBe(handle.thisPlugin);

  const predicate = widgetDecoratorHandle.appliesIf.mock.calls[0][0];

  expect(predicate({ asset: { attributes: { status: 'archived' } } })).toBeFalsy();
  expect(predicate({ asset: { attributes: { status: 'active' } } })).toBeTruthy();
  expect(predicate({ asset: { attributes: {  } } })).toBeTruthy();
  expect(predicate({ asset: {  } })).toBeTruthy();
  expect(predicate({})).toBeTruthy();
});

function decorateAndCallOnload(rawPluginSource) {
  const component = parseComponent(rawPluginSource);

  const pluginDecorator = VuePluginShorthandDecorator.composeDecorator(p => p, component);

  const pluginInstance = {};

  const decoratedPluginInstance = pluginDecorator(pluginInstance);

  const handle = {
      defineRoute: jest.fn(),
      defineSlot: jest.fn(),
      defineWidgetDecorator: jest.fn(),
      thisPlugin: jest.fn(),
  };
  const assetLink = {};

  decoratedPluginInstance.onLoad(handle, assetLink);

  return {
    handle,
  };
}

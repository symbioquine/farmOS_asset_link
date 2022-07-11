export default class VuePluginShorthandDecorator {
  /**
   * Examines the Vue plugin component and returns a new decorator which defines routes/slots/etc
   * based on the shorthand syntax.
   */
  static composeDecorator(existingPluginDecorator, component) {
    if (!component.template) {
      return existingPluginDecorator;
    }
  
    const shorthandRoutes = {};
    const shorthandSlots = {};
    for (const [key, value] of Object.entries(component.template.attrs || {})) {
      if (key.indexOf("alink-slot") !== -1) {
        const m = key.match(/alink-slot\[([\w\.]+)\]/);
        if (!m) {
          throw new Error(`Plugin slot shorthand must be in the format 'alink-slot[my.unique.identifier]="slot-type"' or 'alink-slot[my.unique.identifier]="slot-type(weight: 99)"'. Got: '${key}="${value}"'`);
        }
        const slotName = m[1];
  
        let slotType = value;
        let slotWeight = undefined;
        if (value.indexOf("(") !== -1 || value.indexOf(")") !== -1) {
          const n = value.match(/([^\(]+)\(\s*weight\s*:\s*(\d+)\s*\)/);
          if (!n) {
            throw new Error(`Plugin slot shorthand must be in the format 'alink-slot[my.unique.identifier]="slot-type"' or 'alink-slot[my.unique.identifier]="slot-type(weight: 99)"'. Got: '${key}="${value}"'`);
          }
          slotType = n[1];
          slotWeight = parseInt(n[2]);
        }
  
        shorthandSlots[slotName] = {
            type: slotType,
            weight: slotWeight,
        };
      }
  
      if (key.indexOf("alink-route") !== -1) {
        const m = key.match(/alink-route\[([\w\.]+)\]/);
        if (!m) {
          throw new Error(`Plugin route shorthand must be in the format 'alink-route[my.unique.identifier]="/my/path"'`);
        }
        const routeName = m[1];
  
        const routePath = value;
  
        shorthandRoutes[routeName] = {
            path: routePath,
        };
      }
  
    }
  
    if (Object.keys(shorthandRoutes).length === 0 && Object.keys(shorthandSlots).length === 0) {
      return existingPluginDecorator;
    }
  
    const newPluginDecorator = (pluginInstance) => {
      let p = existingPluginDecorator(pluginInstance);
  
      const existingOnLoadFn = p.onLoad;
  
      p.onLoad = (handle, assetLink) => {
        if (typeof existingOnLoadFn === 'function') {
          existingOnLoadFn(handle, assetLink);
        }
  
        for (const [routeName, routeParams] of Object.entries(shorthandRoutes)) {
          handle.defineRoute(routeName, pageRoute => {
            pageRoute.path(routeParams.path);
            pageRoute.component(handle.thisPlugin);
          });
        }
  
        for (const [slotName, slotParams] of Object.entries(shorthandSlots)) {
          handle.defineSlot(slotName, slot => {
            slot.type(slotParams.type);
            if (slotParams.weight !== undefined) {
              slot.weight(slotParams.weight);
            }
            slot.component(handle.thisPlugin);
          });
        }
  
      };
  
      return p;
    };
  
    return newPluginDecorator;
  }
}
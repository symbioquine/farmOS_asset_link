import jmespath from 'jmespath';

export default class VuePluginShorthandDecorator {
  /**
   * Examines the Vue plugin component and returns a new decorator which defines routes/slots/etc
   * based on the shorthand syntax.
   */
  static composeDecorator(existingPluginDecorator, component) {
    const template = component?.descriptor?.template;
    if (!template) {
      return existingPluginDecorator;
    }

    const shorthandRoutes = {};
    const shorthandSlots = {};
    const shorthandWidgetDecorators = {};
    for (const [key, value] of Object.entries(template.attrs || {})) {
      if (key.indexOf("alink-route") !== -1) {
        const { routeName, routeParams } = parseShorthandRoute(key, value);
        shorthandRoutes[routeName] = routeParams;
      }

      if (key.indexOf("alink-slot") !== -1) {
        const { slotName, slotParams } = parseShorthandSlot(key, value);
        shorthandSlots[slotName] = slotParams;
      }

      if (key.indexOf("alink-widget-decorator") !== -1) {
        const { widgetDecoratorName, widgetDecoratorParams } = parseShorthandWidgetDecorator(key, value);
        shorthandWidgetDecorators[widgetDecoratorName] = widgetDecoratorParams;
      }

    }

    if (
        Object.keys(shorthandRoutes).length === 0 &&
        Object.keys(shorthandSlots).length === 0 &&
        Object.keys(shorthandWidgetDecorators).length === 0) {
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
            if (slotParams.showIf !== undefined) {
              slot.showIf(slotParams.showIf);
            }
            if (slotParams.multiplexContext !== undefined) {
              slot.multiplexContext(slotParams.multiplexContext);
            }
            slot.component(handle.thisPlugin);
          });
        }

        for (const [widgetDecoratorName, widgetDecoratorParams] of Object.entries(shorthandWidgetDecorators)) {
          handle.defineWidgetDecorator(widgetDecoratorName, widgetDecorator => {
            widgetDecorator.targetWidgetName(widgetDecoratorParams.targetWidgetName);
            if (widgetDecoratorParams.weight !== undefined) {
              widgetDecorator.weight(widgetDecoratorParams.weight);
            }
            if (widgetDecoratorParams.appliesIf !== undefined) {
              widgetDecorator.appliesIf(widgetDecoratorParams.appliesIf);
            }
            widgetDecorator.component(handle.thisPlugin);
          });
        }

      };

      return p;
    };
  
    return newPluginDecorator;
  }
}

function parseShorthandRoute(key, value) {
  const m = key.match(/alink-route\[([\w\.]+)\]/);
  if (!m) {
    throw new Error(`Plugin route shorthand must be in the format 'alink-route[my.unique.identifier]="/my/path"'`);
  }
  const routeName = m[1];

  const routePath = value;

  return {
    routeName,
    routeParams: {
      path: routePath,
    },
  };
}

function parseArgs(rawArgStr) {
  const args = [];

  let offsetIdx = 0;

  // Each iteration finds an arg name
  while(offsetIdx < rawArgStr.length) {
    const argSepIdx = rawArgStr.indexOf(':', offsetIdx);

    if (argSepIdx === -1 && rawArgStr.slice(offsetIdx).trim().length > 0) {
      throw new Error(`Plugin shorthand args must have the arg name followed by a colon ':'. Got: '${rawArgStr.slice(offsetIdx)}'`);
    }

    const argName = rawArgStr.slice(offsetIdx, argSepIdx).trim();

    if (!argName.match(/\w+/)) {
      throw new Error(`Plugin shorthand args with invalid name: '${argName}'`);
    }

    offsetIdx = argSepIdx + 1;

    // Drop any leading whitespace
    while(offsetIdx < rawArgStr.length && !rawArgStr.at(offsetIdx).trim().length) {
      offsetIdx += 1;
    }

    // Bail if there's no value
    if (offsetIdx >= rawArgStr.length || rawArgStr.at(offsetIdx) === ',') {
      throw new Error(`Plugin shorthand args must have a value following the arg name. No value for arg '${argName}'`);
    }

    let quoteType = undefined;
    if (["'", '"'].includes(rawArgStr.at(offsetIdx))) {
      quoteType = rawArgStr.at(offsetIdx);
      offsetIdx += 1;
    }

    let rawArgValue = "";

    let quotesClosed = false;
    let nextEscaped = false;
    while(offsetIdx < rawArgStr.length) {
      const c = rawArgStr.at(offsetIdx);

      if (nextEscaped) {
        rawArgValue += c;
        nextEscaped = false;
        offsetIdx += 1;
        continue;
      }

      if (c === '\\') {
        nextEscaped = true;
        offsetIdx += 1;
        continue;
      }

      if (c === ',' && !quoteType) {
        offsetIdx += 1;
        break;
      }

      if (rawArgStr.at(offsetIdx) === quoteType) {
        quotesClosed = true;
        let argEndIdx = rawArgStr.indexOf(',', offsetIdx);
        if (argEndIdx === -1) {
          argEndIdx = rawArgStr.length;
        }

        const argEndChars = rawArgStr.slice(offsetIdx + 1, argEndIdx).trim();

        if (argEndChars.length) {
          throw new Error(`Plugin shorthand args in quotes cannot have text following the quotes. Got: '${argEndChars}' after value for arg '${argName}'`);
        }

        offsetIdx = argEndIdx + 1;
        break;
      }

      rawArgValue += c;
      offsetIdx += 1;
    }

    if (quoteType && !quotesClosed) {
      throw new Error(`Plugin shorthand arg '${argName}' value has unclosed quotes.`);
    }

    if (!quoteType) {
      if (!rawArgValue.match(/\s*(\d+)\s*/)) {
        throw new Error(`Plugin shorthand arg '${argName}' has an unsupported value. Only quoted strings and integers are currently supported.`);
      }
      rawArgValue = parseInt(rawArgValue);
    }

    args.push([argName, rawArgValue]);
  }

  return args;
}

function parseShorthandSlot(key, value) {
  const m = key.match(/alink-slot\[([\w\.]+)\]/);
  if (!m) {
    throw new Error(`Plugin slot shorthand must be in the format 'alink-slot[my.unique.identifier]="slot-type"' or 'alink-slot[my.unique.identifier]="slot-type(weight: 99)"'. Got: '${key}="${value}"'`);
  }
  const slotName = m[1];

  let slotType = value;
  let slotWeight = undefined;
  let slotPredicate = undefined;

  const openingArgParenIdx = value.indexOf("(");
  const closingArgParenIdx = value.lastIndexOf(")");

  const fmtError = () => `Plugin slot shorthand must be in the format 'alink-slot[my.unique.identifier]="slot-type"' or 'alink-slot[my.unique.identifier]="slot-type(weight: 99)"'. Got: '${key}="${value}"'`;

  let args = [];
  if (openingArgParenIdx !== -1) {
    if (closingArgParenIdx < openingArgParenIdx) {
      throw new Error(fmtError());
    }

    slotType = value.slice(0, openingArgParenIdx).trim();

    const rawArgStr = value.slice(openingArgParenIdx + 1, closingArgParenIdx).trim();

    args = parseArgs(rawArgStr);
  }

  const slotParams = {
      type: slotType,
  };

  args.forEach(([argName, argValue]) => {
    if (argName === 'weight') {
      if (typeof argValue !== 'number') {
        throw new Error(`Got invalid (non-numeric) weight for shorthand slot: '${slotName}'`);
      }
      if (slotParams.weight !== undefined) {
        throw new Error(`Got multiple weight values for shorthand slot: '${slotName}'`);
      }
      slotParams.weight = argValue;
      return;
    }

    if (argName === 'showIf') {
      if (typeof argValue !== 'string') {
        throw new Error(`Got invalid (non-string) showIf predicate for shorthand slot: '${slotName}'`);
      }
      if (slotParams.showIf !== undefined) {
        throw new Error(`Got multiple showIf predicates for shorthand slot: '${slotName}'`);
      }
      slotParams.showIf = (context) => !!jmespath.search(context, argValue);
      return;
    }

    if (argName === 'multiplexContext') {
      if (typeof argValue !== 'string') {
        throw new Error(`Got invalid (non-string) multiplexContext function for shorthand slot: '${slotName}'`);
      }
      if (slotParams.multiplexContext !== undefined) {
        throw new Error(`Got multiple multiplexContext function for shorthand slot: '${slotName}'`);
      }
      slotParams.multiplexContext = (context) => jmespath.search(context, argValue);
      return;
    }

    throw new Error(`Got unknown arg '${argName}' for shorthand slot: '${slotName}'`);
  });

  return {
    slotName,
    slotParams,
  };
}

function parseShorthandWidgetDecorator(key, value) {
  const m = key.match(/alink-widget-decorator\[([\w\.]+)\]/);
  if (!m) {
    throw new Error(`Plugin widget decorator shorthand must be in the format 'alink-widget-decorator[my.unique.identifier]="target-widget-name"' or 'alink-widget-decorator[my.unique.identifier]="target-widget-name(weight: 99)"'. Got: '${key}="${value}"'`);
  }
  const widgetDecoratorName = m[1];

  let targetWidgetName = value;
  let slotWeight = undefined;
  let slotPredicate = undefined;

  const openingArgParenIdx = value.indexOf("(");
  const closingArgParenIdx = value.lastIndexOf(")");

  const fmtError = () => `Plugin slot shorthand must be in the format 'alink-slot[my.unique.identifier]="slot-type"' or 'alink-slot[my.unique.identifier]="slot-type(weight: 99)"'. Got: '${key}="${value}"'`;

  let args = [];
  if (openingArgParenIdx !== -1) {
    if (closingArgParenIdx < openingArgParenIdx) {
      throw new Error(fmtError());
    }

    targetWidgetName = value.slice(0, openingArgParenIdx).trim();

    const rawArgStr = value.slice(openingArgParenIdx + 1, closingArgParenIdx).trim();

    args = parseArgs(rawArgStr);
  }

  const widgetDecoratorParams = {
      targetWidgetName,
  };

  args.forEach(([argName, argValue]) => {
    if (argName === 'weight') {
      if (typeof argValue !== 'number') {
        throw new Error(`Got invalid (non-numeric) weight for shorthand slot: '${slotName}'`);
      }
      if (widgetDecoratorParams.weight !== undefined) {
        throw new Error(`Got multiple weight values for shorthand slot: '${slotName}'`);
      }
      widgetDecoratorParams.weight = argValue;
      return;
    }

    if (argName === 'appliesIf') {
      if (typeof argValue !== 'string') {
        throw new Error(`Got invalid (non-string) appliesIf predicate for shorthand widget decorator: '${widgetDecoratorName}'`);
      }
      if (widgetDecoratorParams.appliesIf !== undefined) {
        throw new Error(`Got multiple appliesIf predicates for shorthand widget decorator: '${widgetDecoratorName}'`);
      }
      widgetDecoratorParams.appliesIf = (context) => !!jmespath.search(context, argValue);
      return;
    }

    throw new Error(`Got unknown arg '${argName}' for shorthand widget decorator: '${widgetDecoratorName}'`);
  });

  return {
    widgetDecoratorName,
    widgetDecoratorParams,
  };
}

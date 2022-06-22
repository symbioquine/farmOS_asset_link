import { v4 as uuidv4 } from 'uuid';

export default class AssetLinkUI {

  constructor(app) {
    this._app = app;
  }

  /**
   * Provide some basic components to support Asset Link plugins defined as single (uncompiled) JS
   * files.
   * 
   * Commonly accessed via `assetLink.ui.c` e.g. `h(assetLink.ui.c.VBtn, { props: ...`
   */
  get c() {
    return {
      // VBtn,
      // VListItem,
      // VListItemTitle,
    };
  }

  /**
   * 
   */
  get dialog() {
    return {
      confirm: async (text) => {
        return await this._app.$dialog.confirm({
          text,
          title: 'Confirmation'
        });
      },
      promptText: async (text) => {
        return await this._app.$dialog.prompt({
          text,
          title: 'Input',
        });
      },
      custom: async (component, params) => {
        const id = uuidv4();

        // const context = new Vue({});

        const result = await new Promise(resolve => {
          // context.$on('submit', resolve);

          this._app.dialogs.push({
            id,
            // context,
            componentFn: (wrapper, h) =>
              h(VDialog, {
                props: { value: true, fullscreen: true },
                on: {
                  input: () => resolve(undefined),
                },
              },  [h(component, {ref: 'dialogComponent', ...params})] ),
          });
        });

        this._app.dialogs = this._app.dialogs.filter(d => d.id !== id);

        return result;
      },
    };
  }

}

import {
  QBtn,
  Dialog,
} from 'quasar';

export default class AssetLinkUI {

  constructor(app, rootComponent) {
    this._app = app;
    this._rootComponent = rootComponent;
  }

  /**
   * Provide some basic components to support Asset Link plugins defined as single (uncompiled) JS
   * files.
   * 
   * Commonly accessed via `assetLink.ui.c` e.g. `h(assetLink.ui.c.VBtn, { props: ...`
   */
  get c() {
    return {
      QBtn,
      // VListItem,
      // VListItemTitle,
    };
  }

  /**
   * Provides a thin promise wrapper around Quasar dialogs.
   */
  async createDialog(opts) {
    return new Promise(resolve => {
      Dialog.create(opts).onOk(data => {
        resolve(data);
      }).onCancel(() => {
        resolve(undefined);
      });
    });
  }

  /**
   * Helpers for some common dialog use-cases.
   */
  get dialog() {
    return {
      confirm: async (text) => {
        return new Promise(resolve => {
          Dialog.create({
            title: 'Confirmation',
            message: text,
            cancel: true,
            persistent: true
          }).onOk(() => {
            resolve(true);
          }).onCancel(() => {
            resolve(false);
          });
        });
        
      },
      promptText: async (text) => {
        return await this.createDialog({
          title: 'Prompt',
          message: text,
          prompt: {
            model: '',
            type: 'text'
          },
          cancel: true,
          persistent: true
        });
      },
      custom: async (component, componentProps) => {
        return await this.createDialog({
          component,
          componentProps,
          cancel: true,
          persistent: true
        });
      },
    };
  }

}

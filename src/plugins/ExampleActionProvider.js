import Vue from 'vue';

/* eslint-disable class-methods-use-this, no-underscore-dangle */
class ExampleAction {

  constructor(key, name, enactor) {
    this._key = key;
    this._name = name;
    this._enactor = enactor;
  }

  key() {
    return this._key;
  }

  component() {
    const self = this;

    return Vue.component('action-button', {
      inject: ['assetLink'],
      data() {
        return {
          name: self._name,
        };
      },
      template: '<b-button class="mt-3" block variant="outline-primary" @click="act()">{{ name }}</b-button>',
      methods: {
        act() {
          self._enactor(this.assetLink);
        },
      },
    });
  }

  componentArgs() {
    return {

    };
  }

  weight() {
    return 0;
  }
}

export default class ExampleActionProvider {
  getRelevantActions(asset) {
    return [
      new ExampleAction(1, 'Rename...'),
      new ExampleAction(2, 'Archive', assetLink => {
        assetLink.enqueueAction({
          label: `Archive ${asset.attributes.name}`,
          requests: [
            {
              path: ``,
            }
          ],
        });
      }),
    ];
  }
}

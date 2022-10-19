import JSONAPISource, { JSONAPISerializers } from '@orbit/jsonapi';
import { buildSerializerSettingsFor, buildInflector } from '@orbit/serializers';

import DrupalJSONAPIURLBuilder from '@/DrupalJSONAPIURLBuilder';
import OrbitPriorityTaskQueue from '@/OrbitPriorityTaskQueue';


/**
 * Handle Drupal's `type/bundle` JSON:API resource pathing.
 * Based on: https://github.com/orbitjs/orbit/issues/714#issuecomment-1013952990
 */
export default class DrupalJSONAPISource extends JSONAPISource {
  constructor(settings) {
    const defaultFetchSettings = Object.assign({}, settings.defaultFetchSettings || {}, {
      headers:{
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    super(Object.assign({}, settings, {
      autoActivate: false,
      defaultFetchSettings,
      serializerSettingsFor: buildSerializerSettingsFor({
        sharedSettings: {
          inflectors: {
            drupal: buildInflector(
              {},
              (input) => input.replace('--', '/')
            )
          }
        },
        settingsByType: {
          [JSONAPISerializers.ResourceTypePath]: {
            serializationOptions: {inflectors: ['drupal']}
          },
          [JSONAPISerializers.ResourceFieldPath]: {
            serializationOptions: {inflectors: []}
          },
        }
      }),
      URLBuilderClass: DrupalJSONAPIURLBuilder,
    }));

    const requestQueueSettings = settings.requestQueueSettings || {};

    this._requestQueue = new OrbitPriorityTaskQueue(this, {
      name: this._name ? `${this._name}-requests` : undefined,
      bucket: this._bucket,
      autoActivate: false,
      ...requestQueueSettings
    });

    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    if (autoActivate) {
      this.activate();
    }

  }

}

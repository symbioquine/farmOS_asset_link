import JSONAPISource, { JSONAPISerializers } from '@orbit/jsonapi';
import { buildSerializerSettingsFor, buildInflector } from '@orbit/serializers';

import DrupalJSONAPIURLBuilder from '@/DrupalJSONAPIURLBuilder';


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
  }

}

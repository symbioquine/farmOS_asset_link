import { createTestFarm } from './createTestFarm';
import AssetLink from '@/AssetLink';
import { createDrupalUrl } from "assetlink-plugin-api";

import { Response } from 'cross-fetch';

const delay = time => new Promise(res => setTimeout(res, time));

describe('Basic Smoke Testing', () => {
    let farm = undefined;

    beforeAll(async () => {
        farm = await createTestFarm()
    }, /* timeout: */ 10 * 1000);

    afterAll(async () => {
        await farm.cleanup()
    }, /* timeout: */ 10 * 1000);

    test('Create and Resolve an Asset', async () => {
        const createdAnimalType = await farm.fetch(`${farm.url}/api/taxonomy_term/animal_type`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'application/vnd.api+json',
            },
            body: JSON.stringify({
                "data": {
                    "type": "taxonomy_term--animal_type",
                    "id": "b96dba64-bd23-4c77-825d-cf27c596d6f5",
                    "attributes": {
                      "name": "Rabbit",
                    },
                }
            }),
        }).then((response) => response.json());

        const createdAnimal = await farm.fetch(`${farm.url}/api/asset/animal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.api+json',
              Accept: 'application/vnd.api+json',
            },
            body: JSON.stringify({
                "data": {
                  "type": "asset--animal",
                  "id": "e9fa0fcb-b334-4350-8294-f2d2c51a9a25",
                  "attributes": {
                    "name": "Tommy",
                    "status": "active",
                    "birthdate": "2016-01-01T08:00:00+00:00",
                    "sex": "M"
                  },
                  "relationships": {
                    "animal_type": {
                      "data": {
                        "type": "taxonomy_term--animal_type",
                        "id": "b96dba64-bd23-4c77-825d-cf27c596d6f5",
                      },
                    }
                  }
                }
            }),
        }).then((response) => response.json());

        jsdom.reconfigure({ url: farm.url.toString() });

        window.assetLinkDrupalBasePath = farm.init_data.path;

        expect(window.location.toString()).toBe(farm.url.toString());
        expect(createDrupalUrl('api').toString()).toBe(farm.url.toString() + '/api');

        const baseUrl = farm.url;
        const fetch = async (url, opts) => {
          const u = new URL(url);

          if (u.pathname.endsWith('/alink/backend/default-plugins.repo.json')) {
            const emptyPluginListJson = JSON.stringify({
              "plugins": []
            });

            return new Response(emptyPluginListJson, {
              status: 200,
              statusText: 'OK',
            });

          }

          return await farm.fetch(url, opts);
        }

        const rootComponent = {};

        const devToolsApi = {
          startTimelineEventGroup: jest.fn(() => ({ end: jest.fn() })),
        };

        const store = {
            ready: jest.fn(() => Promise.resolve(true)),
            getItem: jest.fn(() => Promise.resolve(undefined)),
            setItem: jest.fn(),
        };

        Object.defineProperty(window.navigator, 'onLine', {
          get: function() {
            return true;
          },
        });

        const assetLink = new AssetLink(rootComponent, devToolsApi, { store, fetch });

        await assetLink.boot();

        const animal = await assetLink.resolveEntity('asset', 'e9fa0fcb-b334-4350-8294-f2d2c51a9a25');

        expect(animal).toBeDefined();
        expect(animal.attributes.name).toBe('Tommy');

        const animalByNumericId = await assetLink.resolveEntity('asset', `${createdAnimal.data.attributes.drupal_internal__id}`);

        expect(animalByNumericId).toBeDefined();
        expect(animalByNumericId.id).toBe('e9fa0fcb-b334-4350-8294-f2d2c51a9a25');
    }, /* timeout: */ 60 * 1000);

});

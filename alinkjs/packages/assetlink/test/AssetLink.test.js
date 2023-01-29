import fs from 'fs';

import { createTestFarm } from './createTestFarm';
import AssetLink from '@/AssetLink';
import { createDrupalUrl, formatRFC3339, uuidv4 } from "assetlink-plugin-api";

import { Response } from 'cross-fetch';

const delay = time => new Promise(res => setTimeout(res, time));

// Copied from https://stackoverflow.com/a/64183951/1864479
export async function toArray(asyncIterator) {
  const arr = [];
  for await (const i of asyncIterator)
      arr.push(i);
  return arr;
}

describe('Basic Smoke Testing', () => {
    let farm = undefined;
    let fetchDelegate = undefined;
    let createdAnimal = undefined;

    const rootComponent = {};

    const devToolsApi = {
      startTimelineEventGroup: jest.fn(() => ({ end: jest.fn() })),
    };

    beforeAll(async () => {
        Object.defineProperty(window.navigator, 'onLine', {
          get: jest.fn(() => true),
        });

        farm = await createTestFarm();

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

      createdAnimal = await farm.fetch(`${farm.url}/api/asset/animal`, {
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

      fetchDelegate = async (url, opts) => {
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
      };
    }, /* timeout: */ 10 * 1000);

    test('Resolve an Asset', async () => {
        const fetch = jest.fn(fetchDelegate);

        expect(window.location.toString()).toBe(farm.url.toString());
        expect(createDrupalUrl('api').toString()).toBe(farm.url.toString() + '/api');

        let assetLink = new AssetLink(rootComponent, devToolsApi, { fetch });

        await assetLink.boot();

        const animal = await assetLink.resolveEntity('asset', 'e9fa0fcb-b334-4350-8294-f2d2c51a9a25');

        expect(animal).toBeDefined();
        expect(animal.attributes.name).toBe('Tommy');

        const animalByNumericId = await assetLink.resolveEntity('asset', `${createdAnimal.data.attributes.drupal_internal__id}`);

        expect(animalByNumericId).toBeDefined();
        expect(animalByNumericId.id).toBe('e9fa0fcb-b334-4350-8294-f2d2c51a9a25');

        const NamedBasedEntitySearcher = fs.readFileSync('../assetlink-default-plugins/plugins/NamedBasedEntitySearcher.alink.js', 'utf8');

        await assetLink.cores.localPluginStorage.writeLocalPlugin(new URL('indexeddb://asset-link/data/NamedBasedEntitySearcher.alink.js'), NamedBasedEntitySearcher);

        const searchResults = await toArray(assetLink.searchEntities({
          entityType: 'asset',
          id: uuidv4(),
          type: 'text-search',
          term: 'Tommy',
        }, 'remote'));

        expect(searchResults[0]).toBeDefined();
        expect(searchResults[0].entity.id).toBe('e9fa0fcb-b334-4350-8294-f2d2c51a9a25');

        await assetLink.halt();

        assetLink = new AssetLink(rootComponent, devToolsApi, { fetch });

        await assetLink.boot();

        fetch.mockClear();

        const animalAgain = await assetLink.resolveEntity('asset', 'e9fa0fcb-b334-4350-8294-f2d2c51a9a25');

        expect(fetch).not.toHaveBeenCalled();

        expect(animalAgain).toBeDefined();
        expect(animalAgain.attributes.name).toBe('Tommy');

        await assetLink.halt();
    }, /* timeout: */ 60 * 1000);

    test('Backs up only Orbit.js JSON:API sync queue, not request queue', async () => {
        const fetch = jest.fn(fetchDelegate);

        expect(window.location.toString()).toBe(farm.url.toString());
        expect(createDrupalUrl('api').toString()).toBe(farm.url.toString() + '/api');

        let assetLink = new AssetLink(rootComponent, devToolsApi, { fetch });

        await assetLink.boot();

        const animal = await assetLink.resolveEntity('asset', 'e9fa0fcb-b334-4350-8294-f2d2c51a9a25');

        expect(animal).toBeDefined();
        expect(animal.attributes.name).toBe('Tommy');

        fetch.mockImplementation(async (url, opts) => {
          const u = new URL(url);

          if (u.pathname.endsWith('/api/asset/animal') || u.pathname.endsWith('/api/log/observation')) {
            // TODO: Consider also including these other failure modes in the test
            // throw new Error("Request failed!");
            // return new Promise(() => {});
            return new Response('', {
              status: 500,
              statusText: 'ERR',
            });
          }

          return await farm.fetch(url, opts);
        });

        const NamedBasedEntitySearcher = fs.readFileSync('../assetlink-default-plugins/plugins/NamedBasedEntitySearcher.alink.js', 'utf8');

        await assetLink.cores.localPluginStorage.writeLocalPlugin(new URL('indexeddb://asset-link/data/NamedBasedEntitySearcher.alink.js'), NamedBasedEntitySearcher);

        await delay(100);

        try {
          await toArray(assetLink.searchEntities({
            entityType: 'asset',
            entityBundles: ['animal'],
            id: uuidv4(),
            type: 'text-search',
            term: 'Victor',
          }, 'remote'));
        } catch (err) {
          // console.log("Error while searching entities:", err);
        }

        const logToCreate = {
          type: 'log--observation',
          id: uuidv4(),
          attributes: {
            name: 'Something happened!',
            timestamp: formatRFC3339(new Date()),
            status: "done",
          },
        };

        try {
          await assetLink.entitySource.update(
              (t) => t.addRecord(logToCreate),
              {label: logToCreate.attributes.name});
        } catch (err) {
          // console.log("Error while adding log record:", err);
        }

        await assetLink.halt();

        fetch.mockClear();

        const observationEndpointCalled = new Promise(resolve => {
          fetch.mockImplementation(async (url, opts) => {
            try {
              return await farm.fetch(url, opts);
            } finally {
              if (new URL(url).pathname.endsWith('/api/log/observation')) {
                resolve(true);
              }
            }
          });
        });

        assetLink = new AssetLink(rootComponent, devToolsApi, { fetch });

        await assetLink.boot();

        await Promise.race([observationEndpointCalled, delay(1000)]);

        // TODO: Figure out how to wait on the transform (creating the log) being fully settled
        await delay(1000);

        const fetchCalls = fetch.mock.calls.map(c => ({method: c[1].method || 'GET', url: new URL(c[0]).toString()}));

        expect(fetchCalls.filter(call => call.url.includes('/subrequests'))).toEqual([]);
        expect(fetchCalls.filter(call => call.url.includes('/api/asset/animal'))).toEqual([]);

        expect(fetchCalls.filter(call => call.url.includes('/api/log/observation')))
          .toEqual([
            {
              method: 'POST',
              url: farm.url.toString() + '/api/log/observation',
            }
          ]);

        await assetLink.halt();
    }, /* timeout: */ 60 * 1000);

    afterAll(async () => {
        await farm.cleanup()
    }, /* timeout: */ 30 * 1000);

});

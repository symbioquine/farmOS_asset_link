import './mockHttpEntityModelLoader';
import AssetLink from '@/AssetLink';
import { formatRFC3339 } from "assetlink-plugin-api";

import { Response } from 'cross-fetch';

import { fetchDelegate, initDefaults, delay } from './functionalScaffold';

const {
  rootComponent,
  devToolsApi,
  isOnline,
  fetch,
} = initDefaults();

let assetLink = undefined;
beforeEach(async () => {
  assetLink = new AssetLink(rootComponent, devToolsApi, { fetch, disableSubrequestGrouping: true });
});

test('Offline Location Log Change', async () => {
  // Hack so the whole test can work offline
  assetLink.cores.farmData.getLogTypes = async () => ['activity'].map(lt => ({ attributes: { drupal_internal__id: lt }}));

  await assetLink.boot();

  expect(assetLink.connectionStatus.isOnline.value).toBe(true);

  fetch.mockImplementation(async (url, opts) => {
    const u = new URL(url);

    if (u.pathname.endsWith('/api/asset/animal')) {
      return new Response(JSON.stringify({
          data: [{
              type: 'asset--animal',
              id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b',
              attributes: {
                  name: "Dolly"
              },
              relationships: {
                location: {
                  data: [{ type: 'asset--land', id: '917fed5d-cb07-40ba-998d-9e07caf012f1' }]
                }
              }
          }],
          includes: [
            {
              type: 'asset--land',
              id: '917fed5d-cb07-40ba-998d-9e07caf012f1',
              attributes: {
                  name: "Paddock A",
                  land_type: "paddock",
              },
            }
          ]
      }), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-type': 'application/vnd.api+json',
        }
      });
    }

    return await fetchDelegate(url, opts);
  });

  try {
    const animalResults = await assetLink.entitySource.query(q => q.findRecords('asset--animal'), {
      sources: {
        remote: {
          include: ['location']
        }
      }
    });

    expect(animalResults).toHaveLength(1);
    expect(animalResults[0].type).toBe('asset--animal');
    expect(animalResults[0].id).toBe('8e10c68b-49b9-43e1-ad2a-c18b1696290b');
    expect(animalResults[0].relationships.location.data).toHaveLength(1);
    expect(animalResults[0].relationships.location.data[0].type).toBe('asset--land');
    expect(animalResults[0].relationships.location.data[0].id).toBe('917fed5d-cb07-40ba-998d-9e07caf012f1');

    const req = fetch.mock.calls.find(c => c[0].toString().includes('/api/asset/animal'));

    const reqUrl = new URL(req[0]);

    expect(reqUrl.host).toBe("farm.example.com:1234");
    expect(reqUrl.pathname).toBe("/farmos/api/asset/animal");
    expect(Array.from(reqUrl.searchParams.entries())).toEqual([["include", "location"]]);

    // Avoid our update below occurring as part of the resolution of the above query - which
    // bizarrely causes it to get into the remote request queue before the previous round of
    // request processing completes. That in turn means that even though `autoProcess` gets set
    // on the request queue as part of going offline, the update request still gets processed -
    // and sent to the remote server.
    //
    // A delay of 1 ms is enough to guarantee the two are decoupled as they would be in a non-test
    // scenario anyway.
    await delay(1);

    isOnline.mockImplementation(() => false);
    window.dispatchEvent(new window.Event('offline'));

    // Wait for our connection status to be offline
    await Promise.race([new Promise(async (resolve) => {
      while (assetLink.connectionStatus.isOnline.value) {
        await delay(1);
      }
      resolve(true);
    }), delay(1000)]);
    expect(assetLink.connectionStatus.isOnline.value).toBe(false);

    fetch.mockClear();

    const paddockB = {
      type: 'asset--land',
      id: '57d000d5-2f7b-462b-ae30-800dc9f97d61',
      attributes: {
          name: "Paddock B",
          land_type: "paddock",
      },
    };

    const movementLog = {
      type: 'log--activity',
      attributes: {
        name: `Move Dolly to Paddock B`,
        timestamp: formatRFC3339(Date.parse("2022-12-31T00:00:00.000Z")),
        status: "done",
        is_movement: true,
      },
      relationships: {
        asset: {
          data: [
            {
              type: 'asset--animal',
              id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b',
            }
          ]
        },
        location: {
          data: [{
            type: paddockB.type,
            id: paddockB.id,
          }],
        },
      },
    };

    await assetLink.entitySource.update(t => [
        t.addRecord(paddockB),
        t.addRecord(movementLog),
      ],
      {label: movementLog.attributes.name});

    const updatedAnimalResults = await assetLink.entitySource.query(q => q.findRecords('asset--animal'), {
      sources: {
        remote: {
          include: ['location']
        }
      }
    });

    expect(fetch).not.toHaveBeenCalled();

    expect(updatedAnimalResults).toHaveLength(1);
    expect(updatedAnimalResults[0].type).toBe('asset--animal');
    expect(updatedAnimalResults[0].id).toBe('8e10c68b-49b9-43e1-ad2a-c18b1696290b');
    expect(updatedAnimalResults[0].relationships.location.data).toHaveLength(1);
    expect(updatedAnimalResults[0].relationships.location.data[0].type).toBe('asset--land');
    expect(updatedAnimalResults[0].relationships.location.data[0].id).toBe(paddockB.id);
  } finally {
    await assetLink.halt();
  }
}, /* timeout: */ 1 * 1000);

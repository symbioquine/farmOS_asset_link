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

test('Offline Group Log Change', async () => {
  assetLink.cores.farmData.getLogTypes = async () => ['activity'].map(lt => ({ attributes: { drupal_internal__id: lt }}));

  await assetLink.boot();

  await delay(1);

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
                group: {
                  data: [{ type: 'asset--group', id: 'cae65f71-c5d2-4fc4-b386-f5046d55c7a3' }]
                }
              }
          }],
          includes: [
            {
              type: 'asset--group',
              id: 'cae65f71-c5d2-4fc4-b386-f5046d55c7a3',
              attributes: {
                  name: "Fancy Animals",
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
          include: ['group']
        }
      }
    });

    expect(animalResults).toHaveLength(1);
    expect(animalResults[0].type).toBe('asset--animal');
    expect(animalResults[0].id).toBe('8e10c68b-49b9-43e1-ad2a-c18b1696290b');
    expect(animalResults[0].relationships.group.data).toHaveLength(1);
    expect(animalResults[0].relationships.group.data[0].type).toBe('asset--group');
    expect(animalResults[0].relationships.group.data[0].id).toBe('cae65f71-c5d2-4fc4-b386-f5046d55c7a3');

    const req = fetch.mock.calls.find(c => c[0].toString().includes('/api/asset/animal'));

    const reqUrl = new URL(req[0]);

    expect(reqUrl.host).toBe("farm.example.com:1234");
    expect(reqUrl.pathname).toBe("/farmos/api/asset/animal");
    expect(Array.from(reqUrl.searchParams.entries())).toEqual([["include", "group"]]);

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

    const anotherGroup = {
      type: 'asset--group',
      id: 'cae65f71-c5d2-4fc4-b386-f5046d55c7a3',
      attributes: {
          name: "Another Group",
      },
    };

    const membershipLog = {
      type: 'log--activity',
      attributes: {
        name: `Move Dolly to Another Group`,
        timestamp: formatRFC3339(Date.parse("2022-12-31T00:00:00.000Z")),
        status: "done",
        is_group_assignment: true,
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
        group: {
          data: [{
            type: anotherGroup.type,
            id: anotherGroup.id,
          }],
        },
      },
    };

    await assetLink.entitySource.update(t => [
        t.addRecord(anotherGroup),
        t.addRecord(membershipLog),
      ],
      {label: membershipLog.attributes.name});

    const updatedAnimalResults = await assetLink.entitySource.query(q => q.findRecords('asset--animal'), {
      sources: {
        remote: {
          include: ['group']
        }
      }
    });

    expect(fetch).not.toHaveBeenCalled();

    expect(updatedAnimalResults).toHaveLength(1);
    expect(updatedAnimalResults[0].type).toBe('asset--animal');
    expect(updatedAnimalResults[0].id).toBe('8e10c68b-49b9-43e1-ad2a-c18b1696290b');
    expect(updatedAnimalResults[0].relationships.group.data).toHaveLength(1);
    expect(updatedAnimalResults[0].relationships.group.data[0].type).toBe('asset--group');
    expect(updatedAnimalResults[0].relationships.group.data[0].id).toBe(anotherGroup.id);
  } finally {
    await assetLink.halt();
  }
}, /* timeout: */ 1 * 1000);

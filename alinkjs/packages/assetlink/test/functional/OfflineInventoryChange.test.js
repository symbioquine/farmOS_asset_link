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

test('Offline Inventory Quantity Log Change', async () => {
  assetLink.cores.farmData.getLogTypes = async () => ['activity'].map(lt => ({ attributes: { drupal_internal__id: lt }}));

  await assetLink.boot();

  await delay(1);

  expect(assetLink.connectionStatus.isOnline.value).toBe(true);

  fetch.mockImplementation(async (url, opts) => {
    const u = new URL(url);

    if (u.pathname.endsWith('/api/taxonomy_term/unit')) {
      return new Response(JSON.stringify({
          data: [
            {
              type: 'taxonomy_term--unit',
              id: 'd2269fcd-099e-4979-8051-6dcfae47bc9d',
              attributes: {
                  name: "silos",
              },
            },
            {
              type: 'taxonomy_term--unit',
              id: '49e7872f-07e1-4af9-b13d-3592c6b92276',
              attributes: {
                  name: "round bales",
              },
            },
            {
              type: 'taxonomy_term--unit',
              id: 'a9deadae-4c56-4726-aa85-4727983c0fcb',
              attributes: {
                  name: "bales",
              },
            },
          ],
      }), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-type': 'application/vnd.api+json',
        }
      });
    }

    if (u.pathname.endsWith('/api/asset/material')) {
      return new Response(JSON.stringify({
          data: [{
              type: 'asset--material',
              id: '07fba54d-a589-4eb2-91f8-587642c0525f',
              attributes: {
                  name: "Hay",
                  inventory: [
                    {
                      value: "2",
                      measure: "count",
                      units: "round bales",
                    },
                    {
                      value: "10.5",
                      measure: "count",
                      units: "bales",
                    }
                  ]
              },
          }],
      }), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-type': 'application/vnd.api+json',
        }
      });
    }

    if (u.pathname.endsWith('/api/log/activity')) {
      return new Response(JSON.stringify({
          data: [{
              type: 'log--activity',
              id: '6cfc0a16-6537-4dbc-9298-014bf597fdd3',
              attributes: {
                  name: "Add 10.5 bales",
                  timestamp: formatRFC3339(Date.parse("2022-12-25T00:00:00.000Z")),
                  status: "done",
              },
              relationships: {
                quantity: {
                  data: [{
                    type: 'quantity--standard',
                    id: '2ba0b923-dac5-4fe2-a60c-118bf80fed9a',
                  }]
                }
              }
          }],
          included: [
            {
              type: 'quantity--standard',
              id: '2ba0b923-dac5-4fe2-a60c-118bf80fed9a',
              attributes: {
                measure: "count",
                inventory_adjustment: 'reset',
                value: {
                  decimal: "10.5",
                },
              },
              relationships: {
                inventory_asset: {
                  data: {
                    type: 'asset--material',
                    id: '07fba54d-a589-4eb2-91f8-587642c0525f',
                  }
                },
                units: {
                  data: {
                    type: 'taxonomy_term--unit',
                    id: 'a9deadae-4c56-4726-aa85-4727983c0fcb',
                  }
                }
              }
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
    // Load the units here before we go offline - TODO: Consider making Asset Link fetch all units pre-emptively/periodically
    await assetLink.entitySource.query(q => q.findRecords('taxonomy_term--unit'));

    // Load the log which set the bales inventory to 10.5
    await assetLink.entitySource.query(q => q.findRecords('log--activity'), { include: ['quantity'] });

    const materialResults = await assetLink.entitySource.query(q => q.findRecords('asset--material'));

    expect(materialResults).toHaveLength(1);
    expect(materialResults[0].type).toBe('asset--material');
    expect(materialResults[0].id).toBe('07fba54d-a589-4eb2-91f8-587642c0525f');
    expect(materialResults[0].attributes.inventory).toHaveLength(2);

    expect(materialResults[0].attributes.inventory[0].value).toBe('2');
    expect(materialResults[0].attributes.inventory[0].measure).toBe('count');
    expect(materialResults[0].attributes.inventory[0].units).toBe('round bales');

    expect(materialResults[0].attributes.inventory[1].value).toBe('10.5');
    expect(materialResults[0].attributes.inventory[1].measure).toBe('count');
    expect(materialResults[0].attributes.inventory[1].units).toBe('bales');

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
    }), delay(10)]);
    expect(assetLink.connectionStatus.isOnline.value).toBe(false);

    fetch.mockClear();

    const fiveSilosQuantity = {
      type: 'quantity--standard',
      id: 'cf22914b-661c-472b-950c-e22dab93928f',
      attributes: {
        measure: "count",
        inventory_adjustment: 'increment',
        value: {
          decimal: "5",
        },
      },
      relationships: {
        inventory_asset: {
          data: {
            type: 'asset--material',
            id: '07fba54d-a589-4eb2-91f8-587642c0525f',
          }
        },
        units: {
          data: {
            type: 'taxonomy_term--unit',
            id: 'd2269fcd-099e-4979-8051-6dcfae47bc9d',
          }
        }
      }
    };

    const tenRoundBalesQuantity = {
      type: 'quantity--standard',
      id: 'c7822339-479d-4909-8bb3-424e9a66f526',
      attributes: {
        measure: "count",
        inventory_adjustment: 'increment',
        value: {
          decimal: "10",
        },
      },
      relationships: {
        inventory_asset: {
          data: {
            type: 'asset--material',
            id: '07fba54d-a589-4eb2-91f8-587642c0525f',
          }
        },
        units: {
          data: {
            type: 'taxonomy_term--unit',
            id: '49e7872f-07e1-4af9-b13d-3592c6b92276',
          }
        }
      }
    };

    const twentyBalesQuantity = {
      type: 'quantity--standard',
      id: '72e94758-5e5e-4165-a6ba-12f18206e0d1',
      attributes: {
        measure: "count",
        inventory_adjustment: 'increment',
        value: {
          decimal: "20",
        },
      },
      relationships: {
        inventory_asset: {
          data: {
            type: 'asset--material',
            id: '07fba54d-a589-4eb2-91f8-587642c0525f',
          }
        },
        units: {
          data: {
            type: 'taxonomy_term--unit',
            id: 'a9deadae-4c56-4726-aa85-4727983c0fcb',
          }
        }
      }
    };

    const inventoryUpdateLog = {
      type: 'log--activity',
      attributes: {
        name: `Add 5 silos, 10 round bales, and 20 regular bales`,
        timestamp: formatRFC3339(Date.parse("2022-12-31T00:00:00.000Z")),
        status: "done",
      },
      relationships: {
        quantity: {
          data: [
            {
              type: fiveSilosQuantity.type,
              id: fiveSilosQuantity.id,
            },
            {
              type: tenRoundBalesQuantity.type,
              id: tenRoundBalesQuantity.id,
            },
            {
              type: twentyBalesQuantity.type,
              id: twentyBalesQuantity.id,
            }
          ],
        },
      },
    };

    await assetLink.entitySource.update(t => [
        t.addRecord(fiveSilosQuantity),
        t.addRecord(tenRoundBalesQuantity),
        t.addRecord(twentyBalesQuantity),
        t.addRecord(inventoryUpdateLog),
      ],
      {label: inventoryUpdateLog.attributes.name});

    const updatedMaterialResults = await assetLink.entitySource.query(q => q.findRecords('asset--material'));

    expect(fetch).not.toHaveBeenCalled();

    expect(updatedMaterialResults).toHaveLength(1);
    expect(updatedMaterialResults[0].type).toBe('asset--material');
    expect(updatedMaterialResults[0].id).toBe('07fba54d-a589-4eb2-91f8-587642c0525f');

    expect(updatedMaterialResults[0].attributes.inventory).toHaveLength(3);

    const updatedInventory = updatedMaterialResults[0].attributes.inventory.sort((a, b) => a.value - b.value);

    // All 5 new silos
    expect(updatedInventory[0].value).toBe('5');
    expect(updatedInventory[0].measure).toBe('count');
    expect(updatedInventory[0].units).toBe('silos');

    // Existing 2 bales not included since that inventory log wasn't already loaded when we went offline
    expect(updatedInventory[1].value).toBe('10');
    expect(updatedInventory[1].measure).toBe('count');
    expect(updatedInventory[1].units).toBe('round bales');

    // Existing 10.5 bales (which we loaded the log for before going offline) + new 20 bales
    expect(updatedInventory[2].value).toBe('30.5');
    expect(updatedInventory[2].measure).toBe('count');
    expect(updatedInventory[2].units).toBe('bales');
  } finally {
    await assetLink.halt();
  }
}, /* timeout: */ 1 * 1000);

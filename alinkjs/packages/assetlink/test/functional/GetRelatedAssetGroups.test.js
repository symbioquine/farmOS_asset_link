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

test('Get Related Asset Groups', async () => {
  assetLink.cores.farmData.getLogTypes = async () => ['activity'].map(lt => ({ attributes: { drupal_internal__id: lt }}));

  await assetLink.boot();

  expect(assetLink.connectionStatus.isOnline.value).toBe(true);

  fetch.mockImplementation(async (url, opts) => {
    const u = new URL(url);

    if (u.pathname.endsWith('/api/log/activity')) {
      return new Response(JSON.stringify({
          data: [{
              type: 'log--activity',
              id: '8df6b392-500e-4c48-9eca-9fb55f013706',
              attributes: {
                  name: "Add Dolly to group Awesome Sheep",
                  timestamp: formatRFC3339(Date.parse("2022-12-31T00:00:00.000Z")),
                  status: "done",
                  is_group_assignment: true,
              },
              relationships: {
                asset: {
                  data: [{ type: 'asset--animal', id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b' }]
                },
                group: {
                  data: [{ type: 'asset--group', id: '909c5568-f434-4732-807a-37df8792cca3' }]
                }
              }
          }],
          includes: [
            {
              type: 'asset--group',
              id: '909c5568-f434-4732-807a-37df8792cca3',
              attributes: {
                  name: "Awesome Sheep",
              },
            },
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
    const locations = await assetLink.entitySource.query(q =>
      q.findRelatedRecords({ type: 'asset--animal', id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b' }, 'group'));

    expect(locations).toHaveLength(1);
    expect(locations[0].type).toBe('asset--group');
    expect(locations[0].id).toBe('909c5568-f434-4732-807a-37df8792cca3');
  } finally {
    await assetLink.halt();
  }
}, /* timeout: */ 1 * 1000);

import './mockHttpEntityModelLoader';
import AssetLink from '@/AssetLink';

import { Response } from 'cross-fetch';

import { fetchDelegate, initDefaults } from './functionalScaffold';

const {
  rootComponent,
  devToolsApi,
  fetch,
  waitForStructuralDataPreloadingToComplete,
} = initDefaults();

let assetLink = undefined;
beforeEach(async () => {
  assetLink = new AssetLink(rootComponent, devToolsApi, { fetch, disableSubrequestGrouping: true });
});

test('Simple Online log query', async () => {
    await assetLink.boot();

    // Avoid warnings caused by preloading happening after tests complete
    await waitForStructuralDataPreloadingToComplete();
  
    expect(assetLink.connectionStatus.isOnline.value).toBe(true);
  
    fetch.mockImplementation(async (url, opts) => {
      const u = new URL(url);
  
      if (u.pathname.endsWith('/api/log/activity')) {
        return new Response(JSON.stringify({
            data: [{
                type: 'log--activity',
                id: '6dd89551-c756-42f0-b217-35e72f52b13f',
                attributes: {
                    name: "Some movement log",
                    is_movement: true,
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
  
      return await fetchDelegate(url, opts);
    });
  
    try {
  
      const logResults = await assetLink.entitySource.query(q => q.findRecords('log--activity')
        .filter({ attribute: 'is_movement', value: true }));

      expect(logResults).toHaveLength(1);
      expect(logResults[0].type).toBe('log--activity');
      expect(logResults[0].id).toBe('6dd89551-c756-42f0-b217-35e72f52b13f');
  
      const req = fetch.mock.calls.find(c => c[0].toString().includes('/api/log/activity'));
  
      const reqUrl = new URL(req[0]);
  
      expect(reqUrl.host).toBe("farm.example.com:1234");
      expect(reqUrl.pathname).toBe("/farmos/api/log/activity");
      expect(Array.from(reqUrl.searchParams.entries())).toEqual([["filter[is_movement]", "1"]]);
    } finally {
      await assetLink.halt();
    }
  }, /* timeout: */ 10 * 1000);

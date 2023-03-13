import './mockHttpEntityModelLoader';
import AssetLink from '@/AssetLink';

import { Response } from 'cross-fetch';

import { fetchDelegate, initDefaults } from './functionalScaffold';

const {
  rootComponent,
  devToolsApi,
  isOnline,
  fetch,
} = initDefaults();

let assetLink = undefined;
beforeEach(async () => {
  assetLink = new AssetLink(rootComponent, devToolsApi, { fetch, disableSubrequestGrouping: true });

  assetLink.cores.farmData.getAssetTypes = async () => ['animal', 'land'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
  assetLink.cores.farmData.getLogTypes = async () => ['activity', 'observation'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
  assetLink.cores.farmData.getTaxonomyVocabularies = async () => [];

  await assetLink.boot();
});

const expectRemoteQuery = (qFn) => {
    return {
      toHaveQueryParams: async (expectedQueryParams) => {
            fetch.mockImplementation(async (url, opts) => {
              const u = new URL(url);

              if (u.pathname.endsWith('/api/asset/animal') || u.pathname.endsWith('/api/taxonomy_term/animal_type')) {
                return new Response(JSON.stringify({
                    data: [],
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

            fetch.mockClear();

            await assetLink.remoteEntitySource.query(qFn);

            const req = fetch.mock.calls[0];
  
            const reqUrl = new URL(req[0]);

            const queryParams = Array.from(reqUrl.searchParams.entries());
            queryParams.sort();

            expectedQueryParams.sort();

            expect(queryParams).toEqual(expectedQueryParams);
        },
    }
}

const sheepAnimalType = {
  "type": "taxonomy_term--animal_type",
  "id": "4cef80fe-7c57-4960-958d-abfe74c34b30",
  "attributes": {
    "name": "Sheep",
  },
};

const rabbitAnimalType = {
  "type": "taxonomy_term--animal_type",
  "id": "af0fc82b-f0e7-43ee-90bd-c5af78e50e44",
  "attributes": {
    "name": "Rabbit",
  },
};

test('STARTS_WITH', async () => {
  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'STARTS_WITH', value: "zz" }))
    .toHaveQueryParams([
         [ "filter[client-name-0][path]", "name" ],
         [ "filter[client-name-0][operator]", "STARTS_WITH" ],
         [ "filter[client-name-0][value]", "zz" ],
       ]);
});

test('CONTAINS', async () => {
  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'CONTAINS', value: "zz" }))
    .toHaveQueryParams([
         [ "filter[client-name-0][path]", "name" ],
         [ "filter[client-name-0][operator]", "CONTAINS" ],
         [ "filter[client-name-0][value]", "zz" ],
       ]);
});

test('ENDS_WITH', async () => {
  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'ENDS_WITH', value: "zz" }))
    .toHaveQueryParams([
         [ "filter[client-name-0][path]", "name" ],
         [ "filter[client-name-0][operator]", "ENDS_WITH" ],
         [ "filter[client-name-0][value]", "zz" ],
       ]);
});

test('IN', async () => {
  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'IN', value: ["zz", 'ff'] }))
    .toHaveQueryParams([
        [ "filter[client-name-0][path]", "name" ],
        [ "filter[client-name-0][operator]", "IN" ],
        [ "filter[client-name-0][value][0]", "zz" ],
        [ "filter[client-name-0][value][1]", "ff" ],
      ]);

  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'IN', value: ['Dorthea', "fred"] }))
    .toHaveQueryParams([
        [ "filter[client-nickname-0][path]", "nickname" ],
        [ "filter[client-nickname-0][operator]", "IN" ],
        [ "filter[client-nickname-0][value][0]", "Dorthea" ],
        [ "filter[client-nickname-0][value][1]", "fred" ],
      ]);

  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ relation: 'animal_type',  op: 'IN', record: [
      { type: sheepAnimalType.type, id: sheepAnimalType.id },
      { type: rabbitAnimalType.type, id: rabbitAnimalType.id }
    ] }))
    .toHaveQueryParams([
        [ "filter[client-animal_type-0][path]", "animal_type.id" ],
        [ "filter[client-animal_type-0][operator]", "IN" ],
        [ "filter[client-animal_type-0][value][0]", sheepAnimalType.id ],
        [ "filter[client-animal_type-0][value][1]", rabbitAnimalType.id ],
      ]);

  await expectRemoteQuery(q => q.findRecords('taxonomy_term--animal_type').filter({ relation: 'parent',  op: 'IN', record: [
      { type: sheepAnimalType.type, id: sheepAnimalType.id },
      { type: rabbitAnimalType.type, id: rabbitAnimalType.id }
    ] }))
    .toHaveQueryParams([
        [ "filter[client-parent-0][path]", "parent.id" ],
        [ "filter[client-parent-0][operator]", "IN" ],
        [ "filter[client-parent-0][value][0]", sheepAnimalType.id ],
        [ "filter[client-parent-0][value][1]", rabbitAnimalType.id ],
      ]);
});

test('NOT IN', async () => {
  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'NOT IN', value: ["zz", 'ff'] }))
    .toHaveQueryParams([
        [ "filter[client-name-0][path]", "name" ],
        [ "filter[client-name-0][operator]", "NOT IN" ],
        [ "filter[client-name-0][value][0]", "zz" ],
        [ "filter[client-name-0][value][1]", "ff" ],
      ]);

  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'NOT IN', value: ['Dorthea', "fred"] }))
    .toHaveQueryParams([
        [ "filter[client-nickname-0][path]", "nickname" ],
        [ "filter[client-nickname-0][operator]", "NOT IN" ],
        [ "filter[client-nickname-0][value][0]", "Dorthea" ],
        [ "filter[client-nickname-0][value][1]", "fred" ],
      ]);

  await expectRemoteQuery(q => q.findRecords('asset--animal').filter({ relation: 'animal_type',  op: 'NOT IN', record: [
      { type: sheepAnimalType.type, id: sheepAnimalType.id },
      { type: rabbitAnimalType.type, id: rabbitAnimalType.id }
    ] }))
    .toHaveQueryParams([
        [ "filter[client-animal_type-0][path]", "animal_type.id" ],
        [ "filter[client-animal_type-0][operator]", "NOT IN" ],
        [ "filter[client-animal_type-0][value][0]", sheepAnimalType.id ],
        [ "filter[client-animal_type-0][value][1]", rabbitAnimalType.id ],
      ]);

  await expectRemoteQuery(q => q.findRecords('taxonomy_term--animal_type').filter({ relation: 'parent',  op: 'NOT IN', record: [
      { type: sheepAnimalType.type, id: sheepAnimalType.id },
      { type: rabbitAnimalType.type, id: rabbitAnimalType.id }
    ] }))
    .toHaveQueryParams([
        [ "filter[client-parent-0][path]", "parent.id" ],
        [ "filter[client-parent-0][operator]", "NOT IN" ],
        [ "filter[client-parent-0][value][0]", sheepAnimalType.id ],
        [ "filter[client-parent-0][value][1]", rabbitAnimalType.id ],
      ]);
});

test('Conjuction: OR', async () => {
  await expectRemoteQuery(q => q.findRecords('asset--animal')
      .filterGroup('OR', fg => fg
        .filter({ attribute: 'sex',  op: '=', value: 'F'})
        .filter({ relation: 'animal_type',  op: '=', record: { type: rabbitAnimalType.type, id: rabbitAnimalType.id }})
      )
      .filter({ attribute: 'name',  op: 'CONTAINS', value: "y" })
    )
    .toHaveQueryParams([
        [ "filter[client-group-0][group][conjunction]", "OR" ],

        [ "filter[client-sex-1][condition][path]", "sex" ],
        [ "filter[client-sex-1][condition][operator]", "=" ],
        [ "filter[client-sex-1][condition][value]", "F" ],
        [ "filter[client-sex-1][condition][memberOf]", "client-group-0" ],

        [ "filter[client-animal_type-2][condition][path]", "animal_type.id" ],
        [ "filter[client-animal_type-2][condition][operator]", "=" ],
        [ "filter[client-animal_type-2][condition][value]", rabbitAnimalType.id ],
        [ "filter[client-animal_type-2][condition][memberOf]", "client-group-0" ],

        [ "filter[client-name-3][path]", "name" ],
        [ "filter[client-name-3][operator]", "CONTAINS" ],
        [ "filter[client-name-3][value]", "y" ],
      ]);
});

test('Conjuction: Nested ANDs in OR', async () => {
  await expectRemoteQuery(q => q.findRecords('asset--animal')
      .filterGroup('OR', orFg => orFg
        .filterGroup('AND', andFg => andFg
          .filter({ attribute: 'drupal_internal__id',  op: '>=', value: 1})
          .filter({ attribute: 'drupal_internal__id',  op: '<', value: 4})
        )
        .filterGroup('AND', andFg => andFg
          .filter({ attribute: 'drupal_internal__id',  op: '>=', value: 5})
          .filter({ attribute: 'drupal_internal__id',  op: '<', value: 8})
        )
      )
      .filter({ attribute: 'name',  op: 'CONTAINS', value: "y" })
    ).toHaveQueryParams([
      [ "filter[client-group-0][group][conjunction]", "OR" ],

      [ "filter[client-group-1][group][conjunction]", "AND" ],

      [ "filter[client-drupal_internal__id-2][condition][operator]", ">=" ],
      [ "filter[client-drupal_internal__id-2][condition][path]", "drupal_internal__id" ],
      [ "filter[client-drupal_internal__id-2][condition][value]", "1" ],
      [ "filter[client-drupal_internal__id-2][condition][memberOf]", "client-group-1" ],

      [ "filter[client-drupal_internal__id-3][condition][operator]", "<" ],
      [ "filter[client-drupal_internal__id-3][condition][path]", "drupal_internal__id" ],
      [ "filter[client-drupal_internal__id-3][condition][value]", "4" ],
      [ "filter[client-drupal_internal__id-3][condition][memberOf]", "client-group-1" ],

      [ "filter[client-group-4][group][conjunction]", "AND" ],

      [ "filter[client-drupal_internal__id-5][condition][operator]", ">=" ],
      [ "filter[client-drupal_internal__id-5][condition][path]", "drupal_internal__id" ],
      [ "filter[client-drupal_internal__id-5][condition][value]", "5" ],
      [ "filter[client-drupal_internal__id-5][condition][memberOf]", "client-group-4" ],

      [ "filter[client-drupal_internal__id-6][condition][operator]", "<" ],
      [ "filter[client-drupal_internal__id-6][condition][path]", "drupal_internal__id" ],
      [ "filter[client-drupal_internal__id-6][condition][value]", "8" ],
      [ "filter[client-drupal_internal__id-6][condition][memberOf]", "client-group-4" ],

      [ "filter[client-name-7][operator]", "CONTAINS" ],
      [ "filter[client-name-7][path]", "name" ],
      [ "filter[client-name-7][value]", "y" ],
    ]);
});

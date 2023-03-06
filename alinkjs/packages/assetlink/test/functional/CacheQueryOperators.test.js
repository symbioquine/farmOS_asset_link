import './mockHttpEntityModelLoader';
import AssetLink from '@/AssetLink';
import { formatRFC3339 } from "assetlink-plugin-api";

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
  isOnline.mockImplementation(() => false);

  assetLink = new AssetLink(rootComponent, devToolsApi, { fetch, disableSubrequestGrouping: true });

  assetLink.cores.farmData.getAssetTypes = async () => ['animal', 'land'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
  assetLink.cores.farmData.getLogTypes = async () => ['activity', 'observation'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
  assetLink.cores.farmData.getTaxonomyVocabularies = async () => [];

  await assetLink.boot();
});

const expectCacheQuery = (qFn) => {
    return {
        toReturn: (expectedEntities) => {
            const queryResults = assetLink.entitySource.cache.query(qFn);
            expect(queryResults).toEqual(expectedEntities);
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

const dolly = {
  type: 'asset--animal',
  id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b',
  attributes: {
      name: "Dolly",
      nickname: [
        'Dorthea',
      ]
  },
  relationships: {
    animal_type: {
      data: {
        type: sheepAnimalType.type,
        id: sheepAnimalType.id,
      },
    }
  }
};

const fred = {
  type: 'asset--animal',
  id: '46f5f6f0-03c8-4e35-aec5-f2ed6391c204',
  attributes: {
      name: "Freddrick",
      nickname: [
        'Wooly Buddy',,
        'Fred',
      ]
  },
  relationships: {
    animal_type: {
      data: {
        type: sheepAnimalType.type,
        id: sheepAnimalType.id,
      },
    }
  }
};

test('STARTS_WITH', async () => {
    assetLink.cores.farmData.getAssetTypes = async () => ['animal', 'land'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getLogTypes = async () => ['activity', 'observation'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getTaxonomyVocabularies = async () => [];

    await assetLink.boot();

    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'STARTS_WITH', value: "zz" }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'STARTS_WITH', value: "DO" }))
        .toReturn([dolly]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'STARTS_WITH', value: "woo" }))
        .toReturn([fred]);
});

test('CONTAINS', async () => {
    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'CONTAINS', value: "zz" }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'CONTAINS', value: "oll" }))
        .toReturn([dolly]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'CONTAINS', value: "FRED" }))
        .toReturn([fred]);
});

test('ENDS_WITH', async () => {
    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'ENDS_WITH', value: "zz" }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'ENDS_WITH', value: "olly" }))
        .toReturn([dolly]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'ENDS_WITH', value: "rEd" }))
        .toReturn([fred]);
});

test('IN', async () => {
    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'IN', value: ["zz", 'ff'] }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'IN', value: ["dolly", "freddrick", "pop"] }))
        .toReturn([fred, dolly]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'IN', value: ['Dorthea', "fred"] }))
        .toReturn([fred, dolly]);
});

test('NOT IN', async () => {
    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'NOT IN', value: ["zz", 'ff'] }))
        .toReturn([fred, dolly]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'NOT IN', value: ["dolly", "freddrick", "pop"] }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'NOT IN', value: ['Dorthea', "fred"] }))
        .toReturn([]);
});

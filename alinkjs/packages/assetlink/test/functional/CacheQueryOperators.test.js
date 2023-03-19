import './mockHttpEntityModelLoader';
import AssetLink from '@/AssetLink';
import { initDefaults } from './functionalScaffold';
import { uuidv4 } from 'assetlink-plugin-api';

// From https://stackoverflow.com/a/37980601/1864479
const range = n => [...Array(n).keys()];

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
            queryResults.sort((a, b) => (a.attributes?.drupal_internal__id || a.id) - (b.attributes?.drupal_internal__id || b.id));
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

const rabbitAnimalType = {
  "type": "taxonomy_term--animal_type",
  "id": "af0fc82b-f0e7-43ee-90bd-c5af78e50e44",
  "attributes": {
    "name": "Rabbit",
  },
};

const dolly = {
  type: 'asset--animal',
  id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b',
  attributes: {
      name: "Dolly",
      drupal_internal__id: 1,
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
      drupal_internal__id: 2,
      nickname: [
        'Wooly Buddy',
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

const tommy = {
  type: 'asset--animal',
  id: 'b0aedffd-b2b8-4c2c-8e44-4b64007bf1bf',
  attributes: {
      drupal_internal__id: 8,
      name: "Tommy",
  },
  relationships: {
    animal_type: {
      data: {
        type: rabbitAnimalType.type,
        id: rabbitAnimalType.id,
      },
    }
  }
};

test('equal', async () => {
    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'equal', value: "zz" }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: '=', value: "zz" }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'equal', value: "dolly" }))
        .toReturn([dolly]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: '=', value: "dolly" }))
        .toReturn([dolly]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'equal', value: "FRED" }))
        .toReturn([fred]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: '=', value: "FRED" }))
        .toReturn([fred]);
});

test('not equal', async () => {
    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: '<>', value: "zz" }))
        .toReturn([dolly, fred]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: '<>', value: "dolly" }))
        .toReturn([fred]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: '<>', value: "FRED" }))
        .toReturn([dolly]);
});

test('STARTS_WITH', async () => {
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
      t.addRecord(rabbitAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
      t.addRecord(tommy),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'IN', value: ["zz", 'ff'] }))
        .toReturn([]);
    
    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'IN', value: ["dolly", "freddrick", "pop"] }))
        .toReturn([dolly, fred]);
    
    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'IN', value: ['Dorthea', "fred"] }))
        .toReturn([dolly, fred]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ relation: 'animal_type',  op: 'IN', record: [
          { type: sheepAnimalType.type, id: sheepAnimalType.id },
          { type: rabbitAnimalType.type, id: rabbitAnimalType.id }
        ] }))
        .toReturn([dolly, fred, tommy]);
});

test('NOT IN', async () => {
    await assetLink.entitySource.cache.update(t => [
      t.addRecord(sheepAnimalType),
      t.addRecord(dolly),
      t.addRecord(fred),
    ]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'NOT IN', value: ["zz", 'ff'] }))
        .toReturn([dolly, fred]);
    
    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'name',  op: 'NOT IN', value: ["dolly", "freddrick", "pop"] }))
        .toReturn([]);
    
    expectCacheQuery(q => q.findRecords('asset--animal').filter({ attribute: 'nickname',  op: 'NOT IN', value: ['Dorthea', "fred"] }))
        .toReturn([]);

    expectCacheQuery(q => q.findRecords('asset--animal').filter({ relation: 'animal_type',  op: 'NOT IN', record: [
          { type: rabbitAnimalType.type, id: rabbitAnimalType.id }
        ] }))
        .toReturn([dolly, fred]);
});

test('Conjuction: OR', async () => {
  await assetLink.entitySource.cache.update(t => [
    t.addRecord(sheepAnimalType),
    t.addRecord(dolly),
    t.addRecord(fred),
    t.addRecord(tommy),
  ]);

  expectCacheQuery(q => q.findRecords('asset--animal')
      .filterGroup('OR', fg => fg
        .filter({ relation: 'animal_type',  op: '=', record: { type: sheepAnimalType.type, id: sheepAnimalType.id }})
        .filter({ relation: 'animal_type',  op: '=', record: { type: rabbitAnimalType.type, id: rabbitAnimalType.id }})
      )
      .filter({ attribute: 'name',  op: 'CONTAINS', value: "y" })
    ).toReturn([dolly, tommy]);
});

test('Conjuction: Nested ANDs in OR', async () => {
  // Make some clones of Dolly so we have a enough possible results to validate a complex query
  const dollyClonesByInternalId = {};
  range(8).forEach(idx => {
    if (idx === 0 || idx === 2) {
      return;
    }
    dollyClonesByInternalId[idx] = {
      type: dolly.type,
      id: uuidv4(),
      attributes: {
        ...dolly.attributes,
        drupal_internal__id: idx,
        name: `Dolly #${idx}`,
      },
      relationships: {
        ...dolly.relationships,
      }
    };
  })

  await assetLink.entitySource.cache.update(t => [
    t.addRecord(sheepAnimalType),
    ...Object.values(dollyClonesByInternalId).map(clone => t.addRecord(clone)),
    t.addRecord(fred),
    t.addRecord(tommy),
  ]);

  expectCacheQuery(q => q.findRecords('asset--animal')
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
    ).toReturn([
      dollyClonesByInternalId[1],
      // 2 is Fred who doesn't have a y in their name
      dollyClonesByInternalId[3],
      // 4 is larger than the first range and less than the start of the second range
      dollyClonesByInternalId[5],
      dollyClonesByInternalId[6],
      dollyClonesByInternalId[7],
      // 8 is Tommy who is larger than the end of the second range
    ]);
});

test('Nested relationship attribute filtering', async () => {
  assetLink.entitySource.cache.update(t => [
    t.addRecord(sheepAnimalType),
    t.addRecord(rabbitAnimalType),
    t.addRecord(dolly),
    t.addRecord(tommy),
  ]);

  fred.relationships.parent = {
    data: [{ type: tommy.type, id: tommy.id }],
  };

  assetLink.entitySource.cache.update(t => [
    t.addRecord(fred),
  ]);

  expectCacheQuery(q => q.findRecords('asset--animal')
      .filter({ attribute: 'parent.animal_type.name',  op: 'CONTAINS', value: "abb" })
      .filter({ attribute: 'parent.name',  op: 'CONTAINS', value: "omm" })
      .filter({ attribute: 'name',  op: 'CONTAINS', value: "red" })
    ).toReturn([fred]);
});

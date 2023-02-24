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
});

test('Log fields computed on creation', async () => {
    assetLink.cores.farmData.getAssetTypes = async () => ['animal', 'land'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getLogTypes = async () => ['activity', 'observation'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getTaxonomyVocabularies = async () => [];

    await assetLink.boot();

    fetch.mockClear();

    try {
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
            name: "Dolly"
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

      const paddockA = {
        type: 'asset--land',
        id: '57d000d5-2f7b-462b-ae30-800dc9f97d61',
        attributes: {
            name: "Paddock A",
            is_location: true,
            is_fixed: true,
            land_type: "paddock",
            intrinsic_geometry: { value: 'POLYGON((0 0,-10 0,-10 10,0 10,0 0))' },
        },
      };

      const paddockB = {
        type: 'asset--land',
        id: '4bfcea1d-1540-4472-b73c-a6459489b265',
        attributes: {
            name: "Paddock B",
            is_location: true,
            is_fixed: true,
            land_type: "paddock",
            intrinsic_geometry: { value: 'POLYGON((0 0,10 0,10 10,0 10,0 0))' },
        },
      };

      const movementLog = {
        type: 'log--activity',
        id: '75dd9b2c-8ac6-411b-a17d-5dafb5a36cae',
        attributes: {
          name: 'Move Dolly to Paddock A & B',
          timestamp: formatRFC3339(Date.parse("2022-12-31T00:00:00.000Z")),
          status: "done",
          is_movement: true,
        },
        relationships: {
          asset: {
            data: [
              {
                type: dolly.type,
                id: dolly.id,
              }
            ]
          },
          location: {
            data: [
              {
                type: paddockA.type,
                id: paddockA.id,
              },
              {
                type: paddockB.type,
                id: paddockB.id,
              }
            ],
          },
        },
      };

      // TODO: Consider making this work within one transaction
      await assetLink.entitySource.update(t => [
          t.addRecord(sheepAnimalType),
          t.addRecord(dolly),
          t.addRecord(paddockA),
          t.addRecord(paddockB),
        ],
        {label: "Create referenced assets"}
      );

      await assetLink.entitySource.update(t => [
          t.addRecord(movementLog),
        ],
        {label: movementLog.attributes.name}
      );

      const createdLog = await assetLink.entitySource.query(q => q.findRecord({ type: 'log--activity', id: movementLog.id }));
  
      expect(fetch).not.toHaveBeenCalled();
  
      // console.log(JSON.stringify(createdLog));
      expect(createdLog.attributes.geometry).toBeDefined();
      expect(createdLog.attributes.geometry.value).toBe("GEOMETRYCOLLECTION (POLYGON ((0 0, -10 0, -10 10, 0 10, 0 0)),POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0)))");
      // TODO: Implement/Expect other geometry fields
    } finally {
      await assetLink.halt();
    }
  }, /* timeout: */ 1 * 1000);

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
  isOnline.mockImplementation(() => false);

  assetLink = new AssetLink(rootComponent, devToolsApi, { fetch, disableSubrequestGrouping: true });
});

const okWithStringBody = (strBody, respOpts) => new Response(strBody, {
  status: respOpts?.status?.code || 200,
  statusText: respOpts?.status?.text || 'OK',
  headers: {
    'Content-type': 'application/vnd.api+json',
  }
});

const okWithJsonBody = (objBody, respOpts) => okWithStringBody((JSON.stringify(objBody)), respOpts);

test('Supports Automatic Taxonomy Term Creation', async () => {
    assetLink.cores.farmData.getAssetTypes = async () => ['animal', 'land'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getLogTypes = async () => ['activity', 'observation'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getTaxonomyVocabularies = async () => [];

    await assetLink.boot();

    fetch.mockClear();

    try {
      const dolly = {
        type: 'asset--animal',
        id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b',
        attributes: {
            name: "Dolly"
        },
        relationships: {
          animal_type: {
            data: {
              type: "taxonomy_term--animal_type",
              id: '83fd2d9f-81e0-4418-a169-57d89172fdb7',
              $relateByName: {
                name: 'Sheep',
              }
            },
          }
        }
      };

      const createdDolly = await assetLink.entitySource.update(t => t.addRecord(dolly),
        {label: "Create animal asset"}
      );

      const updatedDolly = await assetLink.entitySource.update((t) =>
        t.replaceRelatedRecord({ type: dolly.type, id: dolly.id }, 'animal_type', {
          type: "taxonomy_term--animal_type",
          id: '714c8c36-f08a-4f04-a649-8ee97721e4dc',
          $relateByName: {
            name: 'Penguin',
          },
        }), {label: `Make "Dolly" a penguin`});

      expect(fetch).not.toHaveBeenCalled();

      expect(createdDolly.relationships.animal_type.data.id).toBe('83fd2d9f-81e0-4418-a169-57d89172fdb7');
      expect(updatedDolly.relationships.animal_type.data.id).toBe('714c8c36-f08a-4f04-a649-8ee97721e4dc');

      fetch.mockImplementation(async (url, opts) => {
        const u = new URL(url);
    
        const handlers = [];
        const addHandler = (matcher, responder) => {
          handlers.push({
            matcher,
            responder,
          });
        };

        addHandler(
          () => u.pathname.endsWith('/session/token'),
          () => okWithStringBody('secret-anti-csrf-token123')
        );

        addHandler(
          () => opts.method === 'GET' && u.pathname.endsWith('/api/taxonomy_term/animal_type') && u.search.indexOf('Sheep') !== -1,
          () => okWithJsonBody({
            data: []
          })
        );

        const termExists = (termName, termId) => {
          addHandler(
            () => opts.method === 'GET' && u.pathname.endsWith('/api/taxonomy_term/animal_type') && u.search.indexOf(termName) !== -1,
            () => okWithJsonBody({
              data: [{
                type: 'taxonomy_term--animal_type',
                id: termId,
                attributes: {
                  name: termName,
                  revision_log_message: 'From the server',
                },
              }]
            })
          );
        };

        termExists('Penguin', '156831b2-bebb-43a0-bd5d-c571e3a4facd');

        let reqBody = {};
        if (opts.method === 'POST') {
          reqBody = JSON.parse(opts.body);
        }

        addHandler(
          () => opts.method === 'POST' && u.pathname.endsWith('/api/taxonomy_term/animal_type'),
          () => okWithJsonBody({
            data: {
              type: 'taxonomy_term--animal_type',
              id: reqBody.data.id,
              attributes: {
                name: reqBody.data.attributes.name,
                revision_log_message: 'From the server',
              },
            }
          }, { status: { code: 201, text: 'CREATED' }})
        );

        addHandler(
          () => opts.method === 'POST' && u.pathname.endsWith('/api/asset/animal'),
          () => okWithJsonBody({
            data: {
              type: 'taxonomy_term--animal_type',
              id: reqBody.data.id,
              attributes: {
                ...reqBody.data.attributes,
                revision_log_message: 'From the server initial creation of Dolly',
              },
              relationships: {
                ...(reqBody?.data?.relationships || {}),
              },
            }
          }, { status: { code: 201, text: 'CREATED' }})
        );

        addHandler(
          () => opts.method === 'PATCH' && u.pathname.endsWith('/api/asset/animal/8e10c68b-49b9-43e1-ad2a-c18b1696290b'),
          () => okWithJsonBody({
            data: {
              type: 'asset--animal',
              id: '8e10c68b-49b9-43e1-ad2a-c18b1696290b',
              attributes: {
                revision_log_message: 'From the server update to Dolly',
              },
              relationships: {
                ...(reqBody?.data?.relationships || {}),
              },
            }
          })
        );

        const handler = handlers.find(h => h.matcher());
        if (handler) {
          return handler.responder();
        }
    
        return await fetchDelegate(url, opts);
      });

      isOnline.mockImplementation(() => true);
      window.dispatchEvent(new window.Event('online'));

      await assetLink.cores.farmData._remote.requestQueue.currentProcessor.settle();
      await delay(1);
      await assetLink.cores.farmData._remote.requestQueue.currentProcessor.settle();
      await delay(1);

      const finalDolly = await assetLink.entitySource.query(q =>
        q.findRecord({ type: dolly.type, id: dolly.id }));

      expect(finalDolly.attributes.revision_log_message).toBe('From the server update to Dolly');
      expect(finalDolly.relationships.animal_type.data.id).toBe('156831b2-bebb-43a0-bd5d-c571e3a4facd');
    } finally {
      await assetLink.halt();
    }
  }, /* timeout: */ 3 * 1000);

  test('Supports Automatic Taxonomy Term Creation for Multi-value fields', async () => {
    assetLink.cores.farmData.getAssetTypes = async () => ['animal', 'land'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getLogTypes = async () => ['activity', 'observation'].map(lt => ({ attributes: { drupal_internal__id: lt }}));
    assetLink.cores.farmData.getTaxonomyVocabularies = async () => [];

    await assetLink.boot();

    fetch.mockClear();

    try {
      const squashPlantType = {
        type: 'taxonomy_term--plant_type',
        id: '1219ebaa-205e-4922-8b64-de7cace45e47',
        attributes: {
            name: "Squash"
        },
        relationships: {
          companions: {
            data: [
              {
                type: "taxonomy_term--plant_type",
                id: 'bae8b611-2059-4f8c-8579-7b53bb072c2b',
                $relateByName: {
                  name: 'Corn',
                }
              },
              {
                type: "taxonomy_term--plant_type",
                id: 'aae7a9b9-8f68-43db-94e9-993692917c34',
                $relateByName: {
                  name: 'Beans',
                }
              },
              {
                type: "taxonomy_term--plant_type",
                id: 'dcb42a38-d5b4-4f05-8d99-81c83df69d23',
                $relateByName: {
                  name: 'Marigolds',
                }
              },
            ],
          }
        }
      };

      const createdSquashPlantType = await assetLink.entitySource.update(t => t.addRecord(squashPlantType),
        {label: "Create squash plant type"}
      );

      const createdSquashPlantTypeCompanions = createdSquashPlantType.relationships.companions.data;

      expect(createdSquashPlantTypeCompanions).toHaveLength(3);
      expect(createdSquashPlantTypeCompanions[0].id).toBe('bae8b611-2059-4f8c-8579-7b53bb072c2b');
      // Id here is still the value we specified above because the addRecord update hasn't been pushed to the server yet
      expect(createdSquashPlantTypeCompanions[1].id).toBe('aae7a9b9-8f68-43db-94e9-993692917c34');
      expect(createdSquashPlantTypeCompanions[2].id).toBe('dcb42a38-d5b4-4f05-8d99-81c83df69d23');

      const cachedSquashPlantType = await assetLink.entitySource.query(q =>
        q.findRecord({ type: squashPlantType.type, id: squashPlantType.id }));

      const cachedSquashPlantTypeCompanions = cachedSquashPlantType.relationships.companions.data;

      expect(cachedSquashPlantTypeCompanions).toHaveLength(3);
      expect(cachedSquashPlantTypeCompanions[0].id).toBe('bae8b611-2059-4f8c-8579-7b53bb072c2b');
      // Id here is still the value we specified above because the addRecord update hasn't been pushed to the server yet
      expect(cachedSquashPlantTypeCompanions[1].id).toBe('aae7a9b9-8f68-43db-94e9-993692917c34');
      expect(cachedSquashPlantTypeCompanions[2].id).toBe('dcb42a38-d5b4-4f05-8d99-81c83df69d23');

      const cachedSquashPlantTypeCompanionsByRel = await assetLink.entitySource.query(q =>
        q.findRelatedRecords({ type: squashPlantType.type, id: squashPlantType.id }, 'companions'));

      expect(cachedSquashPlantTypeCompanionsByRel).toHaveLength(3);
      expect(cachedSquashPlantTypeCompanionsByRel[0].id).toBe('bae8b611-2059-4f8c-8579-7b53bb072c2b');
      // Id here is still the value we specified above because the addRecord update hasn't been pushed to the server yet
      expect(cachedSquashPlantTypeCompanionsByRel[1].id).toBe('aae7a9b9-8f68-43db-94e9-993692917c34');
      expect(cachedSquashPlantTypeCompanionsByRel[2].id).toBe('dcb42a38-d5b4-4f05-8d99-81c83df69d23');

      fetch.mockImplementation(async (url, opts) => {
        const u = new URL(url);

        const handlers = [];
        const addHandler = (matcher, responder) => {
          handlers.push({
            matcher,
            responder,
          });
        };

        addHandler(
          () => u.pathname.endsWith('/session/token'),
          () => okWithStringBody('secret-anti-csrf-token123')
        );

        addHandler(
          () => opts.method === 'GET' && u.pathname.endsWith('/api/taxonomy_term/plant_type') && u.search.indexOf('Corn') !== -1 || u.search.indexOf('Marigolds') !== -1,
          () => okWithJsonBody({
            data: []
          })
        );

        const termExists = (termName, termId) => {
          addHandler(
            () => opts.method === 'GET' && u.pathname.endsWith('/api/taxonomy_term/plant_type') && u.search.indexOf(termName) !== -1,
            () => okWithJsonBody({
              data: [{
                type: 'taxonomy_term--plant_type',
                id: termId,
                attributes: {
                  name: termName,
                  revision_log_message: 'From the server',
                },
              }]
            })
          );
        };

        termExists('Beans', 'accd8d93-2854-4c3f-b9b1-04136ae8183c');
        termExists('Radishes', '30df1ea0-6e12-44f4-a8b9-690b787af36f');
        termExists('Nasturtiums', '9e0e576e-db65-468c-8ae1-2d012c427d56');

        let reqBody = {};
        if (opts.method === 'POST') {
          reqBody = JSON.parse(opts.body);
        }

        addHandler(
          () => opts.method === 'POST' && u.pathname.endsWith('/api/taxonomy_term/plant_type'),
          () => okWithJsonBody({
            data: {
              type: 'taxonomy_term--plant_type',
              id: reqBody.data.id,
              attributes: {
                name: reqBody.data.attributes.name,
                revision_log_message: 'From the server',
              },
            }
          }, { status: { code: 201, text: 'CREATED' }})
        );

        addHandler(
          () => opts.method === 'POST' && u.pathname.endsWith('/api/taxonomy_term/plant_type/1219ebaa-205e-4922-8b64-de7cace45e47/relationships/companions'),
          () => okWithJsonBody({
            data: [
              {
                type: 'taxonomy_term--plant_type',
                id: 'bae8b611-2059-4f8c-8579-7b53bb072c2b',
              },
              {
                type: 'taxonomy_term--plant_type',
                id: 'accd8d93-2854-4c3f-b9b1-04136ae8183c',
              },
              {
                type: 'taxonomy_term--plant_type',
                id: 'dcb42a38-d5b4-4f05-8d99-81c83df69d23',
              },
              {
                type: 'taxonomy_term--plant_type',
                id: '30df1ea0-6e12-44f4-a8b9-690b787af36f',
              }
            ]
          })
        );

        addHandler(
          () => opts.method === 'PATCH' && u.pathname.endsWith('/api/taxonomy_term/plant_type/1219ebaa-205e-4922-8b64-de7cace45e47'),
          () => okWithJsonBody({
            data: {
              type: 'taxonomy_term--plant_type',
              id: '1219ebaa-205e-4922-8b64-de7cace45e47',
              attributes: {
                revision_log_message: 'From the server PATCH to Squash plant type',
              },
              relationships: {
                companions: {
                  data: [
                    {
                      type: 'taxonomy_term--plant_type',
                      id: 'bae8b611-2059-4f8c-8579-7b53bb072c2b',
                    },
                    {
                      type: 'taxonomy_term--plant_type',
                      id: '9e0e576e-db65-468c-8ae1-2d012c427d56',
                    },
                    {
                      type: 'taxonomy_term--plant_type',
                      id: '30df1ea0-6e12-44f4-a8b9-690b787af36f',
                    },
                  ]
                }
              },
            }
          })
        );

        const handler = handlers.find(h => h.matcher());
        if (handler) {
          return handler.responder();
        }

        return await fetchDelegate(url, opts);
      });

      isOnline.mockImplementation(() => true);
      window.dispatchEvent(new window.Event('online'));

      await assetLink.cores.farmData._remote.requestQueue.currentProcessor.settle();
      await delay(1);

      const finalSquashPlantType = await assetLink.entitySource.query(q =>
        q.findRecord({ type: squashPlantType.type, id: squashPlantType.id }));

      const finalSquashPlantTypeCompanions = finalSquashPlantType?.relationships?.companions?.data;

      expect(finalSquashPlantTypeCompanions).toHaveLength(3);
      expect(finalSquashPlantTypeCompanions[0].id).toBe('bae8b611-2059-4f8c-8579-7b53bb072c2b');

      // Id here is the one from the server, not the "placeholder" value we specified in the addRecord statement above
      expect(finalSquashPlantTypeCompanions[1].id).toBe('accd8d93-2854-4c3f-b9b1-04136ae8183c');

      expect(finalSquashPlantTypeCompanions[2].id).toBe('dcb42a38-d5b4-4f05-8d99-81c83df69d23');

      const updatedSquashPlantType = await assetLink.entitySource.update((t) =>
        t.addToRelatedRecords({ type: squashPlantType.type, id: squashPlantType.id }, 'companions', {
          type: "taxonomy_term--plant_type",
          id: '3a8d0f70-ef26-4202-b144-85bac9660324',
          $relateByName: {
            name: 'Radishes',
          },
      }), {label: `Add Radishes as a companion`});

      const updatedSquashPlantTypeCompanions = updatedSquashPlantType.relationships.companions.data;

      expect(updatedSquashPlantTypeCompanions).toHaveLength(4);
      expect(updatedSquashPlantTypeCompanions[0].id).toBe('bae8b611-2059-4f8c-8579-7b53bb072c2b');
      expect(updatedSquashPlantTypeCompanions[1].id).toBe('accd8d93-2854-4c3f-b9b1-04136ae8183c');
      expect(updatedSquashPlantTypeCompanions[2].id).toBe('dcb42a38-d5b4-4f05-8d99-81c83df69d23');

      // Id here is the one from the server, not the "placeholder" value we specified in the addToRelatedRecords statement above
      expect(updatedSquashPlantTypeCompanions[3].id).toBe('30df1ea0-6e12-44f4-a8b9-690b787af36f');

      const updatedSquashPlantType2 = await assetLink.entitySource.update((t) =>
        t.replaceRelatedRecords({ type: squashPlantType.type, id: squashPlantType.id }, 'companions', [
          {
            type: "taxonomy_term--plant_type",
            id: 'bae8b611-2059-4f8c-8579-7b53bb072c2b',
            $relateByName: {
              name: 'Corn',
            }
          },
          {
            type: "taxonomy_term--plant_type",
            id: '2f77dfa0-7385-43a7-ac06-639d7ad09c1f',
            $relateByName: {
              name: 'Nasturtiums',
            },
          },
          {
            type: "taxonomy_term--plant_type",
            id: '3a8d0f70-ef26-4202-b144-85bac9660324',
            $relateByName: {
              name: 'Radishes',
            },
          },
      ]), {label: `Replace with only Corn, Nasturtiums, and Radishes as companions`});

      const updatedSquashPlantTypeCompanions2 = updatedSquashPlantType2.relationships.companions.data;

      expect(updatedSquashPlantTypeCompanions2).toHaveLength(3);
      expect(updatedSquashPlantTypeCompanions2[0].id).toBe('bae8b611-2059-4f8c-8579-7b53bb072c2b');
      expect(updatedSquashPlantTypeCompanions2[1].id).toBe('9e0e576e-db65-468c-8ae1-2d012c427d56');
      expect(updatedSquashPlantTypeCompanions2[2].id).toBe('30df1ea0-6e12-44f4-a8b9-690b787af36f');
    } finally {
      await assetLink.halt();
    }
  }, /* timeout: */ 3 * 1000);

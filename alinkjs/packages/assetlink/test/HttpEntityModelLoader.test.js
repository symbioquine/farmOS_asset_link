import HttpEntityModelLoader from '../src/HttpEntityModelLoader';

import { createTestFarm } from './createTestFarm';

let farm = undefined;

beforeAll(async () => {
    farm = await createTestFarm()
}, /* timeout: */ 10 * 1000);

afterAll(async () => {
    await farm.cleanup()
}, /* timeout: */ 10 * 1000);

test('Simple Test', async () => {
  jsdom.reconfigure({ url: farm.url.toString() });

  window.assetLinkDrupalBasePath = farm.init_data.path;

  const fetch = jest.fn((url, opts) => farm.fetch(url, opts));

  const store = {
      getItem: jest.fn(),
      setItem: jest.fn(),
  };

  const reportProgressFn = jest.fn();

  const entityModelLoader = new HttpEntityModelLoader({ baseUrl: farm.url, fetch, store, reportProgressFn });

  const loadedModels = await entityModelLoader.loadModels();

  expect(Object.keys(loadedModels)).toContain('asset--animal');

  expect(Object.keys(loadedModels['asset--animal'])).toContain('attributes');
  expect(Object.keys(loadedModels['asset--animal'])).toContain('relationships');

  expect(Object.keys(loadedModels['asset--animal'].attributes)).toContain('name');
  expect(Object.keys(loadedModels['asset--animal'].attributes)).toContain('changed');
  expect(Object.keys(loadedModels['asset--animal'].attributes)).toContain('is_fixed');

  expect(Object.keys(loadedModels['asset--animal'].relationships)).toContain('animal_type');
  expect(Object.keys(loadedModels['asset--animal'].relationships)).toContain('location');
  expect(Object.keys(loadedModels['asset--animal'].relationships)).toContain('parent');
}, /* timeout: */ 60 * 1000);

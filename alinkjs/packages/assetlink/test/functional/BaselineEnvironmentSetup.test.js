import { initDefaults, FARM_URL } from './functionalScaffold';

import { createDrupalUrl } from "assetlink-plugin-api";

initDefaults();

test('Baseline environment set up', () => {
  expect(window.location.toString()).toBe(FARM_URL.toString());
  expect(createDrupalUrl('api').toString()).toBe(FARM_URL.toString() + '/api');
});

import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import * as Quasar from 'quasar';
import * as AssetlinkPluginApi from 'assetlink-plugin-api';
import ngeohash from 'ngeohash';
import haversineDistance from 'haversine-distance';
import jmespath from 'jmespath';
import * as micromustache from 'micromustache';
import * as Buffer from 'buffer/';

const libraries = {
  'buffer/': Buffer,

  'assetlink-plugin-api': AssetlinkPluginApi,
  vue: Vue,
  'vue-router': VueRouter,
  'quasar': Quasar,

  ngeohash,
  'haversine-distance': haversineDistance,

  jmespath,

  micromustache,
}

export const pluginModuleLibraryNames = Object.keys(libraries);

export default Object.assign(Object.create(null), libraries);

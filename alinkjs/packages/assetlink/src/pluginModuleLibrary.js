import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import * as Quasar from 'quasar';
import * as AssetlinkPluginApi from 'assetlink-plugin-api';
import geohash from 'ngeohash';
import haversine from 'haversine-distance';

const libraries = {
  'assetlink-plugin-api': AssetlinkPluginApi,
  vue: Vue,
  'vue-router': VueRouter,
  'quasar': Quasar,

  geohash,
  haversine,

  // TODO: Figure out how to make loading these cleaner/on-demand
  // 'vue-codemirror': import('vue-codemirror'),
  // 'codemirror/mode/javascript/javascript.js': import('codemirror/mode/javascript/javascript.js'),
  // 'codemirror/mode/vue/vue.js': import('codemirror/mode/vue/vue.js'),
  // 'codemirror/lib/codemirror.css': import('codemirror/lib/codemirror.css'),
  // 'codemirror/theme/base16-dark.css': import('codemirror/theme/base16-dark.css'),
}

export const pluginModuleLibraryNames = Object.keys(libraries);

export default Object.assign(Object.create(null), libraries);

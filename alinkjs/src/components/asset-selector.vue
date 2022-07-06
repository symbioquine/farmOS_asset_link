<template>
  <v-card>
    <v-card-title class="text-h5 grey lighten-2">
      {{ title }}
    </v-card-title>

    <div class="text-center my-4">
      <v-btn-toggle v-model="currentSearchMethod" mandatory>
        <v-btn
          outlined
          x-large
          fab
          color="indigo"
          :value="'text-search'">
          <v-icon>mdi-keyboard-outline</v-icon>
        </v-btn>
        <v-btn
          outlined
          x-large
          fab
          color="indigo"
          :value="'scan-qr-code'">
          <v-icon>mdi-qrcode-scan</v-icon>
        </v-btn>
        <v-btn
          outlined
          x-large
          fab
          color="indigo"
          :value="'proximity-search'"
          @click="currentSearchMethod === 'proximity-search' && tryGetLocation()">
          <v-icon>{{ currentSearchMethod === 'proximity-search' ? 'mdi-map-marker-plus' : 'mdi-map-marker-radius' }}</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>

    <qr-code-scanner v-if="currentSearchMethod == 'scan-qr-code'" @qr-code-scanned="qrCodeScanned($event)" @qr-code-err="qrCodeErr"></qr-code-scanner>

    <div v-if="currentSearchMethod == 'proximity-search'" ref="map-div"></div>

    <v-divider></v-divider>

    <v-container fluid>
      <v-textarea
        :loading="isSearchingAssets"
        v-model="searchText"
        :label="inputLabel"
        :placeholder="inputPlaceholder"
        prepend-icon="mdi-magnify"
        rows="1"
        clearable
        :readonly="searchDisabled"
        ref="searchInput"
        @focus="currentSearchMethod='text-search'"
        @input="onTextSearchInput"
      ></v-textarea>

      <v-list dense>
        <v-subheader v-if="assetLink.viewModel.connectionStatus.isOnline">Results</v-subheader>
        <v-subheader v-else>Offline results (May be stale/incomplete)</v-subheader>
        <v-list-item-group
          v-model="selectedItems"
          color="primary"
          :multiple="selectMultiple"
        >
          <v-list-item v-for="(item, i) in searchResultEntries" :key="i">
            <v-list-item-icon>
              <v-icon>mdi-tree</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title v-text="item.asset.attributes.name"></v-list-item-title>
              <v-list-item-subtitle v-text="item.weightText"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>

    </v-container>

    <v-divider></v-divider>

    <v-card-actions>
      <v-btn color="normal" text @click="onCancel()">
        Cancel
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn color="primary" text @click="onAccept()" :disabled="!hasAssetSelection">
        {{ confirmLabel }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { v4 as uuidv4 } from 'uuid';

import { throttle } from 'lodash';

export default {
  inject: ['assetLink'],
  props: {
    title: { type: String, required: true },
    inputLabel: { type: String, default: 'Search' },
    inputPlaceholder: { type: String, default: 'Search Assets' },
    searchMethod: { type: String, default: 'text-search' },
    selectMultiple: { type: Boolean, default: false },
    confirmLabel: { type: String, default: 'Choose' },
  },
  data() {
    return {
      currentSearchMethod: this.searchMethod,
      infos: [],

      isSearchingAssets: false,

      searchText: null,
      searchDisabled: false,

      searchRequest: null,

      maxDesiredSearchEntries: 5,
      searchResultEntries: [],

      selectedItems: [],
    };
  },
  created() {
    if (this.currentSearchMethod === 'text-search') {
      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.searchInput.$refs.input.focus();
        });
      });
    }
  },
  computed: {
    hasAssetSelection() {
      if (this.selectedItems instanceof Array) {
        return this.selectedItems.length > 0;
      }
      return this.selectedItems !== undefined;
    },
  },
  watch: {
    searchMethod(method) {
      if (method) {
        this.currentSearchMethod = method;
      }
    },
    currentSearchMethod (method) {
      this.searchDisabled = method === 'proximity-search';

      if (method && method === 'proximity-search') {
        this.tryGetLocation();
      }
      if (method === 'text-search') {
        this.$nextTick(() => {
          setTimeout(() => {
            this.$refs.searchInput.$refs.input.focus();
          });
        });
      }
    },
    searchRequest (val) {
      console.log(`search request changed: ${val}`);
      this.searchAssets();
    },
  },
  methods: {
    onCancel() {
      this.$emit('submit', undefined);
    },
    onAccept() {
      const selectedItems = (this.selectedItems instanceof Array) ? this.selectedItems : [this.selectedItems];

      this.$emit('submit', selectedItems.map(idx => this.searchResultEntries[idx].asset));
    },
    onTextSearchInput(term) {
      this.searchRequest = {
          id: uuidv4(),
          type: 'text-search',
          term: term,
      };
    },
    async tryGetLocation() {
      const self = this;

      const geolocationOpts = {
        enableHighAccuracy: true,
        maximumAge: 0,
      };

      let pos;
      try {
        pos = await getGeoPosition(geolocationOpts);
      } catch (e) {
        this.assetLink.viewModel.messages.push({text: `Failed to get geolocation: ${e.message}`, type: "error"});
        console.log(e);
      }

      // Copy the contents since it can't be stringified in some browser/os combinations
      // https://stackoverflow.com/questions/69695705
      const posCopy = {
          "coords": {
            "latitude": pos.coords.latitude,
            "longitude": pos.coords.longitude,
            "accuracy": pos.coords.accuracy,
            "altitude": pos.coords.altitude,
            "altitudeAccuracy": pos.coords.altitudeAccuracy,
            "heading": pos.coords.heading,
            "speed": pos.coords.speed
        },
        "timestamp": pos.timestamp
      };
      console.log(`Location acquired: ${JSON.stringify(posCopy)}`);

      const crd = posCopy.coords;

      const searchText = `pos: ${crd.latitude.toFixed(6)},${crd.longitude.toFixed(6)} (+/-${Math.round(crd.accuracy, 3)}m)`;
      if (self.searchText !== searchText) {
        self.searchText = searchText;
        self.searchRequest = {
            id: uuidv4(),
            type: 'proximity-search',
            coordinates: crd,
        };
      }

    },
    /* eslint-disable class-methods-use-this,no-unused-vars */
    searchAssets: throttle(async function searchAssets () {
      const currSearchId = this.searchRequest.id;

      this.isSearchingAssets = true;

      let assetSearchResultCursor = this.assetLink.searchAssets(this.searchRequest, 'local');

      if (this.assetLink.viewModel.connectionStatus.isOnline) {
        assetSearchResultCursor = new RacingLocalRemoteAsyncIterator(
            assetSearchResultCursor,
            this.assetLink.searchAssets(this.searchRequest, 'remote'),
        );
      }

      if (currSearchId !== this.searchRequest.id) {
        return;
      }

      this.assetSearchResultCursor = assetSearchResultCursor;
      this.maxDesiredSearchEntries = 10;
      this.searchResultEntries = [];

      const alreadyFoundAssetIds = new Set();

      let searchIterItem = {};
      while (this.searchResultEntries.length < this.maxDesiredSearchEntries && !searchIterItem.done) {
        searchIterItem = await assetSearchResultCursor.next();
        console.log("searchIterItem:", searchIterItem);

        if (currSearchId !== this.searchRequest.id) {
          return;
        }

        if (searchIterItem.value && !alreadyFoundAssetIds.has(searchIterItem.value.asset.id)) {
          alreadyFoundAssetIds.add(searchIterItem.value.asset.id);
          this.searchResultEntries.push(searchIterItem.value);
        }
      }

      this.isSearchingAssets = false;
    }, 500),
    async qrCodeScanned(qrCodeText) {
      console.log(`qrCodeScanned: ${qrCodeText}`);

      if (qrCodeText !== this.searchText) {
        this.searchText = qrCodeText;
        this.searchRequest = {
            id: uuidv4(),
            type: 'text-search',
            term: qrCodeText,
        };
      }
    },
    qrCodeErr(err) {
      console.log('Error: ' + err.message + " - " + JSON.stringify(err));
    },
  },
}

function getGeoPosition(options) {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
}

/**
 * Returns results from a 'local' async iterator until a 'remote' one starts
 * returning results then only returns results from the 'remote' one after that.
 */
class RacingLocalRemoteAsyncIterator {
  constructor(localDelegate, remoteDelegate) {
    this._localDelegate = localDelegate;
    this._remoteDelegate = remoteDelegate;
    this._firstRemoteItemPromise = remoteDelegate.next();
    this._localDone = false;
    this._remoteReady = false;
    
  }

  async next() {
    if (this._remoteReady) {
      return await this._remoteDelegate.next();
    }

    const s = await promiseState(this._firstRemoteItemPromise);

    if (s === 'fulfilled' || this._localDone) {
      this._remoteReady = true;
      return await this._firstRemoteItemPromise;
    }

    const localItem = await this._localDelegate.next();

    if (localItem.done) {
      this._localDone = true;
    }
    localItem.done = false;
    return localItem;
  }

}

// From https://stackoverflow.com/a/35820220/1864479
function promiseState(p) {
  const t = {};
  return Promise.race([p, t])
    .then(v => (v === t)? "pending" : "fulfilled", () => "rejected");
}
</script>

<script setup>
import { computed, inject, ref } from 'vue';
import { uuidv4 } from 'assetlink-plugin-api';

const assetLink = inject('assetLink');
const currentSearchMethod = inject('currentSearchMethod');

const searchText = ref('');

const emit = defineEmits(["update:searchRequest"]);

const icon = computed(() => {
  return currentSearchMethod.value === 'proximity-search' ? 'mdi-map-marker-plus' : 'mdi-map-marker-radius';
});

function getGeoPosition(options) {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
}

const tryGetLocation = async () => {
  const self = this;

  const geolocationOpts = {
    enableHighAccuracy: true,
    maximumAge: 0,
  };

  let pos;
  try {
    pos = await getGeoPosition(geolocationOpts);
  } catch (e) {
    console.log("Failed to get geolocation:", e);
    if (e instanceof GeolocationPositionError && e.code === 1) {
      assetLink.vm.messages.push({text: "Failed to get geolocation: Permission denied by browser. Please grant location access to this page to fix proximity searching.", type: "warning"});
    } else {
      assetLink.vm.messages.push({text: `Failed to get geolocation: ${e.message}`, type: "error"});
    }
    return;
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

  const newSearchText = `pos: ${crd.latitude.toFixed(6)},${crd.longitude.toFixed(6)} (+/-${Math.round(crd.accuracy, 3)}m)`;
  if (searchText.value !== newSearchText) {
    console.log(`Location changed - issuing updated search request...`);
    searchText.value = newSearchText;
    emit('update:searchRequest', {
      id: uuidv4(),
      type: 'proximity-search',
      coordinates: crd,
    });
  } else {
    console.log(`Skipping issuing of unchanged location search request.`);
  }

}

if (currentSearchMethod.value === 'proximity-search') {
  tryGetLocation();
}
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.asset_search.v0.proximity]="asset-search-method(weight: 150)">
  <search-method
    name="proximity-search"
    :icon="icon"
    @tile-clicked="tryGetLocation">

    <template #search-interface>
      <div class="q-pa-md">
        <q-input v-model="searchText" disabled />
      </div>
    </template>

  </search-method>

</template>

<script>
import geohash from 'ngeohash';
import haversine from 'haversine-distance';

/**
 * Searches for assets by their proximity to a given location.
 */
export default {
  searchAssets(assetLink, searchRequest, searchPhase) {
    if (searchRequest.type !== 'proximity-search') {
      return undefined;
    }

    const crd = searchRequest.coordinates;

    const ghash = geohash.encode(crd.latitude, crd.longitude);

    // 4 Geohash digits is ~78 km which we'll consider the limit for practical "proximity"
    const minHashLength = 3;

    // The best we could do is searching the nearest 5 meters
    var startingHashLength = 9;

    // Start with a wider search radius when geolocation accuracy is low
    if (crd.accuracy > 5) startingHashLength = 8;
    if (crd.accuracy > 20) startingHashLength = 7;

    const self = this;

    async function* iterativelyWideningSearch() {
      for(let hashLength = startingHashLength; hashLength >= minHashLength; hashLength--) {

        const ghashPrefix = ghash.slice(0, hashLength);

        // Exclude the previous prefix so we don't have duplicate results in progressively widening search radii
        const excludedGhashPrefix = hashLength == startingHashLength ? undefined : ghash.slice(0, hashLength + 1);

        const resultItems = await self._searchAssetsWithGeohashPrefix(assetLink, searchRequest, searchPhase, ghashPrefix, excludedGhashPrefix);

        for (let resultItem of resultItems) {
          yield resultItem;
        }

      }
    }

    return iterativelyWideningSearch();
  },

  /* eslint-disable class-methods-use-this */
  async _searchAssetsWithGeohashPrefix(assetLink, searchRequest, searchPhase, ghashPrefix, excludedGhashPrefix) {

    const assetTypes = (await assetLink.getAssetTypes()).map(t => t.attributes.drupal_internal__id);

    const entitySource = searchPhase === 'local' ? assetLink.entitySource.cache : assetLink.entitySource;

    const additionalFilters = searchRequest.additionalFilters || [];

    const results = await entitySource.query(q => assetTypes.map(assetType => {
      let baseQuery = q
        .findRecords(`asset--${assetType}`)
        .filter({ attribute: 'intrinsic_geometry.geohash', op: 'CONTAINS', value: ghashPrefix });

      return additionalFilters
        .reduce((query, f) => query.filter(f), baseQuery)
        .sort('drupal_internal__id');
    }));

    const assets = results.flatMap(l => l);

    const crd = searchRequest.coordinates;

    const filteredAssetResults = [];

    for await (let asset of assets) {
      const geometry = asset.attributes?.geometry;

      if (!geometry || !geometry.geohash.startsWith(ghashPrefix)) {
        continue;
      }

      if (excludedGhashPrefix && geometry.geohash.startsWith(excludedGhashPrefix)) {
        continue;
      }

      const weight = haversine({lat: crd.latitude, lng: crd.longitude}, {lat: geometry.lat, lng: geometry.lon});

      filteredAssetResults.push({
        weight,
        weightText: `~${weight.toFixed(2)}m away`,
        asset,
      });
    }

    filteredAssetResults.sort((firstEl, secondEl) => firstEl.weight - secondEl.weight);

    return filteredAssetResults;
  }

}
</script>

/**
 * Searches for assets by their proximity to a given location.
 */
export default class ProximityAssetSearcher {

  searchAssets(assetLink, searchRequest, searchPhase) {
    if (searchRequest.type !== 'proximity-search') {
      return undefined;
    }

    const crd = searchRequest.coordinates;

    const ghash = assetLink.util.geohash.encode(crd.latitude, crd.longitude);

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
  }

  /* eslint-disable class-methods-use-this */
  async _searchAssetsWithGeohashPrefix(assetLink, searchRequest, searchPhase, ghashPrefix, excludedGhashPrefix) {

    const assetTypes = (await assetLink.getAssetTypes()).map(t => t.attributes.drupal_internal__id);

    const entitySource = searchPhase === 'local' ? assetLink.entitySource.cache : assetLink.entitySource;

    const results = await entitySource.query(q => assetTypes.map(assetType => q
        .findRecords(`asset--${assetType}`)
        .filter({ attribute: 'intrinsic_geometry.geohash', op: 'CONTAINS', value: ghashPrefix })
        .sort('drupal_internal__id')));

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

      const weight = assetLink.util.haversine({lat: crd.latitude, lng: crd.longitude}, {lat: geometry.lat, lng: geometry.lon});

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

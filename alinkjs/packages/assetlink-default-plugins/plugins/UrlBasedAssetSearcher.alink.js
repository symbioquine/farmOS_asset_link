/**
 * Searches for assets by examining a url to see if it is a simple farmOS asset url.
 */
export default class UrlBasedAssetSearcher {

  static searchAssets(assetLink, searchRequest) {
    if (searchRequest.type !== 'text-search') {
      return undefined;
    }

    const term = searchRequest.term;

    if (!term) {
      return undefined;
    }

    const matches = term.match(/https?:\/\/.*\/asset\/(\d+)/);

    console.log(matches);

    if (!matches || matches.length < 2) {
      return undefined;
    }

    const additionalFilters = searchRequest.additionalFilters || [];

    const assetDrupalInternalId = matches[1];

    async function* assetResultsIterator() {
      const asset = await assetLink.resolveAsset(assetDrupalInternalId, additionalFilters);

      if (!asset) {
        return;
      }

      yield {
        weight: 0,
        weightText: `Asset with id=${assetDrupalInternalId}`,
        asset,
      };
    }

    return assetResultsIterator();
  }
}
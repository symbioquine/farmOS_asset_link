/**
 * Searches for assets by name.
 */
export default class NamedBasedAssetSearcher {

  static searchAssets(assetLink, searchRequest, searchPhase) {
    if (searchRequest.type !== 'text-search') {
      return undefined;
    }

    const term = searchRequest.term;
    const additionalFilters = searchRequest.additionalFilters || [];

    if (!term) {
      return undefined;
    }

    async function* iteratePaginatedResults() {
      const assetTypes = (await assetLink.getAssetTypes()).map(t => t.attributes.drupal_internal__id);

      const entitySource = searchPhase === 'local' ? assetLink.entitySource.cache : assetLink.entitySource;

      const results = await entitySource.query(q => assetTypes.map(assetType => {
        let baseQuery = q
          .findRecords(`asset--${assetType}`)
          .filter({ attribute: 'name', op: 'CONTAINS', value: term });

        return additionalFilters
          .reduce((query, f) => query.filter(f), baseQuery)
          .sort('drupal_internal__id');
      }));

      const assets = results.flatMap(l => l);

      console.log("NamedBasedAssetSearcher::searchAssets", assets);

      for (let asset of assets) {
        yield {
          weight: 1,
          weightText: `Name contains term "${term}"`,
          asset,
        };
      }
    }

    return iteratePaginatedResults();
  }
}
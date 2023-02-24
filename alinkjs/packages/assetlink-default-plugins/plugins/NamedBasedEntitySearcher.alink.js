/**
 * Searches for assets by name.
 */
export default class NamedBasedEntitySearcher {

  static searchEntities(assetLink, searchRequest, searchPhase) {
    if (searchRequest.type !== 'text-search') {
      return undefined;
    }

    const term = searchRequest.term;
    const additionalFilters = searchRequest.additionalFilters || [];

    async function* iteratePaginatedResults() {
      let entityBundles = searchRequest.entityBundles;

      if (!entityBundles && searchRequest.entityType === 'asset') {
        entityBundles = (await assetLink.getAssetTypes()).map(t => t.attributes.drupal_internal__id);
      }

      if (!entityBundles && searchRequest.entityType === 'log') {
        entityBundles = (await assetLink.getLogTypes()).map(t => t.attributes.drupal_internal__id);
      }

      if (!entityBundles && searchRequest.entityType === 'taxonomy_term') {
        entityBundles = (await assetLink.getTaxonomyVocabularies()).map(t => t.attributes.drupal_internal__vid);
      }

      if (!entityBundles || !entityBundles.length) {
        return;
      }

      const entitySource = searchPhase === 'local' ? assetLink.entitySource.cache : assetLink.entitySource;

      const searchOpts = {
        forceRemote: searchPhase === 'remote',
      };

      const results = await entitySource.query(q => entityBundles.flatMap(entityBundle => {
        const typeName = `${searchRequest.entityType}--${entityBundle}`;

        const model = assetLink.getEntityModelSync(typeName);

        const sortingKey = Object.keys(model.attributes).find(k => /^drupal_internal__.?id$/.test(k)) || 'id';

        if (!model?.attributes?.name) {
          return [];
        }

        let baseQuery = q
          .findRecords(typeName)

        if (term) {
          baseQuery = baseQuery.filter({ attribute: 'name', op: 'CONTAINS', value: term });
        }

        return [additionalFilters
          .reduce((query, f) => query.filter(f), baseQuery)
          .sort(sortingKey)];
      }), searchOpts);

      const entities = results.flatMap(l => l);

      for (let entity of entities) {
        yield {
          weight: 1,
          weightText: `Name contains term "${term}"`,
          entity,
        };
      }
    }

    return iteratePaginatedResults();
  }
}
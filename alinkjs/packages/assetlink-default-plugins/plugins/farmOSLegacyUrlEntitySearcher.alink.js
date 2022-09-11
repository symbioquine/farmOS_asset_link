/**
 * Support legacy farmOS URL searching.
 */
export default class farmOSLegacyUrlEntitySearcher {

  static searchEntities(assetLink, searchRequest, searchPhase) {
    if (searchRequest.entityType !== 'asset' || searchRequest.type !== 'text-search') {
      return undefined;
    }

    const term = searchRequest.term;

    if (!term) {
      return undefined;
    }

    // https://example.farm/farm/area/L18
    const matches = term.match(/https?:\/\/.*\/farm\/([^\/]+)\/([^\/\?]+)/);

    if (!matches || matches.length < 3) {
      return undefined;
    }

    const additionalFilters = searchRequest.additionalFilters || [];

    const legacyType = decodeURIComponent(matches[1]);

    let entityBundles = undefined;

    // --------- Asset Types ---------

    // https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_area/farm_area.strongarm.inc#L17
    if (legacyType === 'area') {
      entityBundles = ['land'];
    }
    // https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_livestock/farm_livestock.strongarm.inc#L17
    if (legacyType === 'animal') {
      entityBundles = ['animal'];
    }
    // https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_crop/farm_crop.strongarm.inc#L17
    if (legacyType === 'planting') {
      entityBundles = ['plant'];
    }
    // https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_equipment/farm_equipment.strongarm.inc#L17
    if (legacyType === 'equipment') {
      entityBundles = ['equipment'];
    }

    // --------- Taxonomy Term Types ---------

    // TODO: Implement taxonomy term types by opening up the `searchRequest.entityType` check above and implementing some of these:

    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_livestock/farm_livestock.strongarm.inc#L24
    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_crop/farm_crop.strongarm.inc#L24
    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_crop/farm_crop.strongarm.inc#L31
    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_season/farm_season.strongarm.inc#L17
    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_fields/farm_fields.strongarm.inc#L17
    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_soil/farm_soil.strongarm.inc#L17
    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_quantity/farm_quantity.strongarm.inc#L17
    // TODO: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_log/farm_log_input/farm_log_input.strongarm.inc#L17
    // TODO?: https://github.com/farmOS/farmOS/blob/509cfb2e928ef7537977a0f53eb93ee12a01e45d/modules/farm/farm_sensor/farm_sensor.strongarm.inc#L17

    const delegateTerm = decodeURIComponent(matches[2]);

    // TODO: Consider un-munging some of the things Drupal 7 pathauto did to URLS
    // https://git.drupalcode.org/project/pathauto/-/blob/88db3ee74ddf62eab54e12347955dd2f6dd66737/pathauto.admin.inc#L94-204

    const delegateSearchReq = {
        entityType: searchRequest.entityType,
        entityBundles,
        type: searchRequest.type,
        term: delegateTerm,
        additionalFilters,
    };

    return assetLink.searchEntities(
      delegateSearchReq,
      searchPhase
    );
  }
}

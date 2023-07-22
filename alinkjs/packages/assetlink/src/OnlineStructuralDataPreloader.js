/**
 * Operates on the assumption that we can load the structural data
 * from the farmOS server - at least the first time Asset Link
 * boots.
 * 
 * @implements {IStructuralDataPreloader}
 */
export default class OnlineStructuralDataPreloader {
  async load(assetLink) {
    // Make sure we have some of the core data model structure
    // data as part of booting so we don't end up offline without
    // it since plugins will tend to assume this information is
    // available.
    await this._precacheKeyStructuralData(assetLink);
  }

  async _precacheKeyStructuralData(assetLink) {
    await assetLink.getAssetTypes();
    await assetLink.getLogTypes();
    await assetLink.getTaxonomyVocabularies();
  }
}

/**
 * Interface for a class that ensures structural data - log/entity
 * types and taxonomy vocabularies - are available before plugins
 * might need them.
 * 
 * Called as part of Asset Link booting after the farmData core is
 * booted, but before any plugins are loaded.
 * 
 * @interface
 */
export default class IStructuralDataPreloader {
  async load(assetLink) {
    
  }
}

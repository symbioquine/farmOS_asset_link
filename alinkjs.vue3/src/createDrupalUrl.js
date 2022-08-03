export default function createDrupalUrl(pathSuffix) {
  if (window.assetLinkDrupalBasePath === undefined) {
    throw new Error("'window.assetLinkDrupalBasePath' not set. Asset Link not properly initialized.");
  }
  return new URL(pathSuffix, window.location.origin + window.assetLinkDrupalBasePath);
}
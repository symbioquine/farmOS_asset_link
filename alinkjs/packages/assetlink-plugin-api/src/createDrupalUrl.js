export default function createDrupalUrl(pathSuffix) {
  return new URL(
    pathSuffix,
    window.location.origin + window.assetLinkDrupalBasePath
  );
}

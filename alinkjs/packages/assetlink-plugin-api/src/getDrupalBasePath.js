/**
 * Returns the base path of the farmOS Drupal site in which Asset Link is installed.
 * Always starts and ends with a '/'.
 *
 *  * ### Usage
 *
 * ```js
 * import { getDrupalBasePath } from "assetlink-plugin-api";
 *
 * getDrupalBasePath() // might return "/" or "/site-a/"
 * ```
 *
 * @return {string} the base path of the farmOS Drupal site
 */
export default function getDrupalBasePath() {
  let basePath = window.assetLinkDrupalBasePath || "";
  if (!basePath.startsWith("/")) {
    basePath = "/" + basePath;
  }
  if (!basePath.endsWith("/")) {
    basePath += "/";
  }
  return basePath;
}

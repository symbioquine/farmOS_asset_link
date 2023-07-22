/**
 * Creates a url relative to Asset Link.
 *
 *  * ### Usage
 *
 * ```js
 * import { createAlinkUrl } from "assetlink-plugin-api";
 *
 * createAlinkUrl('/manage-plugins') // might return `URL { href: "https://myfarm.example.com/drupal-site-a/alink/manage-plugins" ... }`
 * ```
 *
 * @param {String} pathSuffix The path suffix of the URL to be created
 * @return {external:URL} the fully qualified URL instance.
 */

export default function createDrupalUrl(pathSuffix) {
  let relativePath = pathSuffix;
  if (typeof relativePath === "string" && relativePath.startsWith("/")) {
    relativePath = relativePath.substring(1);
  }

  // Relative to Asset Link's public path build option - which
  // in some scenarios gets replaced at runtime by Drupal
  // when it serves the built app.
  const basePath = process.env.BASE_URL;
  return new URL(relativePath, window.location.origin + basePath);
}

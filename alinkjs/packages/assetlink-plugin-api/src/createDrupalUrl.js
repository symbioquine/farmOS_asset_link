/**
 * Creates a url relative to the base url of the Drupal site in which Asset Link is installed.
 *
 *  * ### Usage
 *
 * ```js
 * import { createDrupalUrl } from "assetlink-plugin-api";
 *
 * createDrupalUrl('/api') // might return `URL { href: "https://myfarm.example.com/drupal-site-a/api" ... }`
 * ```
 *
 * @param {String} pathSuffix The path suffix of the URL to be created
 * @return {external:URL} the fully qualified URL instance.
 */
import getDrupalBasePath from "./getDrupalBasePath";

export default function createDrupalUrl(pathSuffix) {
  let relativePath = pathSuffix;
  if (typeof relativePath === "string" && relativePath.startsWith("/")) {
    relativePath = relativePath.substring(1);
  }

  const basePath = getDrupalBasePath();
  return new URL(relativePath, window.location.origin + basePath);
}

/**
 * The built-in class describing a URL.
 * @external URL
 * @see https://developer.mozilla.org/en-US/docs/Web/API/URL
 */

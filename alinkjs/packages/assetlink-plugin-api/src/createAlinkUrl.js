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
  let basePath = process.env.BASE_URL || "/alink/";

  // For the Sidecar portion of the app, the public path is suffixed
  // with "/sidecar/" which shouldn't be part of the resulting
  // `{base}/alink/{suffix}` urls.
  const SIDECAR_SUFFIX = "/sidecar/";
  if (basePath.endsWith(SIDECAR_SUFFIX)) {
    // Remove the suffix but not the trailing "/"
    basePath = basePath.substring(
      0,
      basePath.length - (SIDECAR_SUFFIX.length - 1)
    );
  }

  return new URL(relativePath, window.location.origin + basePath);
}

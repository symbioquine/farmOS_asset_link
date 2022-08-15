/**
 * Roughly implements the same convention encoded in
 * [farm_log.module#L74-L88]{@link https://github.com/farmOS/farmOS/blob/04bf771d91cde8276b67090d2b97c4e4558332b9/modules/core/log/farm_log.module#L74-L88}
 *
 *  * ### Usage
 *
 * ```js
 * import { summarizeAssetNames } from "assetlink-plugin-api";
 *
 * summarizeAssetNames([
 *   { attributes: { name: "A" ... }, ... },
 *   { attributes: { name: "B" ... }, ... },
 *   { attributes: { name: "C" ... }, ... },
 * ]) // Returns "A, B, C"
 *
 * summarizeAssetNames([
 *   { attributes: { name: "A" ... }, ... },
 *   { attributes: { name: "B" ... }, ... },
 *   { attributes: { name: "C" ... }, ... },
 *   { attributes: { name: "D" ... }, ... },
 *   { attributes: { name: "E" ... }, ... },
 * ]) // Returns "A (+4 more)"
 * ```
 *
 * @param {Asset[]} assets The array of assets to be summarized
 * @return {String} the asset names summary string
 */
export default function summarizeAssetNames(assets) {
  if (assets.length <= 3) {
    return assets.map((a) => a.attributes.name).join(", ");
  }
  return `${assets[0].attributes.name} (+${assets.length - 1} more)`;
}

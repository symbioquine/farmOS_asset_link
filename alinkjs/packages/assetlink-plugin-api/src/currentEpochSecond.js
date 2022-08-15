/**
 * Returns the current epoch second as an integer number.
 *
 *  * ### Usage
 *
 * ```js
 * import { currentEpochSecond } from "assetlink-plugin-api";
 *
 * currentEpochSecond() // might return 1660580261
 * ```
 *
 * @return {Number} the current epoch second
 */
export default function currentEpochSecond() {
  return parseInt(new Date().getTime() / 1000);
}

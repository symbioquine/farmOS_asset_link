/**
 * Roughly implements the same convention encoded in
 * https://github.com/farmOS/farmOS/blob/04bf771d91cde8276b67090d2b97c4e4558332b9/modules/core/log/farm_log.module#L74-L88
 */
export default function summarizeAssetNames(assets) {
  if (assets.length <= 3) {
    return assets.map(a => a.attributes.name).join(", ");
  }
  return `${assets[0].attributes.name} (+${assets.length - 1} more)`;
}

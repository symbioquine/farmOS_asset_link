/**
 * @alias module:something-nifty/lib/plugins/Plugin
 */
export { default as createDrupalUrl } from "./createDrupalUrl";
export { default as currentEpochSecond } from "./currentEpochSecond";
export { default as summarizeAssetNames } from "./summarizeAssetNames";
export { default as RacingLocalRemoteAsyncIterator } from "./RacingLocalRemoteAsyncIterator";

import AssetResolver from "./components/AssetResolver.vue";
import AssetSelector from "./components/AssetSelector.vue";
import QrCodeScanner from "./components/QrCodeScanner.vue";
import RenderWidget from "./components/RenderWidget";
import SearchMethodTileTabber from "./components/SearchMethodTileTabber";
import SearchMethod from "./components/SearchMethod.vue";

const components = {
  AssetResolver,
  AssetSelector,
  QrCodeScanner,
  RenderWidget,
  SearchMethod,
  SearchMethodTileTabber,
};
/**
 * @export components
 * @desc
 * * [AssetResolver](./module-AssetResolver.html)
 * * [AssetSelector](./module-AssetSelector.html)
 * * [QrCodeScanner](./module-QrCodeScanner.html)
 * * [RenderWidget](./module-RenderWidget.html)
 * * [SearchMethod](./module-SearchMethod.html)
 * * [SearchMethodTileTabber](./module-SearchMethodTileTabber.html)
 */
export { components };

export { formatRFC3339, parseJSON as parseJSONDate } from "date-fns";
export { v4 as uuidv4 } from "uuid";

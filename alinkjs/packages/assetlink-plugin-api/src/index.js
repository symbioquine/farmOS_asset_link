import { defineAsyncComponent } from "vue";

/**
 * @alias module:something-nifty/lib/plugins/Plugin
 */
export { default as createDrupalUrl } from "./createDrupalUrl";
export { default as currentEpochSecond } from "./currentEpochSecond";
export { default as summarizeAssetNames } from "./summarizeAssetNames";
export { default as RacingLocalRemoteAsyncIterator } from "./RacingLocalRemoteAsyncIterator";
export { default as EventBus } from "./EventBus";

// Code mirror is pretty big so we'll make it an async component with its own chunk
const CodeEditor = defineAsyncComponent(() =>
  import("./components/CodeEditor.vue")
);
import EntityName from "./components/EntityName.vue";
import EntityResolver from "./components/EntityResolver.vue";
import EntitySearch from "./components/EntitySearch.vue";
import EntitySelect from "./components/EntitySelect.vue";
import PhotoInput from "./components/PhotoInput.vue";
import QrCodeScanner from "./components/QrCodeScanner.vue";
import RenderWidget from "./components/RenderWidget";
import SearchMethodTileTabber from "./components/SearchMethodTileTabber";
import SearchMethod from "./components/SearchMethod.vue";

const components = {
  CodeEditor,
  EntityResolver,
  EntitySearch,
  EntitySelect,
  EntityName,
  PhotoInput,
  QrCodeScanner,
  RenderWidget,
  SearchMethod,
  SearchMethodTileTabber,
};
/**
 * @export components
 * @desc
 * * [CodeEditor](./module-CodeEditor.html)
 * * [EntityName](./module-EntityName.html)
 * * [EntityResolver](./module-EntityResolver.html)
 * * [EntitySearch](./module-EntitySearch.html)
 * * [EntitySelect](./module-EntitySelect.html)
 * * [PhotoInput](./module-PhotoInput.html)
 * * [QrCodeScanner](./module-QrCodeScanner.html)
 * * [RenderWidget](./module-RenderWidget.html)
 * * [SearchMethod](./module-SearchMethod.html)
 * * [SearchMethodTileTabber](./module-SearchMethodTileTabber.html)
 */
export { components };

export { formatRFC3339, parseJSON as parseJSONDate } from "date-fns";
export { v4 as uuidv4 } from "uuid";

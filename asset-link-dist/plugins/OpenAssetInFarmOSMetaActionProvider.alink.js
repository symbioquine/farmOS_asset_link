import { h } from 'vue';
import { QItem, QItemSection } from 'quasar';

import { createDrupalUrl } from "assetlink-plugin-api";

export default class OpenAssetInFarmOSMetaActionProvider {
  static onLoad(handle, assetLink) {

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.open_asset_in_farm_os', slot => {
      slot.type('asset-meta-action');

      const getTargetUrl = (asset) => createDrupalUrl(`/asset/${asset.attributes.drupal_internal__id}`).toString();

      slot.component(({ asset }) =>
        h(QItem, { href: getTargetUrl(asset) }, () => [
            h(QItemSection, {}, () => "Open in farmOS"),
        ])
      );
    });

  }
}

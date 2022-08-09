import { h } from 'vue';
import { QFabAction } from 'quasar';

import { createDrupalUrl } from "assetlink-plugin-api";

export default class OpenInFarmOSMetaActionProvider {
  static onLoad(handle, assetLink) {

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.open_in_asset_link', slot => {
      slot.type('sidecar-menu-slot');

      const openInAssetLink = (asset) => {
        window.location = createDrupalUrl(`/alink/asset/${asset.attributes.drupal_internal__id}`).toString();
      };

      slot.component(({ asset }) =>
        h(QFabAction, { onClick: () => openInAssetLink(asset), color: 'grey-8', icon: 'launch' })
      );
    });

  }
}

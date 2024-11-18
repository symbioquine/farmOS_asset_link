import { h } from 'vue';
import { QFabAction } from 'quasar';

import { createDrupalUrl } from "assetlink-plugin-api";

export default class OpenInFarmOSMetaActionProvider {
  static onLoad(handle, assetLink) {

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.open_in_asset_link', slot => {
      slot.type('sidebar-menu-slot');

      const getOpenableEntityPathSuffix = () => {
        const matches = window.location.href.match(/https?:\/\/.*\/((asset|log)\/\d+)/);

        if (!matches || matches.length < 2) {
          return undefined;
        }

        const entityPathSuffix = matches[1];

        return entityPathSuffix;
      };

      slot.showIf(() => getOpenableEntityPathSuffix());

      const openInAssetLink = (asset) => {
        window.location = createDrupalUrl(`/alink/${getOpenableEntityPathSuffix()}`).toString();
      };

      slot.component(() =>
        h(QFabAction, { onClick: () => openInAssetLink(), color: 'grey-8', icon: 'mdi-launch' })
      );
    });

  }
}

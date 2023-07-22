import { h } from 'vue';
import { QItem, QItemSection } from 'quasar';

import { createDrupalUrl } from "assetlink-plugin-api";

export default class OpenInFarmOSMetaActionProvider {
  static onLoad(handle, assetLink) {

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.open_log_in_farm_os', slot => {
      slot.type('log-meta-action');

      slot.showIf(({ log }) => assetLink.connectionStatus.canReachFarmOS.value && log.attributes?.drupal_internal__id);

      const getTargetUrl = (log) => createDrupalUrl(`/log/${log.attributes.drupal_internal__id}`).toString();

      slot.component(({ log }) =>
        h(QItem, { href: getTargetUrl(log) }, () => [
            h(QItemSection, {}, () => "Open in farmOS"),
        ])
      );
    });

  }
}

import { h } from 'vue';
import { QItem, QItemSection } from 'quasar';

export default class OpenInFarmOSMetaActionProvider {
  onLoad(handle, assetLink) {

    const createDrupalUrl = assetLink.util.createDrupalUrl;

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.open_in_farm_os', openInFarmOS => {
      openInFarmOS.type('asset-meta-action');

      openInFarmOS.showIf(() => true);

      const getTargetUrl = (asset) => createDrupalUrl(`/asset/${asset.attributes.drupal_internal__id}`).toString();

      openInFarmOS.component(({ asset }) =>
        h(QItem, { href: getTargetUrl(asset) }, [
            h(QItemSection, {}, "Open in farmOS"),
        ])
      );
    });

  }
}

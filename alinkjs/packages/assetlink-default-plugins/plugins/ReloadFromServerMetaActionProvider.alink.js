import { h } from 'vue';
import { QItem, QItemSection } from 'quasar';

export default class ReloadFromServerMetaActionProvider {
  static onLoad(handle, assetLink) {

    const doReloadFromServer = async (entityType, type, id) => {

      const model = await assetLink.getEntityModel(type);

      const include = Object.keys(model.relationships);

      await assetLink.entitySource.query(q => q
          .findRecord({ type, id })
          .options({ include }),
        { forceRemote: true });

      const eventArgs = { [`${entityType}Type`]: type, [`${entityType}Id`]: id };
      assetLink.eventBus.$emit(`changed:${entityType}`, eventArgs);
      if (entityType === 'asset') {
        assetLink.eventBus.$emit(`changed:${entityType}Logs`, eventArgs);
      }
    };

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.reload_asset_from_server', slot => {
      slot.type('asset-meta-action');

      slot.component(({ asset }) =>
        h(QItem, { clickable: true, onClick: () => doReloadFromServer('asset', asset.type, asset.id) }, () => [
            h(QItemSection, {}, () => "Reload from Server"),
        ])
      );
    });

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.reload_log_from_server', slot => {
      slot.type('log-meta-action');

      slot.component(({ log }) =>
        h(QItem, { clickable: true, onClick: () => doReloadFromServer('log', log.type, log.id) }, () => [
          h(QItemSection, {}, () => "Reload from Server"),
        ])
      );
    });

  }
}

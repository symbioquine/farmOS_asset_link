export default class OpenInFarmOSMetaActionProvider {
  onLoad(handle, assetLink) {

    const createDrupalUrl = assetLink.util.createDrupalUrl;

    const VListItem = assetLink.ui.c.VListItem;
    const VListItemTitle = assetLink.ui.c.VListItemTitle;

    handle.defineMetaAction('net.symbioquine.farmos_asset_link.actions.v0.open_in_farm_os', openInFarmOS => {
      openInFarmOS.showIf(asset => true);

      const getTargetUrl = (asset) => createDrupalUrl(`/asset/${asset.attributes.drupal_internal__id}`).toString();

      openInFarmOS.componentFn((wrapper, h, asset) =>
        h(VListItem, { props: { href: getTargetUrl(asset) } }, [
            h(VListItemTitle, {}, "Open in farmOS"),
        ])
      );
    });

  }
}

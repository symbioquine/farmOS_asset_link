export default class ArchiveAssetActionProvider {
  onLoad(handle, assetLink) {

    const VBtn = assetLink.ui.c.VBtn;
    const formatRFC3339 = assetLink.util.formatRFC3339;

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.archive', archiveAction => {
      archiveAction.type('asset-action');

      archiveAction.showIf(({ asset }) => asset.attributes.status !== 'archived');

      const doActionWorkflow = async (asset) => {
        const confirmed = await assetLink.ui.dialog.confirm(`Are you sure you want to archive "${asset.attributes.name}"?`);

        if (!confirmed) {
          return undefined;
        }

        const res = await assetLink.entitySource.update((t) => {
          return t.updateRecord({
            type: asset.type,
            id: asset.id,
            attributes: {
              status: 'archived',
              archived: formatRFC3339(new Date()),
            },
          });
        }, {label: `Archive asset: ${asset.attributes.name}`});

      };

      archiveAction.componentFn((wrapper, h, { asset }) =>
        h(VBtn, { props: { block: true, color: 'secondary' }, on: { click: () => doActionWorkflow(asset) }, 'class': 'text-none' },  "Archive" ));

    });

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.unarchive', unarchiveAction => {
      unarchiveAction.type('asset-action');

      unarchiveAction.showIf(({ asset }) => asset.attributes.status === 'archived');

      const doActionWorkflow = async (asset) => {
        const confirmed = await assetLink.ui.dialog.confirm(`Are you sure you want to unarchive "${asset.attributes.name}"?`);

        if (!confirmed) {
          return undefined;
        }

        const res = await assetLink.entitySource.update((t) => {
          return t.updateRecord({
            type: asset.type,
            id: asset.id,
            attributes: {
              status: 'active',
              archived: null,
            },
          });
        }, {label: `Unarchive asset: ${asset.attributes.name}`});

      };

      unarchiveAction.componentFn((wrapper, h, { asset }) =>
        h(VBtn, { props: { block: true, color: 'secondary' }, on: { click: () => doActionWorkflow(asset) }, 'class': 'text-none' },  "Unarchive" ));

    });

  }
}

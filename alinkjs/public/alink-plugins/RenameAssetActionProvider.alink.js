export default class RenameAssetActionProvider {
  onLoad(handle, assetLink) {

    const VBtn = assetLink.ui.c.VBtn;

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.rename', renameAction => {
      renameAction.type('asset-action');

      renameAction.showIf(({ asset }) => asset.attributes.status !== 'archived');

      const doActionWorkflow = async (asset) => {
        const newName = await assetLink.ui.dialog.promptText(`What should "${asset.attributes.name}" be renamed to?`);

        if (!newName) {
          return;
        }

        const model = await assetLink.getEntityModel(asset.type);
        console.log(model);

        let updatedAttributes = {
          name: newName,
        };

        if ((typeof model.attributes.nickname) !== 'undefined') {
          const existingNicknames = asset.attributes.nickname || [];

          updatedAttributes.nickname = [asset.attributes.name, ...existingNicknames];
        }

        const res = await assetLink.entitySource.update((t) => {
          return t.updateRecord({
            type: asset.type,
            id: asset.id,
            attributes: updatedAttributes,
          });
        }, {label: `Rename asset: "${asset.attributes.name}" to "${newName}"`});

      };

      renameAction.componentFn((wrapper, h, { asset }) =>
        h(VBtn, { block: true, color: 'secondary', on: { click: () => doActionWorkflow(asset) }, 'class': 'text-none' },  "Rename" ));

    });

  }
}

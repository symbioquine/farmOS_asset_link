<template>
  <asset-selector
    title="Find Destination"
    confirm-label="Move to selected location(s)"
    @submit="onDestinationSelected($event)"
  ></asset-selector>
</template>

<script>
import { QBtn } from 'quasar';

export default {
  name: 'MoveAssetDialog',

  inject: ['dialogContext'],

  methods: {
    onDestinationSelected(selectedAssets) {
      console.log("onAssetSelected", selectedAssets);
      this.dialogContext.$emit('submit', selectedAssets);
    },
  },

  onLoad(handle, assetLink) {

    const summarizeAssetNames = assetLink.util.summarizeAssetNames;
    const formatRFC3339 = assetLink.util.formatRFC3339;

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.move', moveAction => {
      moveAction.type('asset-action');

      moveAction.showIf(({ asset }) => asset.attributes.status !== 'archived');

      const doActionWorkflow = async (asset) => {
        const destinations = await assetLink.ui.dialog.custom('MoveAssetDialog', []);

        console.log(destinations);


        const movementLog = {
          type: 'log--activity',
          attributes: {
            name: `Move ${asset.attributes.name} to ${summarizeAssetNames(destinations)}`,
            timestamp: formatRFC3339(new Date()),
            status: "done",
            is_movement: true,
          },
          relationships: {
            asset: {
              data: [
                {
                  type: asset.type,
                  id: asset.id,
                }
              ]
            },
            location: {
              data: destinations.map(dest => ({
                type: dest.type,
                id: dest.id,
              })),
            },
          },
        };

        assetLink.entitySource.update(
            (t) => t.addRecord(movementLog),
            {label: movementLog.attributes.name});
      };

      moveAction.componentFn((wrapper, h, { asset }) =>
        h(QBtn, { block: true, color: 'secondary', onClick: () => doActionWorkflow(asset), 'class': 'text-none' },  "Move" ));

    });

  }
}
</script>

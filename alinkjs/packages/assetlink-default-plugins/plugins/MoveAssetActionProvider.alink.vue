<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin q-gutter-md">
      <asset-selector
        title="Find Destination"
        confirm-label="Move to selected location(s)"
        @submit="onDestinationSelected($event)"
      ></asset-selector>
    </q-card>
  </q-dialog>
</template>

<script>
import { h } from 'vue';
import { QBtn } from 'quasar';

import { formatRFC3339, summarizeAssetNames } from "assetlink-plugin-api";

export default {
  inject: ['dialogContext'],

  methods: {
    onDestinationSelected(selectedAssets) {
      console.log("onAssetSelected", selectedAssets);
      this.dialogContext.$emit('submit', selectedAssets);
    },
  },

  onLoad(handle, assetLink) {

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.move', moveAction => {
      moveAction.type('asset-action');

      moveAction.showIf(({ asset }) => asset.attributes.status !== 'archived');

      const doActionWorkflow = async (asset) => {
        const destinations = await assetLink.ui.dialog.custom(handle.thisPlugin, []);

        console.log(destinations);

        if (!destinations || !destinations.length) {
          return;
        }

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

      moveAction.component(({ asset }) =>
        h(QBtn, { block: true, color: 'secondary', onClick: () => doActionWorkflow(asset), 'class': 'text-none' },  "Move" ));
    });

  }
}
</script>

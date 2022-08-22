<script setup>
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const onSubmit = (selectedAssets) => {
  console.log("onAssetSelected", selectedAssets);

  if (!selectedAssets || selectedAssets.length === 0) {
    onDialogCancel();
    return;
  }

  onDialogOK(selectedAssets);
};

const searchMethod = ref('text-search');
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin q-gutter-md" style="width: 700px; max-width: 80vw;">
      <asset-selector
        title="Find Destination"
        confirm-label="Move to selected location(s)"
        :search-method="searchMethod"
        :key="searchMethod"
        @changed:search-method="newSearchMethod => searchMethod = newSearchMethod"
        @submit="onSubmit"
        :additional-filters="[{ attribute: 'is_location', op: 'equal', value: true }]"
      ></asset-selector>
    </q-card>
  </q-dialog>
</template>

<script>
import { h } from 'vue';
import { QBtn } from 'quasar';

import { formatRFC3339, summarizeAssetNames } from "assetlink-plugin-api";

export default {
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
        h(QBtn, { block: true, color: 'secondary', onClick: () => doActionWorkflow(asset), 'no-caps': true },  () => "Move" ));
    });

  }
}
</script>

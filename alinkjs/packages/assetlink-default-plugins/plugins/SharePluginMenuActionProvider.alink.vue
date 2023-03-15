<script setup>
import { inject, ref } from 'vue';
import { useDialogPluginComponent, date } from 'quasar';
import { formatRFC3339 } from 'assetlink-plugin-api';

const props = defineProps({
  pluginNode: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const pluginUrl = props.pluginNode.pluginUrl;

let pluginFilename = pluginUrl.pathname.split('/').pop();
if (pluginFilename.startsWith('~')) {
  pluginFilename = pluginFilename.substring(1);
}

let pluginMimeType = 'application/octect-stream';
if (pluginUrl.pathname.endsWith('alink.js')) {
  pluginMimeType = "text/javascript";
} else if (pluginUrl.pathname.endsWith('alink.vue')) {
  pluginMimeType = "text/x-vue";
} else if (pluginUrl.pathname.endsWith('.json')) {
  pluginMimeType = "application/json";
}
</script>

<template>
  <q-dialog ref="dialogRef">
    <q-card class="q-dialog-plugin q-gutter-md" style="width: 500px; max-width: 80vw;">
      <q-card-section class="text-h6 q-mt-sm q-mb-none q-pb-none">Share Plugin:</q-card-section>
      <q-card-section class="text-subtitle3 q-ml-lg q-my-sm">{{ pluginFilename }}</q-card-section>

      <q-card-section>
        <component
            v-for="slotDef in assetLink.getSlots({ type: 'share-plugin-icon-button', pluginNode: props.pluginNode, pluginFilename, pluginMimeType })"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"
            class="q-ma-sm"></component>
        </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script>
import { h } from 'vue';
import { copyToClipboard, exportFile, QBtn, QItem, QItemSection } from 'quasar';
import { uuidv4 } from 'assetlink-plugin-api';


export default {
  async onLoad(handle, assetLink) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.manage_plugin_menu_action.v0.share_plugin', action => {
      action.type('manage-plugin-menu-action');

      action.component(({ pluginNode }) =>
        h(QItem, { clickable: true },  () => [
            h(QItemSection, { onClick: () => assetLink.ui.dialog.custom(handle.thisPlugin, { pluginNode }) }, () => 'share'),
        ]));
    });

    handle.defineSlot('net.symbioquine.farmos_asset_link.share_plugin_icon_btn.v0.download_file', action => {
      action.type('share-plugin-icon-button');

      const getPluginAsFileDownload = (pluginNode, pluginFilename, pluginMimeType) => {
        const plugin = pluginNode.getPlugin();

        if (!plugin.rawSource) {
          assetLink.vm.messages.push({
            id: uuidv4(),
            message: "Plugin or plugin source not found for plugin: " + pluginUrl,
          });
          return;
        }

        const status = exportFile(pluginFilename, plugin.rawSource, {
          mimeType: pluginMimeType,
        });

        if (status !== true) {
          // browser denied it
          console.log('Error: ' + status)
          assetLink.vm.messages.push({
            id: uuidv4(),
            message: "Failed downloading plugin as file due to browser error: " + status,
          });
          return;
        }
      };

      action.component(({ pluginNode, pluginFilename, pluginMimeType }) =>
        h(QBtn, { block: true, outline: true, stack: true, icon: 'mdi-file-download-outline',
            onClick: () => getPluginAsFileDownload(pluginNode, pluginFilename, pluginMimeType), 'no-caps': true },  () => "Download" ));
    });

    handle.defineSlot('net.symbioquine.farmos_asset_link.share_plugin_icon_btn.v0.copy_code', action => {
      action.type('share-plugin-icon-button');

      action.weight(150);

      const getPluginAsPasteableCode = async (pluginNode) => {
        const plugin = pluginNode.getPlugin();

        if (!plugin.rawSource) {
          assetLink.vm.messages.push({
            id: uuidv4(),
            message: "Plugin or plugin source not found for plugin: " + pluginUrl,
          });
          return;
        }

        try {
          const status = await copyToClipboard(plugin.rawSource);
        } catch (err) {
          console.log('Error: ' + err)
          assetLink.vm.messages.push({
            id: uuidv4(),
            message: "Failed copying plugin code to clipboard: " + err,
          });
        }
      };

      action.component(({ pluginNode, pluginFilename, pluginMimeType }) =>
        h(QBtn, { block: true, outline: true, stack: true, icon: 'mdi-content-copy',
            onClick: () => getPluginAsPasteableCode(pluginNode), 'no-caps': true },  () => "Copy Code" ));
    });
  }
}
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.manage_plugins]="/manage-plugins">
  <q-page padding class="manage-plugins">

    <q-tree
      :nodes="pluginListsTree"
      node-key="label"
      default-expand-all
      dense
    >
      <template v-slot:default-header="prop">
        <div class="row items-center" style="width: 100%">
          <div class="col-auto ellipsis">
            <q-icon :name="prop.node.icon || 'mdi-share'" size="sm" class="q-mr-xs vertical-middle" />
          </div>
          <div class="col ellipsis" style="direction: rtl; text-align: left;">
            <span class="text-grey-10 inline vertical-middle" :class="{ 'text-strike': prop.node.isBlacklisted }">{{ prop.node.label }}</span>
          </div>
          <div class="self-end">
            <q-btn flat padding="xs" size="xs" icon="mdi-dots-vertical" class="q-ml-sm" @click.stop>
              <q-menu>
                <q-list style="min-width: 100px">
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin-list' && !prop.node.isLocal">
                    <q-item-section @click="reloadPluginListByUrl(prop.node.sourceUrl)">reload</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin-list' && !prop.node.isDefault && !prop.node.isLocal">
                    <q-item-section @click="removePluginListByUrl(prop.node.sourceUrl)">remove</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin'">
                    <q-item-section @click="reloadPluginByUrl(prop.node.pluginUrl)">reload</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin'">
                    <q-item-section @click="removePluginByUrl(prop.node.pluginUrl)">remove</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin' && !prop.node.isBlacklisted">
                    <q-item-section @click="disablePluginByUrl(prop.node.pluginUrl)">disable</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin' && prop.node.isBlacklisted">
                    <q-item-section @click="enablePluginByUrl(prop.node.pluginUrl)">enable</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </template>

      <template v-slot:default-body="prop">
        <div v-if="prop.node.nodeType === 'plugin-list' && !prop.node.children.length" class="text-italic q-ml-lg">This plugin list is empty</div>
        <div v-if="prop.node.error" class="q-ml-lg">
          <span v-if="prop.node.nodeType === 'plugin-list' && prop.node.cachedTimestamp" class="q-mr-xs">Using stale cached list:</span>
          <span class="text-italic text-red-12">{{ prop.node.error }}</span>
        </div>
      </template>
    </q-tree>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-fab v-model="showAddPluginButtons" color="green" icon="mdi-puzzle-plus" active-icon="mdi-close" hide-label direction="up">
        <q-fab-action
            color="green"
            icon="mdi-link-variant-plus"
            aria-hidden="false"
            aria-label="Add a new plugin by URL"
            @click="addPluginFromUrl()"
        ></q-fab-action>
        <q-fab-action
            color="green"
            icon="mdi-playlist-plus"
            aria-hidden="false"
            aria-label="Add a new plugin list repository by URL"
            @click="addPluginListFromUrl()"
        ></q-fab-action>
        <q-fab-action
            color="green"
            icon="mdi-puzzle-edit"
            aria-hidden="false"
            aria-label="Write a new plugin"
            @click="editPluginDialogShown = true"
        ></q-fab-action>
      </q-fab>
    </q-page-sticky>

    <q-dialog v-model="editPluginDialogShown" :transition="false">
      <q-card>
        <q-card-section>
          <div class="text-h6 text-grey">Edit Plugin</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <codemirror v-if="editPluginDialogShown" v-model="code" :options="cmOptions" ref="editor" @ready="onEditorReady()"></codemirror>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum repellendus sit voluptate voluptas eveniet porro. Rerum blanditiis perferendis totam, ea at omnis vel numquam exercitationem aut, natus minima, porro labore.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import { h } from 'vue';
import { QItem, QItemSection } from 'quasar';

import { createDrupalUrl } from "assetlink-plugin-api";

export default {
  inject: ['assetLink'],

  data() {
    return {
      showAddPluginButtons: false,
      editPluginDialogShown: false,
      code: "<template>\n<div>Hello world!</div>\n</template>\n",
      cmOptions: {
        tabSize: 4,
        mode: 'text/x-vue',
        theme: 'base16-dark',
        lineNumbers: true,
        line: true,
      },
    };
  },

  methods: {
    async addPluginFromUrl() {
      // TODO: Add a warning about only adding trusted code
      const url = await this.assetLink.ui.dialog.promptText(`What is the url of the plugin to be added?`);

      if (!url) {
        return;
      }

      await this.assetLink.cores.pluginLists.addPluginToLocalList(new URL(url));
    },
    async reloadPluginByUrl(pluginUrl) {
      await this.assetLink.cores.pluginLoader.reloadPlugin(pluginUrl);
    },
    async removePluginByUrl(pluginUrl) {
      const confirmed = await this.assetLink.ui.dialog.confirm(`Are you sure you want to remove the plugin "${pluginUrl}"?`);

      if (!confirmed) {
        return;
      }

      await this.assetLink.cores.pluginLists.removePluginFromLocalList(pluginUrl);
    },
    async disablePluginByUrl(pluginUrl) {
      await this.assetLink.cores.pluginLists.addPluginToLocalBlacklist(pluginUrl);
    },
    async enablePluginByUrl(pluginUrl) {
      await this.assetLink.cores.pluginLists.removePluginFromLocalBlacklist(pluginUrl);
    },
    async addPluginListFromUrl() {
      // TODO: Add a warning about only adding trusted code
      const url = await this.assetLink.ui.dialog.promptText(`What is the url of the plugin list to be added?`);

      if (!url) {
        return;
      }

      await this.assetLink.cores.pluginLists.addExtraPluginList(new URL(url));
    },
    async reloadPluginListByUrl(sourcePluginListUrl) {
      await this.assetLink.cores.pluginLists.reloadPluginList(sourcePluginListUrl);
    },
    async removePluginListByUrl(sourcePluginListUrl) {
      const confirmed = await this.assetLink.ui.dialog.confirm(`Are you sure you want to remove the plugin list "${sourcePluginListUrl}"?`);

      if (!confirmed) {
        return;
      }

      await this.assetLink.cores.pluginLists.removeExtraPluginList(sourcePluginListUrl);
    },
    getPluginError(pluginRef) {
      let errors = this.assetLink.plugins
        .flatMap(otherPlugin => otherPlugin.attributedErrors[pluginRef.url] || []);

      const plugin = this.pluginsByUrl[pluginRef.url];
      if (plugin && plugin.error) {
        errors.unshift(plugin.error);
      }

      return errors.join('\n');
    }
  },

  computed: {
    pluginsByUrl() {
      if (!this.assetLink.vm.booted) {
        return {};
      }

      const pluginsByUrl = {};
      this.assetLink.plugins.forEach(plugin => {
        pluginsByUrl[plugin.pluginUrl.toString()] = plugin;
      });
      return pluginsByUrl;
    },

    pluginListsTree() {
      const treeData = [];

      const blacklistedPluginUrls = new Set(this.assetLink.cores.pluginLists.vm.blacklist.plugins.map(plugin => plugin.url.toString()));

      this.assetLink.cores.pluginLists.vm.lists.forEach((pluginList, index) => {
        const listRoot = {
          nodeType: 'plugin-list',
          label: pluginList.sourceUrl.toString(),
          icon: 'mdi-view-list',
          children: [],
          sourceUrl: pluginList.sourceUrl,
          isDefault: pluginList.isDefault,
          isLocal: pluginList.isLocal,
          cachedTimestamp: pluginList.cachedTimestamp,
        };

        if (pluginList.httpStatus && pluginList.httpStatus >= 400) {
          listRoot.error = `HTTP Error ${pluginList.httpStatus}: ${pluginList.httpStatusText}`;
        }

        pluginList.plugins.forEach(plugin => {
          const error = this.getPluginError(plugin);

          const isBlacklisted = blacklistedPluginUrls.has(plugin.url.toString());

          let pluginIcon = 'mdi-puzzle';
          if (error || isBlacklisted) {
            pluginIcon = 'mdi-puzzle-remove';
          }

          listRoot.children.push({
            nodeType: 'plugin',
            label: plugin.url.toString(),
            icon: pluginIcon,
            isBlacklisted,
            error,
            pluginUrl: plugin.url,
          });
        });

        treeData.push(listRoot);
      });

      return treeData;
    },

  },

  onLoad(handle, assetLink) {

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.manage_plugins', slot => {
      slot.type('config-action');

      const targetUrl = createDrupalUrl(`/alink/manage-plugins`).toString();

      slot.component(() =>
        h(QItem, { to: "/manage-plugins", clickable: true, 'v-close-popup': true }, [
            h(QItemSection, {}, "Manage Plugins"),
        ])
      );
    });

  }
}
</script>

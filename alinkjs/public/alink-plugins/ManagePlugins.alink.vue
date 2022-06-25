<template>
  <q-page padding class="manage-plugins">

    <q-tree
      :nodes="pluginListsTree"
      node-key="label"
      default-expand-all
      icon='mdi-play'
      dense
    >
      <template v-slot:default-header="prop">
        <div class="row items-center" style="width: 100%">
          <div class="col-auto ellipsis">
            <q-icon :name="prop.node.icon || 'mdi-share'" size="sm" class="q-mr-xs vertical-middle" />
          </div>
          <div class="col ellipsis" style="direction: rtl; text-align: left;">
            <span class="text-grey-10 inline vertical-middle">{{ prop.node.label }}</span>
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
                    <q-item-section @click="removePluginByUrl(prop.node.pluginUrl)">remove</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </template>

      <template v-slot:default-body="prop">
        <div v-if="prop.node.nodeType === 'plugin-list' && !prop.node.children.length" class="text-italic q-ml-lg">This plugin list is empty</div>
        <div v-if="prop.node.error" class="text-italic text-red-12 q-ml-lg">{{ prop.node.error }}</div>
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
        <v-card-title class="text-h5 grey lighten-2">
          Edit Plugin
        </v-card-title>

        <codemirror v-if="editPluginDialogShown" v-model="code" :options="cmOptions" ref="editor" @ready="onEditorReady()"></codemirror>

        <q-divider></q-divider>

        <q-card-actions>
          <q-spacer></q-spacer>
          <q-btn
            color="primary"
            text
            @click="editPluginDialogShown = false"
          >
            Cancel
          </q-btn>
          <q-btn
            color="primary"
            text
            @click="editPluginDialogShown = false"
          >
            Save
          </q-btn>
        </q-card-actions>
      </q-card>

    </q-dialog>

  </q-page>
</template>

<script>
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

      await this.assetLink.cores.pluginLists.addPluginToLocalList(url);
    },
    async removePluginByUrl(pluginUrl) {
      const confirmed = await this.assetLink.ui.dialog.confirm(`Are you sure you want to remove the plugin "${pluginUrl}"?`);

      if (!confirmed) {
        return;
      }

      await this.assetLink.cores.pluginLists.removePluginFromLocalList(pluginUrl);
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

      this.assetLink.cores.pluginLists.vm.lists.forEach((pluginList, index) => {
        const listRoot = {
          nodeType: 'plugin-list',
          label: pluginList.sourceUrl.toString(),
          icon: 'mdi-view-list',
          children: [],
          sourceUrl: pluginList.sourceUrl,
          isDefault: pluginList.isDefault,
          isLocal: pluginList.isLocal,
        };

        pluginList.plugins.forEach(plugin => {
          const error = this.getPluginError(plugin);

          listRoot.children.push({
            nodeType: 'plugin',
            label: plugin.url.toString(),
            icon: error ? 'mdi-puzzle-remove' : 'mdi-puzzle',
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
    handle.defineRoute('net.symbioquine.farmos_asset_link.routes.v0.manage_plugins', pageRoute => {
      pageRoute.path("/manage-plugins");

      pageRoute.componentFn((wrapper, h) =>
        h(handle.thisPlugin, {})
      );
    });

    const createDrupalUrl = assetLink.util.createDrupalUrl;

    const VListItem = assetLink.ui.c.VListItem;
    const VListItemTitle = assetLink.ui.c.VListItemTitle;

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.manage_plugins', slot => {
      slot.type('config-action');

      slot.showIf(context => true);

      const targetUrl = createDrupalUrl(`/alink/manage-plugins`).toString();

      slot.componentFn((wrapper, h, context) =>
        h(VListItem, { to: "/manage-plugins", href: targetUrl }, [
            h(VListItemTitle, {}, "Manage Plugins"),
        ])
      );
    });

  }
}
</script>

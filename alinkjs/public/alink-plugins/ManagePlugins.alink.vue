<template>
  <div class="manage-plugins">

    <v-list dense>

      <template v-for="(pluginList, index) in assetLink.cores.pluginLists.vm.lists">

        <v-divider v-if="index != 0"></v-divider>

        <v-list-group
          :value="true"
          :key="pluginList.sourceUrl.toString()"
          append-icon=""
          no-action
          dense
        >
          <template v-slot:activator>
            <v-list-item-avatar>
              <v-icon class="grey lighten-1" dark>
                mdi-view-list
              </v-icon>
            </v-list-item-avatar>
            <v-list-item-title>{{ pluginList.sourceUrl.toString() }}</v-list-item-title>
            <v-list-item-action v-if="!pluginList.isLocal">
              <v-menu top offset-x>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                    icon>
                    <v-icon color="grey lighten-1">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item v-if="!pluginList.isLocal" @click="reloadPluginListByUrl(pluginList.sourceUrl)">
                    <v-list-item-title>reload</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="!pluginList.isDefault && !pluginList.isLocal" @click="removePluginListByUrl(pluginList.sourceUrl)">
                    <v-list-item-title>remove</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-list-item-action>
          </template>

          <v-list-item inset v-if="pluginList.error || pluginList.plugins.length === 0">
              <v-list-item-avatar></v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-if="pluginList.plugins.length === 0" class="font-italic">This plugin list is empty</v-list-item-title>
              <v-list-item-subtitle v-if="pluginList.error" class="font-italic red--text text--lighten-1">{{ pluginList.error }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-for="plugin in pluginList.plugins" :key="plugin.url.toString()">
            <v-list-item-avatar>
              <v-icon class="grey lighten-1" dark v-if="getPluginError(plugin)">
                mdi-puzzle-remove
              </v-icon>
              <v-icon class="grey lighten-1" dark v-else>
                mdi-puzzle
              </v-icon>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title v-text="plugin.url" style="direction: rtl; text-align: left;"></v-list-item-title>
              <v-list-item-subtitle v-if="getPluginError(plugin)" class="font-italic red--text text--lighten-1">{{ getPluginError(plugin) }}</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-menu top offset-x>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                    icon>
                    <v-icon color="grey lighten-1">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>

                <v-list>
                  <v-list-item @click="removePluginByUrl(plugin.url)">
                    <v-list-item-title>remove</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-list-item-action>
          </v-list-item>

        </v-list-group>

      </template>

    </v-list>

    <v-speed-dial v-model="showAddPluginButtons" bottom right fixed class="m-3">

      <template v-slot:activator>
        <v-btn
          v-model="showAddPluginButtons"
          color="blue darken-2"
          dark
          fab
        >
          <v-icon v-if="showAddPluginButtons">
            mdi-close
          </v-icon>
          <v-icon v-else>
            mdi-puzzle-plus
          </v-icon>
        </v-btn>
      </template>

      <v-btn color="green" fab large dark aria-hidden="false" aria-label="Add a new plugin by URL" @click="addPluginFromUrl()">
        <v-icon>mdi-link-variant-plus</v-icon>
      </v-btn>

      <v-btn color="green" fab large dark aria-hidden="false" aria-label="Add a new plugin list repository by URL" @click="addPluginListFromUrl()">
        <v-icon>mdi-playlist-plus</v-icon>
      </v-btn>

      <v-btn color="green" fab large dark aria-hidden="false" aria-label="Write a new plugin" @click="editPluginDialogShown = true">
        <v-icon>mdi-puzzle-edit</v-icon>
      </v-btn>

    </v-speed-dial>



    <v-dialog v-model="editPluginDialogShown" :transition="false">
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Edit Plugin
        </v-card-title>

        <codemirror v-if="editPluginDialogShown" v-model="code" :options="cmOptions" ref="editor" @ready="onEditorReady()"></codemirror>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="editPluginDialogShown = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="editPluginDialogShown = false"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>

  </div>
</template>

<script>
export default {
  name: 'ManagePluginsPage',

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
      if (!this.assetLink.viewModel.booted) {
        return {};
      }

      const pluginsByUrl = {};
      this.assetLink.plugins.forEach(plugin => {
        pluginsByUrl[plugin.pluginUrl.toString()] = plugin;
      });
      return pluginsByUrl;
    }
  },

  onLoad(handle, assetLink) {
    handle.defineRoute('net.symbioquine.farmos_asset_link.routes.v0.manage_plugins', managePluginsRoute => {
      managePluginsRoute.path("/manage-plugins");

      managePluginsRoute.componentFn((wrapper, h) =>
        h('ManagePluginsPage', {})
      );
    });

    const createDrupalUrl = assetLink.util.createDrupalUrl;

    const VListItem = assetLink.ui.c.VListItem;
    const VListItemTitle = assetLink.ui.c.VListItemTitle;

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.manage_plugins', managePlugins => {
      managePlugins.type('config-action');

      managePlugins.showIf(context => true);

      const targetUrl = createDrupalUrl(`/alink/manage-plugins`).toString();

      managePlugins.componentFn((wrapper, h, context) =>
        h(VListItem, { props: { to: "/manage-plugins", href: targetUrl } }, [
            h(VListItemTitle, {}, "Manage Plugins"),
        ])
      );
    });

  }
}
</script>

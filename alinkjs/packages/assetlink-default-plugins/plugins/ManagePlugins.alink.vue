<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.manage_plugins]="/manage-plugins">
  <q-page padding class="manage-plugins">

    <q-tree
      :nodes="pluginListsTree"
      node-key="label"
      default-expand-all
      dense
      class="q-mb-xl q-pb-md"
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
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin' && prop.node.getPluginRawSource()">
                    <q-item-section @click="editPluginByUrl(prop.node.pluginUrl)">edit</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin' && !prop.node.isBlacklisted">
                    <q-item-section @click="disablePluginByUrl(prop.node.pluginUrl)">disable</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup v-if="prop.node.nodeType === 'plugin' && prop.node.isBlacklisted">
                    <q-item-section @click="enablePluginByUrl(prop.node.pluginUrl)">enable</q-item-section>
                  </q-item>
                  <template v-if="prop.node.nodeType === 'plugin-list'">
                    <component
                        v-for="slotDef in assetLink.getSlots({ type: 'manage-plugin-list-menu-action', pluginListNode: prop.node })"
                        :key="slotDef.id"
                        :is="slotDef.component"
                        v-bind="slotDef.props"
                        v-close-popup></component>
                  </template>
                  <template v-if="prop.node.nodeType === 'plugin'">
                    <component
                        v-for="slotDef in assetLink.getSlots({ type: 'manage-plugin-menu-action', pluginNode: prop.node })"
                        :key="slotDef.id"
                        :is="slotDef.component"
                        v-bind="slotDef.props"
                        v-close-popup></component>
                  </template>
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
            @click="() => createNewLocalPlugin()"
        ></q-fab-action>
        <component
            v-for="slotDef in assetLink.getSlots({ type: 'add-plugin-fab-action' })"
            :key="slotDef.id"
            :is="slotDef.component"
            v-bind="slotDef.props"></component>
      </q-fab>
    </q-page-sticky>

  </q-page>
</template>

<script>
import { Buffer } from 'buffer/';

import { defineComponent, h, ref, onMounted, onUnmounted, unref } from 'vue';
import {
  QBadge,
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QDialog,
  QForm,
  QIcon,
  QInput,
  QItem,
  QItemLabel,
  QItemSection,
  QList,
  QMenu,
  QSpace,
  QToolbar,
  QToolbarTitle,
  useDialogPluginComponent,
} from 'quasar';

import { createDrupalUrl, components as ApiComponents } from "assetlink-plugin-api";

const PluginCodeEditor = defineComponent((props, { slots, emit, attrs }) => {

  const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

  const code = ref(props.code);

  const closeEditor = (closeHint) => {
    // TODO: Consider checking for unsaved changes and prompting about losing them
    onDialogOK({ updatedCode: undefined, closeHint });
  };

  const saveEdits = () => {
    onDialogOK({ updatedCode: code.value, closeHint: 'save'});
  };

  // Based on https://stackoverflow.com/a/55323073/1864479
  const tryHandleCtrlS = (e) => {
    if (!(e.keyCode === 83 
          // Allow either the ctrl or command key as the modifier
          && (e.ctrlKey || e.metaKey))) {
      return;
    }

    e.preventDefault();
    emit('save', { updatedCode: code.value });
  };

  onMounted(() => {
    document.addEventListener("keydown", tryHandleCtrlS);
  });
  onUnmounted(() => {
    document.removeEventListener("keydown", tryHandleCtrlS);
  });

  return () => h(QDialog, {
      ref: dialogRef,
      transition: false,
      'full-height': true,
      'full-width': true,
    }, () => [
      h(QCard, { 'class': 'full-height column' }, () => [

        h(QToolbar, {}, () => [
          h(QToolbarTitle, { 'class': 'text-h6 text-grey ellipsis', style: "direction: rtl; text-align: left; max-width: 60vw;" }, () =>
            "Edit Plugin: " + props.pluginUrl.toString()),
          h(QSpace),
          h(QBtn, { flat: true, round: true, dense: true, icon: 'mdi-window-minimize', onClick: () => closeEditor('minimize') }),
          h(QBtn, { flat: true, round: true, dense: true, icon: 'mdi-window-close', onClick: () => closeEditor('cancel') }),
        ]),

        h(QCardSection, { 'class': "col", 'style': "height: auto; min-height: 160px; max-height: 100%; position: relative; contain: strict;" }, () => [
          h(ApiComponents.CodeEditor, { 'code-mimetype': props.codeMimetype, modelValue: code.value, 'onUpdate:modelValue': (value) => { code.value = value; } })
        ]),

        h(QCardActions, { align: 'right' }, () => [
          h(QBtn, { flat: true, label: 'Save', icon: 'mdi-content-save', color: 'primary', onClick: saveEdits }),
        ]),

      ]),
    ]);
});
PluginCodeEditor.props = ['pluginUrl', 'code', 'codeMimetype'];
PluginCodeEditor.emits = ['save'];

const UrlPromptDialog = defineComponent((props, { slots, emit, attrs }) => {
  const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

  const url = ref(props.prefilledValue || '');
  const confirmText = ref('');

  return () => h(QDialog, { ref: dialogRef }, () => [
    h(QCard, { style: "width: 700px; max-width: 80vw;" }, () => [

      h(QCardSection, { 'class': "text-h6" }, () => props.title),

      h(QForm, { onSubmit: () => onDialogOK(url.value) }, () => [

        h(QCardSection, {}, () => [
          h(QInput, {
            dense: true,
            autofocus: true,
            type: 'url',
            label: props.promptLabel,
            hint: props.promptHint,
            modelValue: url.value,
            'onUpdate:modelValue': (value) => { url.value = value; },
            rules: [
              (val) => (val && val.length > 0) || 'Please enter a URL',
              (val) => {
                try {
                  const u = new URL(val);
                  if (props.requiredUrlPathnamePattern && !props.requiredUrlPathnamePattern.test(u.pathname)) {
                    return props.requiredUrlPathnameMismatchError;
                  }
                  return true;
                } catch (err) {
                  return 'Invalid URL: ' + err.message;
                }
              },
            ],
          }),
        ]),

        h(QCardSection, { 'class': "text-body2 text-orange-14" }, () => [
          props.warningText,
          h(QInput, {
            dense: true,
            type: 'text',
            label: 'Confirm',
            hint: 'Type "here be dragons" to confirm',
            modelValue: confirmText.value,
            'onUpdate:modelValue': (value) => { confirmText.value = value; },
            rules: [
              (val) => (val && val.length > 0 && val.trim().toLowerCase() === 'here be dragons') || 'Please enter "here be dragons"',
            ],
            'class': 'q-mt-md',
          }),
        ]),

        h(QCardActions, { align: 'right' }, () => [
          h(QBtn, { flat: true, label: 'Cancel', color: 'secondary', onClick: () => onDialogCancel(), 'v-close-popup': true }),
          h(QBtn, { flat: true, label: 'Add', color: 'primary', type: "submit", disable: !url.value }),
        ]),

      ]),

    ]),
  ]);
});
UrlPromptDialog.props = ['title', 'promptLabel', 'promptHint', 'requiredUrlPathnamePattern', 'requiredUrlPathnameMismatchError', 'warningText', 'prefilledValue'];

const OLD_PLUGIN_DATA_URL_PREFIX = "data:application/javascript;base64,";
const PLUGIN_DATA_URL_PREFIX = "data:application/octet-stream;base64,";
const PERSISTENT_EDITORS_IDX_KEY = `manage-plugins-persistent-edit-dialogs-index`;
const PERSISTENT_EDITOR_KEY_PREFIX = `manage-plugins-persistent-edit-dialog:`;

const getPersistentEditorsIndex = async (assetLink) => {
  const rawIndex = await assetLink.store.getItem(PERSISTENT_EDITORS_IDX_KEY) || [];

  return rawIndex.map(rawIndexEntry => ({
    pluginUrl: new URL(rawIndexEntry.pluginUrl),
    codeMimetype: rawIndexEntry.codeMimetype,
    isOpen: rawIndexEntry.isOpen,
    pluginUrlToDisableOnFirstSave: rawIndexEntry.pluginUrlToDisableOnFirstSave ? new URL(rawIndexEntry.pluginUrlToDisableOnFirstSave) : undefined,
  }));
};

const mutatePersistentEditorsIndex = async (assetLink, mutatorFn) => {
  const index = await getPersistentEditorsIndex(assetLink);

  const shouldWrite = mutatorFn(index) !== false;
  if (shouldWrite) {
    const updatedRawIndex = index.map(indexEntry => ({
      pluginUrl: indexEntry.pluginUrl.toString(),
      codeMimetype: indexEntry.codeMimetype,
      isOpen: indexEntry.isOpen,
      pluginUrlToDisableOnFirstSave: indexEntry.pluginUrlToDisableOnFirstSave ? indexEntry.pluginUrlToDisableOnFirstSave.toString() : undefined,
    }));
    await assetLink.store.setItem(PERSISTENT_EDITORS_IDX_KEY, updatedRawIndex);
    assetLink.eventBus.$emit(`changed:${PERSISTENT_EDITORS_IDX_KEY}`);
  }
  return shouldWrite;
}

const openPersistentEditor = async (assetLink, localPluginUrl, initialCodeMimetype, initialCode, pluginUrlToDisableOnFirstSave) => {
  const editorDataKey = PERSISTENT_EDITOR_KEY_PREFIX + localPluginUrl.pathname;

  let indexEntry = { pluginUrl: localPluginUrl, codeMimetype: initialCodeMimetype, isOpen: false, pluginUrlToDisableOnFirstSave };
  const isNewEditor = await mutatePersistentEditorsIndex(assetLink, (index) => {
    const idx = index.findIndex(indexEntry => indexEntry.pluginUrl.toString() === localPluginUrl.toString());
    if (idx >= 0) {
      indexEntry = index[idx];
      return false;
    }
    index.push(indexEntry);
  });

  let code = initialCode;
  if (isNewEditor) {
    const pluginDataUrl = PLUGIN_DATA_URL_PREFIX + Buffer.from(initialCode, 'utf8').toString('base64');

    await assetLink.store.setItem(editorDataKey, { pluginDataUrl });
  } else {
    const storedState = await assetLink.store.getItem(editorDataKey);
    if (storedState) {
      // Rewrite old data urls into new binary compatible format
      if (storedState.pluginDataUrl.startsWith(OLD_PLUGIN_DATA_URL_PREFIX)) {
        const rawPluginSource = Buffer.from(storedState.pluginDataUrl.substring(OLD_PLUGIN_DATA_URL_PREFIX.length), 'base64');

        storedState.pluginDataUrl = PLUGIN_DATA_URL_PREFIX + rawPluginSource.toString('base64');

        await assetLink.store.setItem(editorDataKey, storedState);
      }

      const pluginDataUrl = storedState.pluginDataUrl;

      if (!pluginDataUrl.startsWith(PLUGIN_DATA_URL_PREFIX)) {
        throw new Error(`Persistent editor plugin data url must start with: '${PLUGIN_DATA_URL_PREFIX}'`);
      }

      code = Buffer.from(pluginDataUrl.substring(PLUGIN_DATA_URL_PREFIX.length), 'base64').toString('utf8');
    }
  }

  const doSave = async (codeToSave) => {
    if (indexEntry.pluginUrlToDisableOnFirstSave) {
      await assetLink.cores.pluginLists.addPluginToLocalBlacklist(indexEntry.pluginUrlToDisableOnFirstSave);

      mutatePersistentEditorsIndex(assetLink, (index) => {
        const idx = index.findIndex(indexEntry => indexEntry.pluginUrl.toString() === localPluginUrl.toString());
        if (idx < 0) {
          return false;
        }
        index[idx].pluginUrlToDisableOnFirstSave = undefined;
      });
    }

    const updatedPluginDataUrl = PLUGIN_DATA_URL_PREFIX + Buffer.from(codeToSave, 'utf8').toString('base64');

    await assetLink.store.setItem(editorDataKey, { pluginDataUrl: updatedPluginDataUrl });

    await assetLink.cores.localPluginStorage.writeLocalPlugin(localPluginUrl, codeToSave);
  };

  const { updatedCode, closeHint } = await assetLink.ui.dialog.custom(PluginCodeEditor, {
    pluginUrl: localPluginUrl,
    code,
    codeMimetype: indexEntry.codeMimetype,
    persistent: true,
    onSave: ({ updatedCode }) => doSave(updatedCode),
  });

  if (updatedCode === undefined || closeHint !== 'save') {
    if (closeHint === 'cancel') {
      await closePersistentEditor(assetLink, localPluginUrl)
    }
    return;
  }

  doSave(updatedCode);
};

const closePersistentEditor = async (assetLink, localPluginUrl) => {
  const editorDataKey = PERSISTENT_EDITOR_KEY_PREFIX + localPluginUrl.pathname;

  await assetLink.store.removeItem(editorDataKey);

  mutatePersistentEditorsIndex(assetLink, (index) => {
    const idx = index.findIndex(indexEntry => indexEntry.pluginUrl.toString() === localPluginUrl.toString());
    if (idx < 0) {
      return false;
    }
    index.splice(idx, 1);
  });
};

const promptForPluginUrl = async (assetLink, prefilledValue) => {
  const url = await assetLink.ui.dialog.custom(UrlPromptDialog, {
      title: "Add Plugin",
      promptLabel: "Plugin URL",
      promptHint: "What is the url of the plugin to be added?",
      requiredUrlPathnamePattern: /[^/]+\.alink\.[^/]+$/,
      requiredUrlPathnameMismatchError: "Plugin URL path must end with '.alink.*'",
      warningText: "Warning: Installing plugins from untrusted sources could leak or corrupt your farmOS data!",
      prefilledValue,
  });

  if (!url) {
    return;
  }

  await assetLink.cores.pluginLists.addPluginToLocalList(new URL(url));
};

const promptForPluginListUrl = async (assetLink, prefilledValue) => {
  const url = await assetLink.ui.dialog.custom(UrlPromptDialog, {
      title: "Add Plugin List",
      promptLabel: "Plugin List URL",
      promptHint: "What is the url of the plugin list to be added?",
      requiredUrlPathnamePattern: /[^/]+\.repo\.json$/,
      requiredUrlPathnameMismatchError: "Plugin list URL path must end with '.repo.json'",
      warningText: "Warning: Installing untrusted plugin lists could leak or corrupt your farmOS data!",
      prefilledValue,
  });

  if (!url) {
    return;
  }

  await assetLink.cores.pluginLists.addExtraPluginList(new URL(url));
};

export default {
  components: {
    PluginCodeEditor,
  },

  inject: ['assetLink'],

  data() {
    return {
      showAddPluginButtons: false,
    };
  },

  mounted() {
    this.$emit('expose-route-title', "Manage Plugins");
  },

  methods: {
    async addPluginFromUrl() {
      await promptForPluginUrl(this.assetLink);
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
    async editPluginByUrl(pluginUrl) {
      const code = this.assetLink.cores.pluginLoader.vm.pluginRawSourceByUrl[pluginUrl.toString()];

      let disableSourcePlugin = false;

      let localPluginUrl = pluginUrl;
      if (pluginUrl.protocol !== 'indexeddb:') {
        disableSourcePlugin = true;

        const pluginFilename = pluginUrl.pathname.split('/').pop();

        localPluginUrl = new URL(`indexeddb://asset-link/data/${pluginFilename}`);
      }

      let codeMimetype = undefined;
      if (localPluginUrl.pathname.endsWith('alink.js')) {
        codeMimetype = "text/javascript";
      } else if (localPluginUrl.pathname.endsWith('alink.vue')) {
        codeMimetype = "text/x-vue";
      } else if (localPluginUrl.pathname.endsWith('.json')) {
        codeMimetype = "application/json";
      }

      openPersistentEditor(this.assetLink, localPluginUrl, codeMimetype, code, disableSourcePlugin ? pluginUrl : undefined );
    },
    async createNewLocalPlugin() {
      const newPluginName = await this.assetLink.ui.dialog.promptText(`Give your new plugin a name... it must be in the format "{name}.alink.{extension}"`);

      if (!newPluginName) {
        return;
      }

      if (!/^.+\.alink\..+$/.test(newPluginName)) {
        // TODO: Surface this more nicely
        throw new Error("Invalid plugin name:", newPluginName);
      }

      const pluginUrl = new URL(`indexeddb://asset-link/data/${newPluginName}`);

      const pluginBaseName = newPluginName.split('.alink.')[0];

      let pluginTemplate = "";
      let codeMimetype = undefined;
      if (pluginUrl.pathname.endsWith('alink.js')) {
        codeMimetype = "text/javascript";
        pluginTemplate = `export default class ${pluginBaseName} {\n  static onLoad(handle, assetLink) {\n\n  }\n\n}\n`;
      } else if (pluginUrl.pathname.endsWith('alink.vue')) {
        codeMimetype = "text/x-vue";
        pluginTemplate = `<${'script'} setup>\n</${'script'}>\n\n<${'template'}>\n<div>Hello world!</div>\n</${'template'}>\n`;
      } else if (pluginUrl.pathname.endsWith('.json')) {
        codeMimetype = "application/json";
      }

      openPersistentEditor(this.assetLink, pluginUrl, codeMimetype, pluginTemplate);
    },
    async disablePluginByUrl(pluginUrl) {
      await this.assetLink.cores.pluginLists.addPluginToLocalBlacklist(pluginUrl);
    },
    async enablePluginByUrl(pluginUrl) {
      await this.assetLink.cores.pluginLists.removePluginFromLocalBlacklist(pluginUrl);
    },
    async addPluginListFromUrl() {
      await promptForPluginListUrl(this.assetLink);
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
          const loaded = unref(this.pluginsByUrl[plugin.url.toString()]?.onLoadDone) || false;

          const error = this.getPluginError(plugin);

          const isBlacklisted = blacklistedPluginUrls.has(plugin.url.toString());

          let pluginIcon = 'mdi-puzzle';
          if (error || isBlacklisted) {
            pluginIcon = 'mdi-puzzle-remove';
          } else if (!loaded) {
            pluginIcon = 'mdi-timer-sand';
          }

          listRoot.children.push({
            nodeType: 'plugin',
            label: plugin.url.toString(),
            icon: pluginIcon,
            isBlacklisted,
            error,
            pluginUrl: plugin.url,
            getPlugin: () => this.pluginsByUrl[plugin.url.toString()],
            getPluginRawSource: () => this.assetLink.cores.pluginLoader.vm.pluginRawSourceByUrl[plugin.url.toString()],
          });
        });

        treeData.push(listRoot);
      });

      return treeData;
    },

  },

  onLoad(handle, assetLink) {
    const currentPersistentEditors = ref([]);

    const loadPersistentEditors = async () => {
      currentPersistentEditors.value = await getPersistentEditorsIndex(assetLink);
    };
    loadPersistentEditors();
    assetLink.eventBus.$on(`changed:${PERSISTENT_EDITORS_IDX_KEY}`, () => loadPersistentEditors());

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.manage_plugins', slot => {
      slot.type('config-action');

      const targetUrl = createDrupalUrl(`/alink/manage-plugins`).toString();

      slot.component(() =>
        h(QItem, { to: "/manage-plugins", clickable: true, 'v-close-popup': true }, () => [
            h(QItemSection, {}, () => "Manage Plugins"),
        ])
      );
    });

    handle.defineSlot('net.symbioquine.farmos_asset_link.actions.v0.manage_plugins_persistent_edit_dialogs_menu', slot => {
      slot.type('persistent-ux-tray-item');

      slot.showIf(() => currentPersistentEditors.value.length);

      slot.component(() =>
        h(QBtn, { dense: true, flat: true, icon: "mdi-puzzle-edit" }, () => [

          h(QMenu, { 'auto-close': true }, () =>
            h(QList, { 'style': "min-width: 100px" }, () => currentPersistentEditors.value.map(currentEditor =>
              h(QItem, { 'clickable': true, onClick: () => openPersistentEditor(assetLink, currentEditor.pluginUrl) }, () =>
                h(QItemSection, {}, () => currentEditor.pluginUrl.pathname)
              )
            ))
          ),

          h(QBadge, { color: 'blue-8', floating: true }, () => '' + currentPersistentEditors.value.length),

        ])
      );
    });

    handle.defineSlot('net.symbioquine.farmos_asset_link.promoted_search_slot.v0.install_plugins', slot => {
      slot.type('asset-search-promoted-result');

      slot.showIf(({ searchRequest }) => /^https?:\/\/.*[^/]+(\.alink\.[^/]+|\.repo\.json)/.test(searchRequest?.term || ''));

      const doInstallWorkflow = (url) => {
        if (url.pathname.endsWith('.repo.json')) {
          promptForPluginListUrl(assetLink, url.toString());
        } else {
          promptForPluginUrl(assetLink, url.toString());
        }
      };

      slot.component(({ searchRequest }) => {
        const url = new URL(searchRequest.term);

        const filename = url.pathname.split('/').pop();

        const icon = url.pathname.endsWith('.repo.json') ? 'mdi-playlist-plus' : 'mdi-link-variant-plus';

        const installSubject = url.pathname.endsWith('.repo.json') ? 'Plugin List' : 'Plugin'

        return h(QItem, { 'clickable': true, onClick: () => doInstallWorkflow(url), class: 'q-ml-lg q-mb-md' }, () => [
          h(QItemSection, { avatar: true, class: 'q-mr-none' }, () => 
            h(QIcon, { color: 'primary', name: icon })),
          h(QItemSection, {}, () => [
            h(QItemLabel, {}, () => `Install ${installSubject}: ` + filename),
            h(QItemLabel, { caption: true, lines: 2 }, () => searchRequest.term),
          ]),
        ])
      });
    });

  }
}
</script>

<style>
  .manage-plugins .q-tree .q-tree__node--child:nth-of-type(odd) {
    background-color: rgb(223, 223, 223) !important;
  }
</style>

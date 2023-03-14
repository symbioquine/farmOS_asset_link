<script setup>
import { h, inject, ref, defineComponent } from 'vue';
import {
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QCheckbox,
  QDialog,
  QForm,
  QInput,
  QSelect,
  QTabs,
  QTab,
  QSeparator,
  QTabPanels,
  QTabPanel,
  QToggle,
  useDialogPluginComponent,
} from 'quasar';

import { formatRFC3339, components as ApiComponents } from "assetlink-plugin-api";


const assetLink = inject('assetLink');


const AddPreviewAssetDialog = defineComponent((props, { slots, emit, attrs }) => {
  const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

  const searchMethod = ref('text-search');

  const onAssetSearchSubmitted = (assets) => {
    if (assets?.length) {
      return onDialogOK({
        assets,
      });
    }
    onDialogCancel();
  }

  return () => h(QDialog, { ref: dialogRef }, () => [
    h(QCard, { class: 'q-gutter-md', style: "width: 700px; max-width: 80vw;" }, () => [

      h(ApiComponents.EntitySearch, {
          title: "Find Example Assets",
          confirmLabel: "Choose",
          entityType: "asset",
          multiple: true,
          searchMethod: searchMethod.value,
          key: searchMethod.value,
          'onChanged:search-method': newSearchMethod => { searchMethod.value = newSearchMethod; } ,
          onSubmit: onAssetSearchSubmitted,
      }),

    ]),
  ]);
});


const LogPluginCreatorWizardDialog = defineComponent((props, { slots, emit, attrs }) => {
  const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

  // TODO: Handle conflicting names
  // TODO: Add validation
  const pluginName = ref('MyAssetLogPlugin');

  // TODO: Add validation, helpful syntax errors
  // TODO: Consider adding a "condition wizard" sub-dialog
  const actionCriteriaExpr = ref('asset.type == `asset--animal` && contains([`M`, `F`], asset.attributes.sex)');

  // TODO: Add validation, helpful syntax errors
  const actionBtnTemplate = ref('Observe {{asset.attributes.name}}');

  // TODO: Add validation, helpful syntax errors
  const logNameTemplate = ref('Made Observation of {{asset.attributes.name}}!');

  const logType = ref(props.logTypes.find(lt => lt.attributes.drupal_internal__id === 'observation'));
  const defaultLogStatus = ref('done');
  const logStatusToggleable = ref(false);

  // TODO: Consider allowing user date selection
  // TODO: Consider allowing user notes input

  const helperTab = ref('preview');

  const previewAssets = ref([]);
  const addPreviewAsset = async () => {
    const params = await assetLink.ui.dialog.custom(AddPreviewAssetDialog);

    if (!params?.assets?.length) {
      return;
    }

    params.assets.forEach(asset => previewAssets.value.push(asset));
  };

  return () => h(QDialog, { ref: dialogRef }, () => [
    h(QCard, { style: "width: 700px; max-width: 80vw;" }, () => [

      h(QCardSection, { 'class': "text-h6" }, () => "Create Asset log Plugin"),

      h(QForm, { onSubmit: () => onDialogOK({
          pluginName: pluginName.value,
          actionCriteriaExpr: actionCriteriaExpr.value,
          actionBtnTemplate: actionBtnTemplate.value,
          logNameTemplate: logNameTemplate.value,
          logType: `log--${logType.value.attributes.drupal_internal__id}`,
          defaultLogStatus: defaultLogStatus.value,
          logStatusToggleable: logStatusToggleable.value,
        }) }, () => [

          h(QCardSection, {}, () => [

            h(QInput, {
              dense: true,
              autofocus: true,
              type: 'text',
              label: 'Plugin Name',
              hint: 'Name this plugin',
              class: "q-my-md",
              modelValue: pluginName.value,
              'onUpdate:modelValue': (value) => { pluginName.value = value; },
              rules: [
                (val) => (val && val.length > 0) || 'Please enter a plugin name',
              ],
            }),

            h(QInput, {
              dense: true,
              type: 'text',
              label: 'Action Criteria',
              hint: 'Only show this log action for assets where this criteria matches',
              class: "q-my-md",
              modelValue: actionCriteriaExpr.value,
              'onUpdate:modelValue': (value) => { actionCriteriaExpr.value = value; },
              rules: [
                (val) => (val && val.length > 0) || 'Please enter an asset criteria',
              ],
            }),

            h(QInput, {
              dense: true,
              type: 'text',
              label: 'Action Label Template',
              hint: 'Text to show on the asset action button',
              class: "q-my-md",
              ...vModel(actionBtnTemplate),
              rules: [
                (val) => (val && val.length > 0) || 'Please enter text for the asset action',
              ],
            }),

            h('div', { 'class': "q-gutter-md row items-start"}, [

              h(QSelect, {
                label: 'Log Type',
                emitValue: true,
                optionValue: lt => lt,
                optionLabel: lt => lt.attributes.label,
                ...vModel(logType),
                options: props.logTypes,
                class: "col-8",
              }),

              h(QToggle, {
                label: `Default Log Status: ${defaultLogStatus.value}`,
                'false-value': "pending",
                'true-value': "done",
                ...vModel(defaultLogStatus),
              }),

              h(QToggle, {
                label: `User Toggleable: ${logStatusToggleable.value}`,
                ...vModel(logStatusToggleable),
              }),

            ]),

            h(QInput, {
              dense: true,
              autofocus: true,
              type: 'text',
              label: 'Log Name Template',
              'class': "q-my-md",
              ...vModel(logNameTemplate),
              rules: [
                (val) => (val && val.length > 0) || 'Please enter a log name template',
              ],
            }),

            h(QTabs, {
              ...vModel(helperTab),
              dense: true,
              class: "text-grey",
              activeColor: "primary",
              indicatorColor: "primary",
              align: "justify",
              narrowIndicator: true,
            }, () => [
              h(QTab, { name: 'preview', label: 'Preview' }),
              h(QTab, { name: 'help', label: 'Help' }),
            ]),

            h(QSeparator),

            h(QTabPanels, {
              ...vModel(helperTab),
              animated: true,
            }, () => [
              h(QTabPanel, { name: 'preview' }, () => [
                ...previewAssets.value.map(asset => {
                  const isPreviewLogDone = ref(defaultLogStatus.value === 'done');

                  if (!jmespath.search({ asset }, actionCriteriaExpr.value)) {
                    return h(QCard, { bordered: true, class: 'q-ma-sm bg-grey-9' }, () => [
                      h(QCardSection, () => [
                        h('div', { class: 'text-italic text-red-12' }, [
                          `${asset.id} (${asset.attributes.drupal_internal__id}) ${asset.attributes.name} does not match the action criteria.`
                        ]),
                      ]),
                    ]);
                  }

                  return h(QCard, { dark: true, bordered: true, class: 'q-ma-sm bg-grey-9' }, () => [
                    h(QCardSection, () => [

                      renderActionBtn({
                        onClick: undefined,
                        actionBtnTemplate: actionBtnTemplate.value,
                        asset,
                        // class: 'q-mt-md',
                      })

                    ]),

                    h(QSeparator),

                    logPreview({
                      markLogDoneRef: isPreviewLogDone,
                      logStatusToggleable: logStatusToggleable.value,
                      logNameTemplate: logNameTemplate.value,
                      logType: logType.value,
                      asset,
                    }),

                  ]);

                }),

                h(QBtn, { icon: 'mdi-plus', label: "Add Preview Asset(s)", color: 'green', class: 'q-mt-md', onClick: () => addPreviewAsset() }),

              ]),
              h(QTabPanel, { name: 'help' }, () => {
                const p = text => h('p', text);

                return [
                  p("This wizard helps create \"asset action\" plugins which in turn allow creating quick logs about assets."),
                  h('div', { class: 'text-h6' }, "Plugin Name"),
                  p("This is the name of your plugin. It is used to identify the plugin within Asset Link and to name the " +
                    "resulting file if you choose to share the plugin with others."),
                  h('div', { class: 'text-h6' }, "Action Criteria"),
                  p("You probably don't want the asset action from your plugin to show up for all assets. The criteria field " +
                    "makes it possible to define the specific conditions under which the action button should appear. The criteria " +
                    "expression is written in JMESPath. See https://jmespath.org/tutorial.html"),
                  h('div', { class: 'text-h6' }, "Templates"),
                  p(["Several of the fields are templated - that is you can substitute information from the asset into the resulting " +
                    "text. The template language is called micromustache. Fields from the asset can be referenced by a dotted path surrounded " +
                    "by double braces. e.g. ", h('code', '{{ asset.attributes.status }}'), " check out https://unpkg.com/micromustache@8.0.3/playground/index.html"]),
                ];
              }),
            ]),

          ]),

          h(QCardActions, { align: 'right' }, () => [
            h(QBtn, { flat: true, label: 'Cancel', color: 'secondary', onClick: () => onDialogCancel(), 'v-close-popup': true }),
            h(QBtn, { flat: true, label: 'Create Plugin', color: 'primary', type: "submit", disable: !logNameTemplate.value || !logType.value || !defaultLogStatus.value }),
          ]),

      ]),

    ]),
  ]);
});
LogPluginCreatorWizardDialog.props = ['logTypes'];

const createAssetLogPluginClicked = async () => {
  const logTypes = await assetLink.getLogTypes();

  const params = await assetLink.ui.dialog.custom(LogPluginCreatorWizardDialog, { logTypes });

  if (!params) {
    return;
  }

  /*
  params = {
    pluginName,
    actionCriteriaExpr,
    actionBtnTemplate,
    logNameTemplate,
    logType,
    defaultLogStatus,
    logStatusToggleable,
  }
  */

  // Convert the supplied plugin name to "snake case" to use as the id
  // Adds an '_' in front of each capital letter (except the first) and converts to lowercase
  // Based on https://stackoverflow.com/a/54246501/1864479
  const pluginId = params.pluginName.replace(/[A-Z]/g, (l, idx) => `${idx ? '_' : '' }${l.toLowerCase()}`);

  const pluginFilename = `${params.pluginName}.alink.act.json`;

  const localPluginUrl = new URL(`indexeddb://asset-link/data/${pluginFilename}`);

  const pluginData = {
    "AssetLinkPluginFormat": "net.symbioquine.farmos_asset_link.plugin_format.v0.basic_asset_log",
    "id": pluginId,
    "actionCriteriaExpr": params.actionCriteriaExpr,
    "actionBtnTemplate": params.actionBtnTemplate,
    "logNameTemplate": params.logNameTemplate,
    "logType": params.logType,
    "defaultLogStatus": params.defaultLogStatus,
    "logStatusToggleable": params.logStatusToggleable,
  };

  const pluginDataJson = JSON.stringify(pluginData, null, 4);

  await assetLink.cores.localPluginStorage.writeLocalPlugin(localPluginUrl, pluginDataJson);
};
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.fab_action.v0.asset_log_plugin_wizard_fab_action]="add-plugin-fab-action">
  <q-fab-action
      color="deep-purple-4"
      icon="mdi-application-variable"
      aria-hidden="false"
      aria-label="Create a new plugin with a beginner-friendly wizard"
      @click="createAssetLogPluginClicked"
  ></q-fab-action>
</template>

<script>
import { h, inject, ref } from 'vue';
import { renderFn, get } from 'micromustache';
import jmespath from 'jmespath';


const vModel = (model) => ({
  modelValue: model.value,
  'onUpdate:modelValue': (value) => { model.value = value; },
});

function expandStringTemplateVariable(varName, scope) {
  // If the varName starts with '@|' (ignoring whitespace) then evaluate it with jmespath
  const m = varName.match(/^\s*\@\s*\|/);
  if (m) {
    return jmespath.search(scope, varName);
  }
  return get(scope, varName)
}

const renderActionBtn = ({ onClick, actionBtnTemplate, asset }) => 
  h(QBtn, {
    block: true,
    color: 'secondary',
    onClick,
    noCaps: true,
  },  () => renderFn(actionBtnTemplate, expandStringTemplateVariable, { asset }) );

const logPreview = ({ markLogDoneRef, logStatusToggleable, logNameTemplate, logType, asset }) =>
  h(QCardSection, () => [
    h('div', { class: 'text-h6' }, [
      logStatusToggleable ?
        h(QCheckbox, {
          ...vModel(markLogDoneRef),
        }) : 
        ( markLogDoneRef.value ? '\u{2611} ' : '\u{2610} ' ),
      renderFn(logNameTemplate, expandStringTemplateVariable, { asset }),
    ]),
    h('div', { class: 'text-subtitle2 q-ml-lg' }, `Log Type: ${logType.attributes.label}`),
  ]);

const ConfirmLogPreviewDialog = defineComponent((props, { slots, emit, attrs }) => {
  const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

  const assetLink = inject('assetLink');

  const logTypeId = props.pluginData.logType.split('--')[1];

  const logType = assetLink.entitySource.cache.query(q => q.findRecords('log_type--log_type').filter({ attribute: 'drupal_internal__id', value: logTypeId }))[0];

  // TODO: Throw an error and bail here if the log type is missing - i.e. if the
  // plugin is copied to a farmOS instance where a given log type is not available

  const markLogDone = ref(props.pluginData.defaultLogStatus === 'done');

  const asset = props.asset;

  return () => h(QDialog, { ref: dialogRef }, () => [
    h(QCard, { dark: true, bordered: true, class: 'q-gutter-md bg-grey-9' }, () => [

      h(QForm, { onSubmit: () => onDialogOK({
          markLogDone: markLogDone.value,
        }) }, () => [

        logPreview({
          markLogDoneRef: markLogDone,
          logStatusToggleable: props.pluginData.logStatusToggleable,
          logNameTemplate: props.pluginData.logNameTemplate,
          logType,
          asset,
        }),

        h(QCardActions, { align: 'right' }, () => [
          h(QBtn, { flat: true, label: 'Cancel', color: 'secondary', onClick: () => onDialogCancel(), 'v-close-popup': true }),
          h(QBtn, { flat: true, label: 'Confirm', color: 'primary', type: "submit" }),
        ]),

      ]),
    ]),
  ]);
});
ConfirmLogPreviewDialog.props = ['pluginData', 'asset'];

export default {
  onLoad(handle, assetLink) {

    handle.definePluginIngestor(pluginIngestor => {
      pluginIngestor.onEveryPlugin(plugin => {

        // Ignore everything except the file type we're prepared to handle
        if (!plugin.pluginUrl.pathname.endsWith('alink.act.json')) {
          return;
        }

        // Tell asset link that we're going to define things on behalf of the JSON file
        // that we're ingesting
        handle.onBehalfOf(plugin, attributedHandle => {
          let pluginData = undefined;
          try {
            pluginData = JSON.parse(plugin.rawSource);
          } catch (error) {
            // Errors recorded this way will show up on the manage plugins page
            // associated with the plugin we've specified
            attributedHandle.recordError(error);
            return;
          }

          // Ignore everything except the plugin format we're trying to implement
          if (pluginData.AssetLinkPluginFormat !== "net.symbioquine.farmos_asset_link.plugin_format.v0.basic_asset_log") {
            return;
          }

          attributedHandle.defineSlot(`net.symbioquine.farmos_asset_link.basic_asset_log.v0.${pluginData.id}`, action => {
            action.type('asset-action');

            action.showIf(({ asset }) => {
              return !!jmespath.search({ asset }, pluginData.actionCriteriaExpr);
            });

            // This gets called when the user clicks the action button
            const doActionWorkflow = async (asset) => {
              const params = await assetLink.ui.dialog.custom(ConfirmLogPreviewDialog, { pluginData, asset });

              if (!params) {
                return;
              }

              let log = {
                type: pluginData.logType,
                attributes: {
                  name: renderFn(pluginData.logNameTemplate, expandStringTemplateVariable, { asset }),
                  timestamp: formatRFC3339(new Date()),
                  status: params.markLogDone ? 'done' : 'pending',
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
                }
              };

              assetLink.entitySource.update(
                  (t) => t.addRecord(log),
                  {label: log.attributes.name});
            };

            action.component(({ asset }) => renderActionBtn({
              onClick: () => doActionWorkflow(asset),
              actionBtnTemplate: pluginData.actionBtnTemplate,
              asset,
            }));

          });

        });

      });
    });

  }

}
</script>


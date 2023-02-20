<script setup>
import { computed, inject, ref, defineComponent, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import {
  date,
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QDate,
  QDialog,
  QForm,
  QIcon,
  QInput,
  QPopupProxy,
  QSelect,
  QTime,
  QToggle,
  useDialogPluginComponent,
} from 'quasar';

import { currentEpochSecond, parseJSONDate, formatRFC3339 } from "assetlink-plugin-api";

const emit = defineEmits(['expose-meta-actions', 'expose-route-title']);

const route = useRoute();
const router = useRouter();

const assetLink = inject('assetLink');

const upcomingLogs = ref([]);
const lateLogs = ref([]);
const recentLogs = ref([]);

const loadLogs = async () => {
  const logTypes = (await assetLink.getLogTypes()).map(t => t.attributes.drupal_internal__id);

  const now = currentEpochSecond();

  const logsWithQuery = async (qFn) => {
    const results = await assetLink.entitySource.query(q => logTypes.map(logType => {
      return qFn(q.findRecords(`log--${logType}`));
    }));

    return results
      .flatMap(l => l)
      .sort((a, b) => (parseJSONDate(a.attributes.timestamp) - parseJSONDate(b.attributes.timestamp)) ||
                      (parseJSONDate(a.attributes.drupal_internal__id) - parseJSONDate(b.attributes.drupal_internal__id)));
  };

  upcomingLogs.value = await logsWithQuery(q => q
        .filter({ attribute: 'status', op: '<>', value: 'done' })
        .filter({ attribute: 'timestamp', op: '>=', value: now })
        .sort('-timestamp'));

  lateLogs.value = await logsWithQuery(q => q
        .filter({ attribute: 'status', op: '<>', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<', value: now })
        .sort('-timestamp'));

  recentLogs.value = await logsWithQuery(q => q
        .filter({ attribute: 'status', op: 'equal', value: 'done' })
        .filter({ attribute: 'timestamp', op: '<', value: now })
        .sort('-timestamp'));
};

let unsubber;
onMounted(() => {
  loadLogs();
  unsubber = assetLink.eventBus.$on("changed:log", () => loadLogs());
});
onUnmounted(() => unsubber && unsubber.$off());

const expandedKeys = ref(['upcoming-logs', 'late-logs', 'recent-logs']);

const nodes = computed(() => [
  {
    id: 'upcoming-logs',
    label: 'Upcoming',
    icon: 'mdi-clock-outline',
    isCategory: true,
    selectable: false,
    children: upcomingLogs.value.map(log => ({
      id: log.id,
      log,
      selectable: true,
    })),
  },
  {
    id: 'late-logs',
    label: 'Late',
    icon: 'mdi-clock-alert-outline',
    isCategory: true,
    selectable: false,
    children: lateLogs.value.map(log => ({
      id: log.id,
      log,
      selectable: true,
    })),
  },
  {
    id: 'recent-logs',
    label: 'Recent',
    icon: 'mdi-clock-check-outline',
    isCategory: true,
    selectable: false,
    children: recentLogs.value.map(log => ({
      id: log.id,
      log,
      selectable: true,
    })),
  },
]);

const tree = ref(undefined);

const logClicked = (nodeKey) => {
  const node = tree.value.getNodeByKey(nodeKey);
  if (!node?.log) {
    return;
  }
  router.push(`/log/${node.log.attributes.drupal_internal__id}`);
};

const GenericCreateLogDialog = defineComponent((props, { slots, emit, attrs }) => {
  const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

  const logName = ref('');
  const logType = ref('observation');
  const logStatus = ref('done');

  const widgetDateFormat = 'YYYY-MM-DD HH:mm';

  const logDate = ref(date.formatDate(Date.now(), widgetDateFormat));

  return () => h(QDialog, { ref: dialogRef }, () => [
    h(QCard, { style: "width: 700px; max-width: 80vw;" }, () => [

      h(QCardSection, { 'class': "text-h6" }, () => "Create log"),

      h(QForm, { onSubmit: () => onDialogOK({
          logName: logName.value,
          logType: logType.value,
          logDate: formatRFC3339(date.extractDate(logDate.value, widgetDateFormat)),
          logStatus: logStatus.value,
        }) }, () => [

          h(QCardSection, {}, () => [

            h('div', { 'class': "q-gutter-md row items-start"}, [

              h(QSelect, {
                label: 'Log Type',
                'emit-value': true,
                modelValue: logType.value,
                'onUpdate:modelValue': (value) => { logType.value = value; },
                options: props.logTypes.map(logType => ({
                  label: logType.attributes.label,
                  value: logType.attributes.drupal_internal__id,
                })),
                'class': "col-8",
              }),

              h(QToggle, {
                label: `Status: ${logStatus.value}`,
                'false-value': "pending",
                'true-value': "done",
                modelValue: logStatus.value,
                'onUpdate:modelValue': (value) => { logStatus.value = value; },
              }),

            ]),

            h(QInput, {
              dense: true,
              autofocus: true,
              type: 'text',
              label: 'Name',
              'class': "q-my-md",
              modelValue: logName.value,
              'onUpdate:modelValue': (value) => { logName.value = value; },
              rules: [
                (val) => (val && val.length > 0) || 'Please enter a log name',
              ],
            }),

            h(QInput, {
              readonly: true,
              filled: true,
              modelValue: logDate.value,
            }, {
              prepend: () => h(QIcon, { name: 'mdi-calendar-outline', 'class': 'cursor-pointer' }, () => 
                h(QPopupProxy, { cover: true, 'transition-show': "scale", 'transition-hide': "scale" }, () => 
                  h(QDate, { modelValue: logDate.value, 'onUpdate:modelValue': (value) => { logDate.value = value; }, mask: widgetDateFormat }, () => 
                    h('div', { 'class': "row items-center justify-end" }, () => 
                      h(QBtn, { 'v-close-popup': true, label: 'Close', color: 'primary', flat: true })
                    )
                  )
                )
              ),
              append: () => h(QIcon, { name: 'mdi-clock-outline', 'class': 'cursor-pointer' }, () => 
                h(QPopupProxy, { cover: true, 'transition-show': "scale", 'transition-hide': "scale" }, () => 
                  h(QTime, { modelValue: logDate.value, 'onUpdate:modelValue': (value) => { logDate.value = value; }, mask: widgetDateFormat, format24h: true }, () => 
                    h('div', { 'class': "row items-center justify-end" }, () => 
                      h(QBtn, { 'v-close-popup': true, label: 'Close', color: 'primary', flat: true })
                    )
                  )
                )
              ),
            }),

          ]),
  
          h(QCardActions, { align: 'right' }, () => [
            h(QBtn, { flat: true, label: 'Cancel', color: 'secondary', onClick: () => onDialogCancel(), 'v-close-popup': true }),
            h(QBtn, { flat: true, label: 'Create', color: 'primary', type: "submit", disable: !logName.value || !logType.value || !logStatus.value }),
          ]),

      ]),

    ]),
  ]);
});
GenericCreateLogDialog.props = ['logTypes'];

const createLogClicked = async () => {
  const logTypes = await assetLink.getLogTypes();

  const params = await assetLink.ui.dialog.custom(GenericCreateLogDialog, { logTypes });

  if (!params) {
    return;
  }

  const log = {
    type: `log--${params.logType}`,
    attributes: {
      name: params.logName,
      timestamp: params.logDate,
      status: params.logStatus,
    },
  };

  await assetLink.entitySource.update(
      (t) => t.addRecord(log),
      {label: log.attributes.name});
};
</script>

<template alink-route[net.symbioquine.farmos_asset_link.routes.v0.tasks_page]="/tasks">
  <q-page padding class="text-left">
    <h4 class="q-mb-md q-mt-xs">Tasks</h4>
    <q-tree
      ref="tree"
      node-key="id"
      :nodes="nodes"
      v-model:expanded="expandedKeys"
      :selected="null"
      @update:selected="(nodeKey) => logClicked(nodeKey)"
      default-expand-all
    >
      <template v-slot:default-header="prop">
        <div class="row items-center">
          <template v-if="prop.node.isCategory">
          <q-icon :name="prop.node.icon" size="28px" class="q-mr-sm" />
          <div class="text-weight-bold text-primary">{{ prop.node.label }}</div>
          </template>
          <template v-else>
            <entity-name :entity="prop.node.log"></entity-name>
          </template>
        </div>
      </template>

      <template v-slot:default-body="prop">
        <div v-if="prop.node.isCategory && !prop.node.children.length">
          <span class="text-weight-light text-black q-ml-xl">No logs found</span>
        </div>
      </template>

    </q-tree>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="mdi-plus" color="primary" @click="createLogClicked" />
    </q-page-sticky>

  </q-page>
</template>

<script>
import { h } from 'vue';
import { QBtn } from 'quasar';

export default {
  onLoad(handle, assetLink) {
    handle.defineSlot('net.symbioquine.farmos_asset_link.tb_item.v0.tasks', slot => {
      slot.type('toolbar-item');

      slot.showIf(({ asset }) => true);

      slot.weight(25);

      slot.component(() => h(QBtn, { flat: true, dense: true, icon: "mdi-order-bool-ascending-variant", to: '/tasks' }));
    });
  }
}
</script>

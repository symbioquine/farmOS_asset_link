<script setup>
import { inject, ref, onMounted } from 'vue';
import { useDialogPluginComponent } from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits
]);

const props = defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const assetLink = inject('assetLink');

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const parents = ref([]);
const children = ref([]);

const treeNodes = ref([
  {
    id: 'parents',
    nodeType: 'rootParent',
    label: 'Parents',
    children: [],
  },
  {
    id: 'children',
    nodeType: 'rootChild',
    label: 'Children',
    children: [],
  },
]);

const expandedNodes = ref(['parents', 'children']);

const assetTypes = ref(null);

const resolveParents = async (ofAsset, entitySource) => {
  const results = await entitySource.query(q => q.findRelatedRecords({ type: ofAsset.type, id: ofAsset.id }, 'parent'));

  return results.map(asset => {
    return {
      type: asset.type,
      id: asset.id,
      nodeType: 'parent',
      asset,
      lazy: true,
    };
  });
}

const resolveChildren = async (ofAsset, entitySource) => {
  const results = await entitySource.query(q => assetTypes.value.map(assetType => {
    return q.findRecords(`asset--${assetType}`)
      .filter({
        relation: 'parent.id',
        op: 'some',
        records: [{ type: ofAsset.type, id: ofAsset.id }]
      })
      .sort('-created');
  }));

  return results.flatMap(l => l).map(asset => {
    return {
      type: asset.type,
      id: asset.id,
      nodeType: 'child',
      asset,
      lazy: true,
    };
  });
};

const onLazyLoad = async ({ node, key, done, fail }) => {
  let loaderFn = () => [];
  if (node.nodeType === 'parent') {
    loaderFn = resolveParents;
  } else if (node.nodeType === 'child') {
    loaderFn = resolveChildren;
  }

  const nodeChildren = await loaderFn(node, assetLink.entitySource.cache);

  done(nodeChildren);

  node.children = await loaderFn(node, assetLink.entitySource);
};

onMounted(async () => {
  await assetLink.booted;

  assetTypes.value = (await assetLink.getAssetTypes()).map(t => t.attributes.drupal_internal__id);

  treeNodes.value[0].children = await resolveParents(props.asset, assetLink.entitySource.cache);
  treeNodes.value[1].children = await resolveChildren(props.asset, assetLink.entitySource.cache);

  treeNodes.value[0].children = await resolveParents(props.asset, assetLink.entitySource);
  treeNodes.value[1].children = await resolveChildren(props.asset, assetLink.entitySource);
});
</script>

<template>
  <q-dialog ref="dialogRef">
    <q-card class="q-dialog-plugin q-gutter-md" style="width: 700px; max-width: 80vw;">
      <h4 class="q-mb-sm">Hierarchy</h4>

      <q-tree
        :nodes="treeNodes"
        v-model:expanded="expandedNodes"
        default-expand-all
        node-key="id"
        @lazy-load="onLazyLoad"
      >
        <template v-slot:default-header="{ node }">
          <entity-name v-if="node.nodeType === 'child' || node.nodeType === 'parent'" :entity="node.asset"></entity-name>
          <div v-else>{{ node.label }}</div>
        </template>
        <template v-slot:default-body="{ node }">
          <span v-if="!node.children || node.children.length === 0" class="text-weight-light q-ml-lg">
            <span v-if="node.nodeType === 'rootChild' || node.nodeType === 'child'">No known children</span>
            <span v-if="node.nodeType === 'rootParent' || node.nodeType === 'parent'">No known parents</span>
          </span>
        </template>
      </q-tree>

    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'

export default {
  onLoad(handle, assetLink) {
    handle.defineWidgetDecorator('net.symbioquine.farmos_asset_link.widget_decorator.v0.hierarchy', widgetDecorator => {
      widgetDecorator.targetWidgetName('asset-page-title');

      widgetDecorator.appliesIf(context => true);

      const WidgetDecoratorComponent = defineComponent({
        props: {
          asset: { type: Object, required: true },
        },
        methods: {
          showHierarchyDialog() {
            assetLink.ui.dialog.custom(handle.thisPlugin, { asset: this.asset });
          }
        },
        template: `
          <span><q-btn flat round color="grey-7" icon="mdi-family-tree" @click="() => showHierarchyDialog()" /> <slot></slot></span>
        `
      });

      widgetDecorator.component(WidgetDecoratorComponent);
    });
  }
}
</script>

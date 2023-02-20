<script setup>
import { computed, inject, ref, watch } from 'vue';
import { throttle } from 'assetlink-plugin-api';

const assetLink = inject('assetLink');

const props = defineProps({
  log: {
    type: Object,
    required: true,
  },
});

const text = ref(props.log.attributes.notes?.value || '');
const hint = ref('');
const isSavingNotes = ref(false);

const updateNotes = async () => {
  isSavingNotes.value = true;
  const res = await assetLink.entitySource.update((t) => {
    return t.updateRecord({
      type: props.log.type,
      id: props.log.id,
      attributes: {
        notes: {
          value: text.value,
        },
      },
    });
  }, {label: `Save notes text: ${props.log.attributes.name}`});
  hint.value = assetLink.connectionStatus.isOnline.value ? "saved" : "saved locally";
  isSavingNotes.value = false;
};

watch(text, (val) => updateNotes());

const shouldAutogrow = computed(() => (text.value.match(/\n/g) || []).length > 5);
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.slots.v0.log_notes]="page-slot(weight: 50, showIf: 'pageName == `log-page`')">
  <div class="q-mt-md">
    <q-input
      label="Notes"
      :hint="hint"
      v-model="text"
      filled
      debounce="1000"
      :loading="isSavingNotes"
      :autogrow="shouldAutogrow"
      type="textarea"
      :rows="5"
    />
  </div>
</template>

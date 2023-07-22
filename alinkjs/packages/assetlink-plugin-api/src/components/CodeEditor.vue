<script setup>
import { onMounted, ref } from "vue";

import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/display/fullscreen.css";
import "codemirror/theme/blackboard.css";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/vue/vue.js";
import "codemirror/addon/display/fullscreen.js";

const editor = ref(null);
const lastSize = ref(null);

const props = defineProps({
  modelValue: { type: String, required: true },
  codeMimetype: { type: String, required: true },
});
const emit = defineEmits(["update:modelValue"]);

let cm = null;

onMounted(() => {
  cm = CodeMirror(editor.value, {
    value: props.modelValue,
    theme: "blackboard",
    mode: props.codeMimetype,
    lineNumbers: true,
    fixedGutter: false,
  });

  cm.on("changes", () => {
    emit("update:modelValue", cm.getValue());
  });

  // Sometimes the resize handler fires now so set the size to the most recent value
  if (lastSize.value) {
    cm.setSize(lastSize.value.width, lastSize.value.height);
  }

  // Ugly hack!
  setTimeout(() => cm.refresh(), 1000);
});

const onResize = (size) => {
  lastSize.value = size;
  cm && cm.setSize(size.width, size.height);
};
</script>

<template>
  <div class="full-height">
    <div ref="editor"></div>
    <q-resize-observer @resize="onResize" />
  </div>
</template>

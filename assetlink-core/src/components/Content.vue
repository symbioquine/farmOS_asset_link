<template>
  <div><span style="color: red;">{{ title }}</span><q-btn>Hi</q-btn></div>
</template>
<script>
import { QBtn } from 'quasar';

export default {
  components: {
    QBtn,
  },
  data() {
    return {
      title: "Remote Component in Action..",
    };
  },
};
</script>
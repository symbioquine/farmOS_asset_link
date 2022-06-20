<template>
  <q-btn @click="count++">Count is: {{ count }}</q-btn>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  }
}
</script>

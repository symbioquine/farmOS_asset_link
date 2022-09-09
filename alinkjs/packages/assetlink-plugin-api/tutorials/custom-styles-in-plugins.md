Vue plugins can also provide custom styles for themselves or the rest of Asset Link.

For example we can write a plugin that turns the toolbar blue;

**MakeHeaderBlue.alink.vue**

```vue
<style>
  #app .q-header .q-toolbar {
    background: #00F !important;
  }
</style>

```

We can also use Vue's scoped style support to ensure styles only apply to our plugin's component;

**RotatingPony.alink.vue**

```vue
<template alink-slot[com.example.farmos_asset_link.tb_item.v0.rotating_pony]="toolbar-item(weight: 15)">
  <q-btn flat padding="xs" icon="mdi-horse"></q-btn>
</template>

<style scoped>
.q-btn {
  animation-name: spin;
  animation-duration: 5000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear; 
}

@keyframes spin {
  from {
    transform:rotate(0deg);
  }
  to {
    transform:rotate(360deg);
  }
}
</style>

```

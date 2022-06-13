<template>
  <v-navigation-drawer
    v-model="drawer"
    absolute
    temporary
  >
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>Sync Status</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-divider></v-divider>

    <v-list dense v-if="assetLink.viewModel.pendingUpdates.length > 0">
      <v-list-item
        v-for='pendingUpdate in assetLink.viewModel.pendingUpdates'
        :key='pendingUpdate.data.id'
        link
      >
        <v-list-item-content>
          <v-list-item-title>{{ pendingUpdate.data.options.label }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-list v-else>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title><i>Nothing to synchronize...</i></v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  inject: ['assetLink'],
  data: () => ({
    drawer: null,
  }),
  methods: {
    toggle() {
      this.drawer = !this.drawer;
    }
  },
};
</script>

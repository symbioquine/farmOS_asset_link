<template>
  <div data-vuetify style="width: 100vw; height: 100vh; position: fixed; top: 0px; left: 0px;"><v-app>

    <farmos-sync-tray ref="syncTray"></farmos-sync-tray>

    <v-app-bar
      color="green darken-2"
      dense
      app
    >
      <v-toolbar-title>Asset Link</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon
          @click.stop="$refs.syncTray.toggle()">
        <farmos-sync-icon></farmos-sync-icon>
      </v-btn>

      <v-menu bottom left v-if="configActionDefs.length">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-cog</v-icon>
          </v-btn>
        </template>

        <v-list>
          <template v-for="configActionDef in configActionDefs">
            <render-fn-wrapper :key="configActionDef.id" :render-fn="configActionDef.componentFn"></render-fn-wrapper>
          </template>
        </v-list>
      </v-menu>

      <v-btn icon @click="assetSearchDialogMode = 'text-search'">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon @click="assetSearchDialogMode = 'scan-qr-code'">
        <v-icon>mdi-qrcode-scan</v-icon>
      </v-btn>

      <v-menu bottom left v-if="metaActionDefs.length">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <template v-for="metaActionDef in metaActionDefs">
            <render-fn-wrapper :key="metaActionDef.id" :render-fn="metaActionDef.componentFn"></render-fn-wrapper>
          </template>
        </v-list>
      </v-menu>

    </v-app-bar>

    <v-main v-if="assetLink.viewModel.booted">
      <v-container fluid>
        <router-view @expose-meta-actions="metaActionDefs = $event"></router-view>
      </v-container>
    </v-main>
      
    <v-alert
      v-model="message.dismissed"
      border="left"
      close-text="Close Alert"
      dismissible
      v-for="message in assetLink.viewModel.messages" :key="message.id"
      :type="message.type"
      class="mx-4"
    >
      {{ message.text }}
    </v-alert>

    <div v-for="dialogDef in dialogs" :key="dialogDef.id">
      <dialog-wrapper :dialog-def="dialogDef"></dialog-wrapper>
    </div>

    <v-dialog
      v-model="assetSearchDialogShown"
      @input="assetSearchDialogMode = undefined"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <asset-selector v-if="assetSearchDialogMode"
        title="Find Asset"
        confirm-label="View asset(s)"
        :search-method="assetSearchDialogMode"
        @submit="onAssetSelected($event)"
      ></asset-selector>
    </v-dialog>

    <v-overlay :value="assetLink.viewModel.bootProgress < 100" color="#E0E0E0" :opacity="1">
      <v-container>
        <v-row class="py-4">
          <v-spacer></v-spacer>
          <v-col>
            <v-progress-circular
              :value="assetLink.viewModel.bootProgress"
              color="#2E7D32"
              :rotate="-90"
              :size="100"
              :width="10"
            >
            {{ assetLink.viewModel.bootProgress }}%
            </v-progress-circular>
          </v-col>
          <v-spacer></v-spacer>
        </v-row>
        <v-row class="py-4">
          <v-col>
            <div>{{ assetLink.viewModel.bootText }}</div>
          </v-col>
        </v-row>
      </v-container>
    </v-overlay>

  </v-app></div>
</template>

<script>
import Vue from 'vue';

import AssetLink from '@/AssetLink';
import NonReactiveAssetLinkDecorator from '@/NonReactiveAssetLinkDecorator';
import RenderFnWrapper from '@/components/render-fn-wrapper';

import { VAlert } from 'vuetify/lib'

const DialogWrapper = Vue.component('dialog-wrapper', {
  props: {
    dialogDef: { type: Object, required: true },
  },
  provide() {
    return {
      'dialogContext': this.dialogDef.context,
    };
  },
  render(h) {
    return this.dialogDef.componentFn(this, h);
  },
});

export default {
  components: {
    VAlert,
    DialogWrapper,
  },
  provide() {
    return {
      'app': this,
      'assetLink': this.assetLink,
    };
  },
  data() {
    return {
      assetLink: NonReactiveAssetLinkDecorator.decorate(new AssetLink(this)),

      metaActionDefs: [],
      dialogs: [],

      assetSearchDialogShown: false,
      assetSearchDialogMode: undefined,
    };
  },
  watch: {
    assetSearchDialogMode(m) {
      this.assetSearchDialogShown = !!m;
    },
  },
  methods: {
    onAssetSelected(selectedAssets) {
      console.log("onAssetSelected", selectedAssets);
      this.assetSearchDialogMode = undefined;
      if (selectedAssets === undefined) {
        return;
      }
      if (selectedAssets.length === 1) {
        this.$router.push(`/asset/${selectedAssets[0].attributes.drupal_internal__id}`);
      }
      // TODO: Implement multi-asset page
    },
    async addRoute(routeDef) {
      const currentRoute = this.$route.name;
      const currentRoutePath = this.$route.path;

      console.log(this.$route);

      this.$router.addRoute({
        name: routeDef.name,
        path: routeDef.path,
        component: RenderFnWrapper,
        props: { renderFn: routeDef.componentFn, debounceId: routeDef.debounceId },
      });

      if (currentRoute === routeDef.name) {
        await this.$router.replace('/');
        await this.$router.replace(currentRoutePath);
      }

      console.log(this.$route);
    },
    /* eslint-disable no-console,no-unused-vars */
    removeRoute(routeDef) {
      // TODO: Implement
    },
  },
  computed: {
    configActionDefs() {
      if (!this.assetLink.viewModel.booted) {
        return [];
      }

      return this.assetLink.getSlots({ type: 'config-action', route: this.$route });
    },
  },
  created () {
    this.assetLink.boot();
  },
}
</script>

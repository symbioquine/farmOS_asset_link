<template>
  <v-app>
    <q-page-sticky position="right" :offset="[18, 0]">
      <q-btn round color="accent" icon="arrow_upward" class="rotate-90" />
    </q-page-sticky>
  </v-app>
</template>

<script>
// import AssetLinkIcon from "@/icons/asset-link.svg";
import createDrupalUrl from '@/createDrupalUrl';

import AssetLink from '@/AssetLink';
import NonReactiveAssetLinkDecorator from '@/NonReactiveAssetLinkDecorator';

export default {
  components: {
    // AssetLinkIcon,
  },
  inject: ['devToolsApi'],
  data() {
    return {
      // assetLink: NonReactiveAssetLinkDecorator.decorate(new AssetLink(this, this.devToolsApi)),
    };
  },
  computed: {
    assetLinkUrl() {
      const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);

      console.log(matches);

      if (!matches || matches.length < 2) {
        return undefined;
      }

      const assetDrupalInternalId = matches[1];

      return createDrupalUrl(`/alink/asset/${assetDrupalInternalId}`).toString();
    },
  },
  created () {
    // this.assetLink.boot();
  },
}
</script>

<template>
  <q-layout>
    <q-page-sticky position="right" :offset="[18, 0]">
      <q-fab color="purple" icon="keyboard_arrow_up" direction="up">
        <q-fab-action color="primary" @click="onClick" icon="mail" />
        <q-fab-action color="secondary" @click="onClick" icon="alarm" />
      </q-fab>
    </q-page-sticky>
  </q-layout>
</template>

<script>
// import AssetLinkIcon from "@/icons/asset-link.svg";
// import createDrupalUrl from '@/createDrupalUrl';

// import AssetLink from '@/AssetLink';
// import NonReactiveAssetLinkDecorator from '@/NonReactiveAssetLinkDecorator';

export default {
  components: {
    // AssetLinkIcon,
  },
  inject: ["devToolsApi"],
  data() {
    return {
      // assetLink: NonReactiveAssetLinkDecorator.decorate(new AssetLink(this, this.devToolsApi)),
    };
  },
  computed: {
    // assetLinkUrl() {
    //   const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);
    //
    //   console.log(matches);
    //
    //   if (!matches || matches.length < 2) {
    //     return undefined;
    //   }
    //
    //   const assetDrupalInternalId = matches[1];
    //
    //   return createDrupalUrl(`/alink/asset/${assetDrupalInternalId}`).toString();
    // },
  },
  created() {
    // this.assetLink.boot();
  },
};
</script>

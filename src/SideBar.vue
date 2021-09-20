<template>
  <div class="farm-asset-link-side-bar d-flex flex-column">
      <b-button :href='assetLinkUrl'>
        <LinkBoxVariantOutlineIcon title="Open this asset in Asset Link" class="orange-icon"></LinkBoxVariantOutlineIcon>
      </b-button>
  </div>
</template>

<script>
import LinkBoxVariantOutlineIcon from 'vue-material-design-icons/LinkBoxVariantOutline.vue';

export default {
    components: {
      LinkBoxVariantOutlineIcon,
    },
    data() {
      const assetIdMatch = /\/asset\/(\d+)/.exec(window.location.pathname);

      return {
        assetLinkUrl: `${window.drupalSettings.path.baseUrl}alink/asset/${assetIdMatch[1]}`,
      };
    },
}
</script>

<style scoped>
.farm-asset-link-side-bar {
  position: fixed;
  top: 50vh;
  right: 0px;
  background-color: rgba(125, 125, 125, 0.5);
  padding: 10px 5px 10px 10px;
  border-radius: 5px 0px 0px 5px;
}

.farm-asset-link-side-bar .btn {
  padding: 3px;
}

.farm-asset-link-side-bar .orange-icon svg path {
  color: #fd7e14;
  fill: #fd7e14;
}

.material-design-icon > .material-design-icon__svg {
  height: 2.5em;
  width: 2.5em;
}
</style>
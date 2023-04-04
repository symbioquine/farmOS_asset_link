<script setup>
import { computed, inject } from 'vue';
import { useRouter } from 'vue-router'

const router = useRouter();

const props = defineProps({
  searchRequest: {
    type: Object,
    default: undefined,
  },
});

const matchedRoute = computed(() => {
  const term = props.searchRequest?.term || '';

  const matches = term.match(/https?:\/\/.*\/alink(\/.*)/);

  if (!matches || matches.length < 2) {
    return undefined;
  }

  return router.resolve(matches[1]);
});
</script>

<template alink-slot[net.symbioquine.farmos_asset_link.promoted_search_slot.v0.route_match]="asset-search-promoted-result">
  <div class="q-ml-lg q-mb-md" v-if="matchedRoute?.matched?.length">
    <q-item clickable v-ripple v-for="routeMatch in matchedRoute.matched" :key="routeMatch.path" :to="matchedRoute.fullPath">
      <q-item-section avatar class="q-mr-none">
        <q-icon color="primary" name="mdi-arrow-decision-outline" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ routeMatch.path }}</q-item-label>
        <q-item-label caption lines="2">{{ routeMatch.name }}</q-item-label>
      </q-item-section>
    </q-item>
  </div>
</template>

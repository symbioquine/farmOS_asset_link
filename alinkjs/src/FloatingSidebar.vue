<template>
  <v-app>
    <v-navigation-drawer stateless permanent floating fixed right
        color="transparent" :width="'300px'">
        <v-container fill-height fluid>
          <v-row align="center">
              <v-col>

              <v-container>
                <v-row>
                  <v-col class="d-flex align-end flex-column">

                    <v-speed-dial open-on-hover direction="left" left>
                      <template v-slot:activator>
                        <v-btn fab color="orange darken-5"
                            :loading="assetLink.viewModel.bootProgress < 100">
                          <template v-slot:loader>
                            <v-progress-circular
                              :rotate="-90"
                              :size="100"
                              :width="15"
                              :value="assetLink.viewModel.bootProgress"
                              color="yellow darken-2">
                                <AssetLinkIcon/>
                            </v-progress-circular>
                          </template>
                          <AssetLinkIcon/>
                        </v-btn>
                      </template>
                      <v-btn fab dark :href="assetLinkUrl">
                        <v-icon>mdi-arrow-right-bold-hexagon-outline</v-icon>
                      </v-btn>
                    </v-speed-dial>

                  </v-col>
                </v-row>
              </v-container>

              </v-col>
          </v-row>
        </v-container>
    </v-navigation-drawer>
  </v-app>
</template>

<script>
import AssetLinkIcon from "@/icons/asset-link.svg";
import createDrupalUrl from '@/createDrupalUrl';

import AssetLink from '@/AssetLink';

export default {
  components: {
    AssetLinkIcon,
  },
  data() {
    return {
      assetLink: new AssetLink(this),

      isOnline: window.navigator.onLine,
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
    window.addEventListener('offline', () => this.isOnline = false);
    window.addEventListener('online', () => this.isOnline = true);

    this.assetLink.boot();
  },
}
</script>

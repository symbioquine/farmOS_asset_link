import { h, ref, watch, watchEffect } from 'vue';
import {
  QBtn,
  QCheckbox,
  QItem,
  QItemLabel,
  QItemSection,
  QToggle,
} from 'quasar';
import { currentEpochSecond, parseJSONDate, uuidv4 } from "assetlink-plugin-api";

const vModel = (model) => ({
  modelValue: model.value,
  'onUpdate:modelValue': (value) => { model.value = value; },
});


export default class DefaultPrecacher {
  static async onLoad(handle, assetLink) {
    await assetLink.booted;

    const precachingEnabledKey = 'asset-link-precaching-enabled';

    const precachingEnabled = ref(await assetLink.store.getItem(precachingEnabledKey) || false);

    watch(precachingEnabled, async () => {
      await assetLink.store.setItem(precachingEnabledKey, precachingEnabled.value);
    });

    watchEffect(() => {
      if (assetLink.connectionStatus.isOnline.value) {
        DefaultPrecacher.precache(assetLink, precachingEnabled.value);
      }
    });

    handle.defineSlot('net.symbioquine.farmos_asset_link.conf_actions.v0.precaching_toggle', slot => {
      slot.type('config-action');

      slot.component(() => {

        return h(QItem, () => [
          h(QItemSection, {}, () => [
            h(QItemLabel, { class: 'q-mx-none' }, () => "Precaching"),
          ]),
          h(QItemSection, { top: true, side: true }, () => [
            h('div', { class: "text-grey-8 q-gutter-xs" }, [
              h(QToggle, {
                ...vModel(precachingEnabled),
                class: 'q-mx-none',
              }),
              // TODO: Consider adding settings about how often/much to precache
              // h(QBtn, { flat: true, dense: true, round: true, icon: 'mdi-cog' }),
            ]),
          ]),
        ])
      });
    });
  }

  static async precache(assetLink, precachingEnabled) {
    const precachingEventGroup = assetLink.devToolsApi.startTimelineEventGroup({
      data: {},
      title: `precaching`,
      groupId: `precaching-${uuidv4()}`,
    });

    try {

      // Precache the current page's asset
      //
      // Note that we do this even if precaching is disabled in general because this
      // is what allows Asset Link to work offline if a farmOS asset page is loaded
      // before going offline.
      const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);
      if (matches && matches.length >= 2) {
        await assetLink.resolveEntity('asset', matches[1]);
      }

      // TODO: Do the same thing as above, but for logs

      if (!precachingEnabled) {
        return;
      }

      const timestamp = currentEpochSecond();

      const lastPrecacheTimeKey = `asset-link-last-precache-time`;

      const lastPrecacheTime = await assetLink.store.getItem(lastPrecacheTimeKey);

      if (lastPrecacheTime && (timestamp - lastPrecacheTime) < 900) {
        console.log("Skipping Asset Link precaching because it was done recently...");
        return;
      }

      // Precache recently changed assets
      const assetTypes = (await assetLink.getAssetTypes()).map(t => 'asset--' + t.attributes.drupal_internal__id);
      const logTypes = (await assetLink.getLogTypes()).map(t => 'log--' + t.attributes.drupal_internal__id);

      const entityTypes = [
        ...assetTypes,
        ...logTypes,
      ];

      const changedResults = await assetLink.entitySource.query((q) => entityTypes.map(entityType => {
        return q.findRecords(entityType)
          .sort('-changed')
          .page({ offset: 0, limit: 1 })
          .options({ fields: { [entityType]: 'changed'} });
      }), {
        forceRemote: true,
        parallelRequests: true,
        priority: 10,
      });

      const getLastModifiedTimeCacheKey = (entityType) => `asset-link-precache-last-modified-time:${entityType}`;

      const precacheQueryFns = (await Promise.all(changedResults.flatMap(r => r).map(async (entity) => {
        const lastModifiedTimeByEntityType = parseJSONDate(await assetLink.store.getItem(getLastModifiedTimeCacheKey(entity.type)));

        const serverLastChanged = parseJSONDate(entity.attributes.changed);

        if (serverLastChanged <= lastModifiedTimeByEntityType) {
          return [];
        }

        const model = assetLink.getEntityModelSync(entity.type);

        const include = Object.keys(model.relationships);

        return [
          q => {
            let qFn = q.findRecords(entity.type)
            if (!isNaN(lastModifiedTimeByEntityType)) {
              qFn.filter({ attribute: 'changed', op: '>=', value: parseInt(lastModifiedTimeByEntityType.getTime() / 1000) });
            }
            return qFn
              .sort('-changed')
              .page({ offset: 0, limit: 100 })
              .options({ include });
          },
        ]
      }))).flatMap(fn => fn);

      // Maybe no entities have changed so we have no query functions to run
      if (precacheQueryFns.length) {

        const precacheResults = await assetLink.entitySource.query(
          (q) => precacheQueryFns.map(qFn => qFn(q)),
          {
            forceRemote: true,
            parallelRequests: false,
            priority: 10,
            sources: {
              remote: {
                settings: {
                  timeout: 60000
                }
              }
            }
          }
        );

        // Save the latest 'changed' timestamp for each entity type
        // so we can query less data next time
        await Promise.all(precacheResults.map(async (precacheResultList) => {
          if (!precacheResultList?.length) {
            return;
          }

          const latestResultEntity = precacheResultList[0];

          await assetLink.store.setItem(getLastModifiedTimeCacheKey(latestResultEntity.type), latestResultEntity.attributes.changed);
        }));

      }

      // TODO: Consider also precaching recently changed and recent/upcoming logs (even if they haven't changed recently)

      await assetLink.store.setItem(lastPrecacheTimeKey, timestamp);
    } finally {
      precachingEventGroup.end();
    }
  }

}

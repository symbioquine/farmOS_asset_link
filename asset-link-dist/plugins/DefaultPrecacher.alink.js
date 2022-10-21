import { currentEpochSecond, uuidv4 } from "assetlink-plugin-api";


export default class DefaultPrecacher {
  static async onLoad(handle, assetLink) {
    await assetLink.booted;

    if (assetLink.connectionStatus.isOnline.value) {
      DefaultPrecacher.precache(assetLink);
    }

  }

  static async precache(assetLink) {
    const precachingEventGroup = assetLink.devToolsApi.startTimelineEventGroup({
      data: {},
      title: `precaching`,
      groupId: `precaching-${uuidv4()}`,
    });

    try {

      // Precache the current page's asset
      const matches = window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);
      if (matches && matches.length >= 2) {
        await assetLink.resolveEntity('asset', matches[1]);
      }

      const timestamp = currentEpochSecond();

      const lastPrecacheTimeKey = `asset-link-last-precache-time`;

      const lastPrecacheTime = await assetLink.store.getItem(lastPrecacheTimeKey);

      if (lastPrecacheTime && (timestamp - lastPrecacheTime) < 900) {
        console.log("Skipping Asset Link precaching because it was done recently...");
        return;
      }

      // Precache recently changed assets
      const assetTypes = (await assetLink.getAssetTypes()).map(t => t.attributes.drupal_internal__id);

      await assetLink.entitySource.query((q) => assetTypes.map(assetType => {
        const entityType = `asset--${assetType}`;

        const model = assetLink.getEntityModelSync(entityType);

        const include = Object.keys(model.relationships);

        return q.findRecords(entityType)
          .sort('-changed')
          .page({ offset: 0, limit: 100 })
          .options({ include });
      }), {
        parallelRequests: false,
        priority: 10,
      });

      // TODO: Consider also precaching recently changed and recent/upcoming logs

      await assetLink.store.setItem(lastPrecacheTimeKey, timestamp);

    } finally {
      precachingEventGroup.end();
    }
  }

}

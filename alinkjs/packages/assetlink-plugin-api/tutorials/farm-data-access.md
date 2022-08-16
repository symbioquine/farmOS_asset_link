Plugins in Asset Link have access to the full farmOS data model via the [farmOS/Drupal JSON:API](https://farmos.org/development/api/).

This access is mediated by a library called [Orbit.js](https://orbitjs.com/). Asset Link exposes [Orbit.js sources](https://orbitjs.com/docs/data-sources)
via the [Asset Link API](IAssetLink.html). The most common use-cases will use `assetLink.entitySource` which first queries the in-memory data - followed
by the farmOS server if the app is online at the time.

```js
await assetLink.entitySource.query(q => q
  .findRecords(`asset--equipment`)
  .filter({ attribute: 'name', op: 'CONTAINS', value: 'slow' }));
```

That fallback logic - first querying the in memory data followed by the farmOS server - sounds ideal, but often we are happy with just using the in-memory data
and prefer that offline-first behavior from a performance standpoint. In that case we can explicitly query `assetLink.entitySource.cache` followed by
`assetLink.entitySource`.

```js
const offlineResults = await assetLink.entitySource.cache.query(q => q
  .findRecords(`asset--equipment`)
  .filter({ attribute: 'name', op: 'CONTAINS', value: 'slow' }));

// Do something with the offline results right away

if (assetLink.connectionStatus.isOnline) {
  const onlineResults = await assetLink.entitySource.query(q => q
    .findRecords(`asset--equipment`)
    .filter({ attribute: 'name', op: 'CONTAINS', value: 'slow' }));

  // Update the UI with more up-to-date data if/when it becomes available
}
```

Asset Link also provides some convenience methods that handle common cases like loading an asset by ID. For example, see [IAssetLink#resolveAsset](IAssetLink.html#resolveAsset).

```js
const asset = await assetLink.resolveAsset(42);

console.log(asset.attributes.name);
```

Modifying farmOS data occurs via Orbit.js as well, but is a little simpler. Asset Link takes care of synchronizing changes with the server the next time
the app is online. Queries of farmOS data that occur before the changes are synchronized will use the local versions of the farmOS assets/logs/etc which
include the unsynchronized changes.

```js
await assetLink.entitySource.update((t) => {
  return t.updateRecord({
    type: asset.type,
    id: asset.id,
    attributes: {
      name: "Fred",
    },
  });
}, {label: `Rename asset: "${asset.attributes.name}" to "Fred"`});

const updatedAsset = await assetLink.resolveAsset(asset.id);

// updatedAsset.attributes.name === 'Fred'
```

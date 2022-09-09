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

Asset Link also provides some convenience methods that handle common cases like loading an entity by type and ID. For example, see [IAssetLink#resolveEntity](IAssetLink.html#resolveEntity).

```js
const asset = await assetLink.resolveEntity('asset', 42);

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

const updatedAsset = await assetLink.resolveEntity('asset', asset.id);

// updatedAsset.attributes.name === 'Fred'
```

Files can be uploaded as part of modifying asset/log relationships by specifying a '$upload' directive (key) along with the standard `type` and `id` properties:

```js
const fileDataUrl = 'data:image/gif;base64,R0lGODlhyAAyAKEAAAAAAP///wAAAAAAACH5BAEKAAIALAAAAADIADIAAAL+jI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuC8fyTNf2jef6zvf+DwwKh8Si8YhMKpfMpvMJjUp5gOr0mqpqO9qurgvAgscQsIecM1/Hakeb866hhVtK/FE/e3HsYV5y1xIYwxYWtDcxuKL4YhWAWJZYYdjAuGAJhwdJ42hZSInwySAa+glauTk690jWd4lYyFKnqPZWm2oKmhuByWqbm+rrKBxcMkw7bAD5J5zQFtdbyuyGi7aqvDmdpRucneedDM0cfUB+t3q+nLwY3q3u/A4/rq5NXf86LZ4Pu84u30/s1D+A0tb9uqcK4UAF+vrdInhinzZX+IoRW1jOYkLeiAyrzZPYiaMJkAIDeqSYERg3hR1ZpnQIDuYWjSNVljTVEqXNdi4LltwosGFQnIIIIkP58uDPikuBJjp5Kh1Rdj8xXRu4UmTSSRZ5yjQIFVvPDxCvfS2V0ycgmjmXeh368auhq8Y4HkwrFq9YrXubMk2oFuNWwXRHILzbMiU+wRkZ8yr2RypYkoEjHn4W9+U/rNI4P50YOazPqPTGXoiFdc+u0YFWp266U7UoUibDEEVKFvdU2qzt4k7qO/bc2ahr136LJbny5cybO38OPbr06dSrW7+OPbv27dy7GygAADs='

await assetLink.entitySource.update((t) =>
  t.addToRelatedRecords({ type: asset.type, id: asset.id }, 'image', {
      type: "file--file",
      // Placeholder UUID gets replaced by '$upload' directive below so the resulting 'file--file'
      // entity will have a different ID once the file/relationship gets saved to the server
      // Until https://www.drupal.org/project/drupal/issues/3021155 gets fixed anyway
      id: uuidv4(),
      '$upload': {
        fileName,
        fileDataUrl,
      },
  })
, {label: `Add photo to asset: "${asset.attributes.name}"`});
```

Similarly, files can be uploaded as part of asset/log (entity) creation/updates:

```js
await assetLink.entitySource.update((t) => {
  return t.updateRecord({
    type: asset.type,
    id: asset.id,
    attributes: {
      name: "Fred",
    },
    relationships: {
      image: {
        data: [
          {
            type: "file--file",
            id: uuidv4(),
            '$upload': {
              fileName,
              fileDataUrl,
            },
          }
        ]
      }
    }
  });
}, {label: `Rename asset: "${asset.attributes.name}" to "Fred" and replace images with a single new one`});
```

/**
 * Returns results from a 'local' async iterator until a 'remote' one starts
 * returning results then only returns results from the 'remote' one after that.
 * @private
 */
export default class RacingLocalRemoteAsyncIterator {
  constructor(localDelegate, remoteDelegate) {
    this._localDelegate = localDelegate;
    this._remoteDelegate = remoteDelegate;
    this._firstRemoteItemPromise = remoteDelegate.next();
    this._localDone = false;
    this._remoteReady = false;
  }

  async next() {
    if (this._remoteReady) {
      return await this._remoteDelegate.next();
    }

    const s = await promiseState(this._firstRemoteItemPromise);

    if (s === "fulfilled" || this._localDone) {
      this._remoteReady = true;
      return await this._firstRemoteItemPromise;
    }

    const localItem = await this._localDelegate.next();

    if (localItem.done) {
      this._localDone = true;
    }
    localItem.done = false;
    return localItem;
  }
}

// From https://stackoverflow.com/a/35820220/1864479
function promiseState(p) {
  const t = {};
  return Promise.race([p, t]).then(
    (v) => (v === t ? "pending" : "fulfilled"),
    () => "rejected"
  );
}

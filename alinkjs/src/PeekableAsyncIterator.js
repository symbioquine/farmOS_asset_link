export default class PeekableAsyncIterator {
  constructor(delegate) {
    this._delegate = delegate;
    this._next_iteration_result = undefined;
  }

  async next() {
    if (this._next_iteration_result !== undefined) {
      const next = this._next_iteration_result;
      this._next_iteration_result = undefined;
      return next;
    }
    return await this._delegate.next();
  }

  async peek() {
    if (this._next_iteration_result === undefined) {
      this._next_iteration_result = await this._delegate.next();
    }
    return this._next_iteration_result;
  }

}

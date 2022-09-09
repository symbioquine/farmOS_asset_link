import { Queryable, Updatable } from '@orbit/data';

/**
 * Decorator for a Orbit.js Source which blocks queries/updates while a barrier is active.
 */
export default class BarrierAwareOrbitSourceDecorator {
  constructor(delegate, barrier) {
    this._delegate = delegate;
    this._barrier = barrier;
  }

  get cache() {
    return this._delegate.cache;
  }

  async query(queryOrExpressions, options, id) {
    const passedBarrier = await this._barrier.arrive(500);
    if (!passedBarrier) {
      throw new Exception("Could not execute query - barrier was closed for >500ms");
    }
    return await this._delegate.query(queryOrExpressions, options, id);
  }

  async update(transformOrOperations, options, id) {
    const passedBarrier = await this._barrier.arrive(500);
    if (!passedBarrier) {
      throw new Exception("Could not execute update - barrier was closed for >500ms");
    }
    return await this._delegate.update(transformOrOperations, options, id);
  }
}

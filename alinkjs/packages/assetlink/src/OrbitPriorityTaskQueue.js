/*
 * Based on https://github.com/orbitjs/orbit/blob/fd40512ee3b0b622f737786e03928186938f454a/packages/%2540orbit/core/src/task-queue.ts
 */
import {
  Bucket,
  evented,
  Evented,
  settleInSeries,
  Task,
  TaskProcessor,
  Performer
} from "@orbit/core";

import PriorityQueue from 'priorityqueuejs';

/**
 * `TaskQueue` is a FIFO queue of asynchronous tasks that should be
 * performed sequentially.
 *
 * Tasks are added to the queue with `push`. Each task will be processed by
 * calling its `process` method.
 *
 * By default, task queues will be processed automatically, as soon as tasks
 * are pushed to them. This can be overridden by setting the `autoProcess`
 * setting to `false` and calling `process` when you'd like to start
 * processing.
 */
@evented
export default class OrbitPriorityTaskQueue {

  /**
   * Creates an instance of `OrbitPriorityTaskQueue`.
   */
  constructor(target, settings) {
    settings = settings || {};

    this.autoProcess =
      settings.autoProcess === undefined ? true : settings.autoProcess;

    this._performer = target;
    this._name = settings.name;
    this._bucket = settings.bucket;

    // this._tasks: Task<Type, Data, Options>[] = [];
    // this._processors: TaskProcessor<Type, Data, Options, Result>[] = [];

    this._initializeTaskQueue();

    this._error = undefined;
    this._resolution = undefined;
    this._resolve = () => undefined;
    this._reject = (e) => undefined;
    this._reified = undefined;

    if (this._bucket && !this._name) {
      throw Error('OrbitPriorityTaskQueue requires a name if it has a bucket');
    }

    const autoActivate =
      settings.autoActivate === undefined || settings.autoActivate;

    if (autoActivate) {
      this.activate();
    } else {
      this._reify();
    }
  }

  async activate() {
    await this._reify();

    if (this.length > 0 && this.autoProcess) {
      this.process();
    }
  }

  /**
   * Name used for tracking / debugging this queue.
   */
  get name() {
    return this._name;
  }

  /**
   * The object which will `perform` the tasks in this queue.
   */
  get performer() {
    return this._performer;
  }

  /**
   * A bucket used to persist the state of this queue.
   */
  get bucket() {
    return this._bucket;
  }

  /**
   * The number of tasks in the queue.
   */
  get length() {
    return this._taskQueue.size();
  }

  /**
   * The tasks in the queue.
   */
  get entries() {
    const tasks = [];
    this._taskQueue.forEach(j => tasks.push(j.task));
    return tasks;
  }

  /**
   * The current task being processed (if actively processing), or the next
   * task to be processed (if not actively processing).
   */
  get current() {
    if (this._taskQueue.isEmpty()) {
      return undefined;
    }
    return this._taskQueue.peek().task;
  }

  /**
   * The processor wrapper that is processing the current task (or next task,
   * if none are being processed).
   */
  get currentProcessor() {
    if (this._taskQueue.isEmpty()) {
      return undefined;
    }
    return this._taskQueue.peek().processor;
  }

  /**
   * If an error occurs while processing a task, processing will be halted, the
   * `fail` event will be emitted, and this property will reflect the error
   * encountered.
   */
  get error() {
    return this._error;
  }

  /**
   * Is the queue empty?
   */
  get empty() {
    return this._taskQueue.isEmpty();
  }

  /**
   * Is the queue actively processing a task?
   */
  get processing() {
    const processor = this.currentProcessor;

    return processor !== undefined && processor.started && !processor.settled;
  }

  /**
   * Resolves when the queue has been fully reified from its associated bucket,
   * if applicable.
   */
  get reified() {
    return this._reified;
  }

  /**
   * Push a new task onto the end of the queue.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   *
   * Returns the result of processing the pushed task.
   */
  async push(task) {
    await this._reified;

    const processor = new TaskProcessor(this._performer, task);
    this._taskQueue.enq({ task, processor });
    await this._persist();
    if (this.autoProcess) this._settle();
    return processor.settle();
  }

  /**
   * Cancels and re-tries processing the current task.
   *
   * Returns the result of the retried task.
   */
  async retry() {
    await this._reified;

    this._cancel();
    let processor = this.currentProcessor;
    processor.reset();
    await this._persist();
    this._settle();
    return processor.settle();
  }

  /**
   * Cancels and discards the current task.
   *
   * If `autoProcess` is enabled, this will automatically trigger processing of
   * the queue.
   */
  async skip(e) {
    await this._reified;

    this._cancel();

    const job = this._taskQueue.isEmpty() ? undefined : this._taskQueue.deq();

    const processor = job?.processor;

    if (processor !== undefined && !processor.settled) {
      processor.reject(
        e || new Error('Processing cancelled via `OrbitPriorityTaskQueue#skip`')
      );
    }
    await this._persist();
    if (this.autoProcess) this._settle();
  }

  /**
   * Cancels the current task and completely clears the queue.
   */
  async clear(e) {
    await this._reified;

    this._cancel();
    
    while(!this._taskQueue.isEmpty()) {
      const { processor } = this._taskQueue.deq();
      if (!processor.settled) {
        processor.reject(
          e || new Error('Processing cancelled via `OrbitPriorityTaskQueue#clear`')
        );
      }
    }

    await this._persist();
    await this._settle();
  }

  /**
   * Cancels the current task and removes it, but does not continue processing.
   *
   * Returns the canceled and removed task.
   */
  async shift(e) {
    await this._reified;

    const job = this._taskQueue.isEmpty() ? undefined : this._taskQueue.deq();

    const task = job?.task;
    const processor = job?.processor;

    if (task) {
      this._cancel();
      if (processor !== undefined && !processor.settled) {
        processor.reject(
          e || new Error('Processing cancelled via `OrbitPriorityTaskQueue#shift`')
        );
      }
      await this._persist();
    }
    return task;
  }

  /**
   * Cancels processing the current task and inserts a new task at the beginning
   * of the queue. This new task will be processed next.
   *
   * Returns the result of processing the new task.
   */
  async unshift(task) {
    await this._reified;

    let processor = new TaskProcessor(
      this._performer,
      task
    );
    this._cancel();
    this._taskQueue.enq({ task, processor });
    await this._persist();
    if (this.autoProcess) this._settle();
    return processor.settle();
  }

  /**
   * Processes all the tasks in the queue. Resolves when the queue is empty.
   */
  async process() {
    await this._reified;

    let resolution = this._resolution;
    if (!resolution) {
      if (this._taskQueue.isEmpty()) {
        resolution = this._complete();
      } else {
        this._error = undefined;
        this._resolution = resolution = new Promise((resolve, reject) => {
          this._resolve = resolve;
          this._reject = reject;
        });
        await this._settleEach(resolution);
      }
    }
    return resolution;
  }

  async _settle() {
    try {
      await this.process();
    } catch (e) {}
  }

  async _complete() {
    if (this._resolve) {
      this._resolve();
    }
    this._resolve = undefined;
    this._reject = undefined;
    this._error = undefined;
    this._resolution = undefined;
    await settleInSeries(this, 'complete');
  }

  async _fail(task, e) {
    if (this._reject) {
      this._reject(e);
    }
    this._resolve = undefined;
    this._reject = undefined;
    this._error = e;
    this._resolution = undefined;
    await settleInSeries(this, 'fail', task, e);
  }

  _cancel() {
    this._error = undefined;
    this._resolution = undefined;
  }

  async _settleEach(resolution) {
    if (this._taskQueue.isEmpty()) {
      return this._complete();
    } else {
      const { task, processor } = this._taskQueue.peek();

      try {
        await settleInSeries(this, 'beforeTask', task);
        await processor.process();
        if (resolution === this._resolution) {
          this._taskQueue.deq();

          await this._persist();
          await settleInSeries(this, 'task', task);
          await this._settleEach(resolution);
        }
      } catch (e) {
        if (resolution === this._resolution) {
          return this._fail(task, e);
        }
      }
    }
  }

  _initializeTaskQueue() {
    this._taskQueue = new PriorityQueue(function(a, b) {
      return (a.task?.data?.options?.priority || 0) - (b.task?.data?.options?.priority || 0);
    });
  }

  _reify() {
    this._initializeTaskQueue();

    this._reified = this._loadTasksFromBucket().then(
      (tasks) => {
        if (tasks) {
          tasks
            .forEach((task) => this._taskQueue.enq({ task, processor: new TaskProcessor(this._performer, task) }));
        }
      }
    );

    return this._reified;
  }

  async _loadTasksFromBucket() {
    if (this._bucket && this._name) {
      return this._bucket.getItem(this._name);
    }
  }

  async _persist() {
    this.emit('change');
    if (this._bucket && this._name) {
      await this._bucket.setItem(this._name, this.entries);
    }
  }
}

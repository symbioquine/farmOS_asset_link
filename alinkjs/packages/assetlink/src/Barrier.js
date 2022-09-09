function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

export default class Barrier {
  constructor(isRaised) {
    this.isRaised = isRaised || false;
    this.waiting = [];
  }

  /**
   * Wait for the barrier to release or the timeout - whichever occurs first.
   * 
   * @returns true if the barrier was released (or is raised) or false if a timeout occurs.
   */
  arrive(timeoutMillis) {
    if (!this.isRaised) {
      return Promise.resolve(true);
    }
    return Promise.race([
      sleep(timeoutMillis).then(() => false),
      new Promise(resolve => this.waiting.push(resolve)).then(() => true),
    ]);
  }

  raise() {
    this.isRaised = true;
  }

  lower() {
    this.isRaised = false;
    this.release();
  }

  release() {
    const toBeReleased = this.waiting.splice(0);
    toBeReleased.forEach(p => p());
  }
}

/**
 * A simple async event bus.
 * 
 * The Vue 3 framework recommended event buses - https://github.com/developit/mitt https://github.com/scottcorgan/tiny-emitter
 * do not support async handlers well.
 */
export default class EventBus {

  constructor() {
    this._handlersByEventNameAndSubscriptionKey = {};
    this._nextSubscriptionSerial = 0;
  }

  /**
   * Subscribe to the named event with a given handler.
   * @return an object which a single no-arg method `$off()` that is used to remove the subscription.
   */
  $on(eventName, handler) {
    if (!Object.hasOwn(this._handlersByEventNameAndSubscriptionKey, eventName)) {
      this._handlersByEventNameAndSubscriptionKey[eventName] = {};
    }

    const subscriptionKey = `evtsub-${this._nextSubscriptionSerial++}`;

    this._handlersByEventNameAndSubscriptionKey[eventName][subscriptionKey] = handler;

    return new EventBusUnsubscriber(this._handlersByEventNameAndSubscriptionKey, eventName, subscriptionKey);
  }

  /**
   * Subscribe to the next firing of the named event with a given handler.
   * @return an object which a single no-arg method `$off()` that is used to remove the subscription.
   */
  $once(eventName, handler) {
    const unsubscriber = this.$on(eventName, (arg) => {
      unsubscriber.$off();
      return handler(arg);
    });
    return unsubscriber;
  }

  /**
   * Emit a named event.
   * @return a promise which resolves once all the handlers have been called
   */
  async $emit(eventName, arg) {
    const handlers = Object.values(this._handlersByEventNameAndSubscriptionKey[eventName] || {});

    const promises = handlers.map(h => h(arg));

    return Promise.all(promises).then(() => true);
  }

}

class EventBusUnsubscriber {
  constructor(handlersByEventNameAndSubscriptionKey, eventName, subscriptionKey) {
    this._handlersByEventNameAndSubscriptionKey = handlersByEventNameAndSubscriptionKey;
    this._eventName = eventName;
    this._subscriptionKey = subscriptionKey;
  }

  /**
   * Remove a previously created event handler subscription.
   */
  $off() {
    if (this._handlersByEventNameAndSubscriptionKey[this._eventName]) {
      delete this._handlersByEventNameAndSubscriptionKey[this._eventName][this._subscriptionKey];
    }
    if (Object.keys(this._handlersByEventNameAndSubscriptionKey[this._eventName]).length === 0) {
      delete this._handlersByEventNameAndSubscriptionKey[this._eventName];
    }
  }
}

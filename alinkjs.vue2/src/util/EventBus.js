/**
 * A simple async event bus.
 */
export default class EventBus {

  constructor() {
    this._handlersByEventName = {};
  }

  $on(eventName, handler) {
    if (!Object.hasOwn(this._handlersByEventName, eventName)) {
      this._handlersByEventName[eventName] = [];
    }

    this._handlersByEventName[eventName].push(handler);
  }

  async $emit(eventName, arg) {
    const handlers = this._handlersByEventName[eventName] || [];

    const promises = handlers.map(h => h(arg));

    return Promise.all(promises).then(() => true);
  }

}

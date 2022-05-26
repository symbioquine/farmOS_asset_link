import WebSocketClient from 'webpack-dev-server/client/clients/WebSocketClient';

/** 
 * Decorator for the normal Webpack dev server WebsocketClient which
 * accepts the extra message type and allows Asset Link to know when
 * the core plugins require reloading in a development context.
 */
export default class PluginReloadingWebSocketClient extends WebSocketClient {
  constructor(url) {
    super(url);
  }

  onMessage(handler) {
    const decorator = (data) => {
      const message = JSON.parse(data);

      if (message.type === 'asset-link-plugin-changed') {
        const pluginChangedEvent = new CustomEvent('asset-link-plugin-changed', {
          detail: {
            pluginUrl: message.data,
          },
        });

        window.dispatchEvent(pluginChangedEvent);

        return;
      }
      handler(data);
    };
    super.onMessage(decorator);
  }
}

import { setupDevtoolsPlugin } from '@vue/devtools-api';

const timelineLayerId = 'asset-link-dev-tools-timeline';

class AssetLinkDevToolsWrapper {
  constructor(api) {
    this._api = api;
  }

  startTimelineEventGroup(opts) {
    const startTime = performance.now();

    const record = (titlePrefix, endTime) => {
      if (!this._api) {
        return;
      }

      const timelineEventOpts = {
        layerId: timelineLayerId,
        event: {
          time: this._api.now(),
          ...opts,
        }
      };

      timelineEventOpts.event.title = `${titlePrefix} ${opts.title}`;
      if (endTime) {
        const duration = endTime - startTime;
        timelineEventOpts.event.data.duration = {"_custom": {type: "Duration", value: duration, display: `${duration} ms`}};
      }

      this._api.addTimelineEvent(timelineEventOpts);
    };

    record('Start');

    return {
      end() {
        record('End', performance.now());
      },
    };
  }

}

export default ({ app }) => {
  if (process.env.NODE_ENV === 'development' || __VUE_PROD_DEVTOOLS__) {
    setupDevtoolsPlugin({
      id: 'asset-link-devtools-plugin',
      enableEarlyProxy: true,
      app,
    }, api => {
      app.provide('devToolsApi', new AssetLinkDevToolsWrapper(api));

      api.addTimelineLayer({
        id: timelineLayerId,
        color: 0xff984f,
        label: 'Asset Link'
      });

    });
  } else {
    app.provide('devToolsApi', new AssetLinkDevToolsWrapper(null));
  }
};

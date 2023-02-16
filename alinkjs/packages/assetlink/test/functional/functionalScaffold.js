import { Response } from 'cross-fetch';

import FDBFactory from 'fake-indexeddb/lib/FDBFactory';

import { uuidv4 } from "assetlink-plugin-api";

import models from '../models.json';

export const FARM_URL = new URL("https://farm.example.com:1234/farmos");

export const fetchDelegate = async (url, opts) => {
    const u = new URL(url);

    if (u.pathname.endsWith('/api')) {
      const loggedInMinimalApiResponse = JSON.stringify({
        meta: {
          farm: {
            version: "2.0.0",
          },
          links: {
            me: {
              href: `${FARM_URL}/api/user/user/97299b1f-6271-4505-b4b4-2b50d36ff616`,
            },
          },
        },
      });

      return new Response(loggedInMinimalApiResponse, {
        status: 200,
        statusText: 'OK',
      });
    }

    if (u.pathname.endsWith('/alink/backend/default-plugins.repo.json')) {
      const emptyPluginListJson = JSON.stringify({
        "plugins": []
      });

      return new Response(emptyPluginListJson, {
        status: 200,
        statusText: 'OK',
      });
    }

    if (u.pathname.endsWith('/api/asset_type/asset_type')) {
      return new Response(JSON.stringify({
          data: Object.keys(models).filter(mk => mk.startsWith('asset--')).map(assetType => {

            const assetTypeName = logType.split('--')[1];
            const assetTypeId = uuidv4();
            const capitalizedAssetTypeName = assetTypeName[0].toUpperCase() + assetTypeName.slice(1);
            return {
              "type": "asset_type--asset_type",
              "id": assetTypeId,
              "links": {
                "self": {
                  "href": `${FARM_URL}/api/asset_type/asset_type/${assetTypeId}`,
                }
              },
              "attributes": {
                "langcode": "en",
                "status": true,
                "dependencies": {
                  "enforced": {
                    "module": [
                      `farm_${assetTypeName}`
                    ]
                  }
                },
                "drupal_internal__id": assetTypeName,
                "label": capitalizedAssetTypeName,
                "description": "",
                "workflow": "asset_default",
                "new_revision": true
              }
            };
          }),
      }), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-type': 'application/vnd.api+json',
        }
      });
    }

    if (u.pathname.endsWith('/api/log_type/log_type')) {
      return new Response(JSON.stringify({
          data: Object.keys(models).filter(mk => mk.startsWith('log--')).map(logType => {

            const logTypeName = logType.split('--')[1];
            const logTypeId = uuidv4();
            const capitalizedLogTypeName = logTypeName[0].toUpperCase() + logTypeName.slice(1);
            return {
              "type": "log_type--log_type",
              "id": logTypeId,
              "links": {
                "self": {
                  "href": `${FARM_URL}/api/log_type/log_type/${logTypeId}`,
                }
              },
              "attributes": {
                "langcode": "en",
                "status": true,
                "dependencies": {
                  "enforced": {
                    "module": [
                      `farm_${logTypeName}`
                    ]
                  }
                },
                "drupal_internal__id": logTypeName,
                "label": capitalizedLogTypeName,
                "description": "",
                "name_pattern": `${capitalizedLogTypeName} log [log:id]`,
                "workflow": "log_default",
                "new_revision": true
              }
            };
          }),
      }), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-type': 'application/vnd.api+json',
        }
      });
    }

    throw new Error("Unmocked fetch request: " + u.toString() + " - " + JSON.stringify(opts));
};

export const delay = time => new Promise(res => setTimeout(res, time));

export const initDefaults = () => {
    const rootComponent = {};

    const devToolsApi = {
        startTimelineEventGroup: jest.fn(() => ({ end: jest.fn() })),
    };

    const isOnline = jest.fn(() => true);

    Object.defineProperty(window.navigator, 'onLine', {
      get: isOnline,
    });

    window.indexedDB = new FDBFactory();
  
    jsdom.reconfigure({ url: FARM_URL.toString() });

    window.assetLinkDrupalBasePath = FARM_URL.pathname;

    const fetch = jest.fn(fetchDelegate);

    return {
        rootComponent,
        devToolsApi,
        isOnline,
        fetch,
    };
};


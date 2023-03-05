import fetch, { Response } from 'cross-fetch';
import { createDrupalUrl, getDrupalBasePath, uuidv4 } from "assetlink-plugin-api";

const DEFAULT_FETCHER_DELEGATE = { fetch };

//https://git.drupalcode.org/project/subrequests/-/blob/18b0d853f839f46a1bbed7cc7e2a3fd7b9820c46/src/Normalizer/JsonSubrequestDenormalizer.php#L96-117
const ACTION_BY_HTTP_VERB = {
  POST: 'create',
  PATCH: 'update',
  PUT: 'replace',
  DELETE: 'delete',
  HEAD: 'exists',
  OPTIONS: 'discover',
};

/**
 * Responsible for grouping similar and temporally adjacent requests using Drupal's
 * subrequests functionality.
 * 
 * @implements {IHttpFetcher}
 */
export default class SubrequestsGroupingRequestFetcher {

  constructor(opts) {
    const options = opts || {};
    this._groupingWindowMillis = options.groupingWindowMillis || 5;
    this.fetcherDelegate = options.fetcherDelegate || DEFAULT_FETCHER_DELEGATE;

    this._queuedGetRequests = [];
    this._fallbackMode = false;
  }

  /**
   * Decorate fetch requests to group similar and temporally adjacent requests using Drupal's
   * subrequests functionality.
   */
  async fetch(url, opts) {
    const options = opts || {};

    if (!options.method) options.method = 'GET';

    const farmOSBasePath = getDrupalBasePath();

    const requestUrl = createDrupalUrl(url);

    const isFarmOSRequest = requestUrl.host === window.location.host && requestUrl.pathname.startsWith(farmOSBasePath);

    // For now just handle farmOS GET requests via subrequests
    if (!isFarmOSRequest || options.method !== 'GET' || this._fallbackMode) {
      return this.fetcherDelegate.fetch(url, options);
    }

    if (this._queuedGetRequests.length > 0) {
      return new Promise((resolve, reject) => {
        this._queuedGetRequests.push({ id: uuidv4(), url, options, resolve, reject });
      });
    }

    const owningRequestPromise = new Promise((resolve, reject) => {
      this._queuedGetRequests.push({ id: uuidv4(), url, options, resolve, reject });
    });

    await sleep(this._groupingWindowMillis);

    const queuedGetRequests = this._queuedGetRequests.splice(0);

    // Don't bother with using subrequests if there's only one queued
    if (queuedGetRequests.length === 1) {
      return this.fetcherDelegate.fetch(url, options);
    }

    const maxRequestGroupSize = 10;
    for (let i = 0; i < queuedGetRequests.length; i += maxRequestGroupSize) {
      const chunkOfQueuedRequests = queuedGetRequests.slice(i, i + maxRequestGroupSize);

      this._makeDrupalSubrequests(chunkOfQueuedRequests);
    }

    return owningRequestPromise;
  }

  async _makeDrupalSubrequests(requests) {
    const requestsById = {};
    requests.forEach(r => requestsById[r.id] = r);

    const subrequestBlueprint = requests.map(request => {
      return {
        requestId: request.id,
        uri: request.url,
        action: ACTION_BY_HTTP_VERB[request.options.method] || 'view',
        headers: request.options.headers || {},
        // TODO: Figure out sending request body
        body: request.options.body ? JSON.stringify(request.options.body) : undefined,
      };
    });

    let subrequestsRes = undefined;
    try {
      subrequestsRes = await this.fetcherDelegate.fetch(createDrupalUrl('/subrequests?_format=json'), {
        method: 'POST',
        body: JSON.stringify(subrequestBlueprint),
        headers: {
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
      });
    } catch (err) {
      requests.forEach(r => r.reject(err));
      return;
    }

    // A 403 or 404 from subrequests suggests that it either isn't installed
    // or we aren't allowed to access it. In this case switch to fallback mode
    // for future requests and resubmit our requests as separate fetch calls.
    if ([403, 404].includes(subrequestsRes.status)) {
      this._fallbackMode = true;
      requests.forEach(request => {
        request.resolve(this.fetcherDelegate.fetch(request.url, request.options));
      });
      return;
    }

    const subrequestsData = await subrequestsRes.json();

    const responses = Object.keys(subrequestsData)
      .forEach(requestId => {
        const res = subrequestsData[requestId];

        requestsById[requestId].resolve(new Response(res.body, {
          status: res.headers.status,
          // TODO
          statusText: 'unknown',
          headers: res.headers,
        }));
      });
  }

}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

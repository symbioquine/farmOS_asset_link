import axios from 'axios';

const httpParser = require('http-string-parser');

function createUrl(pathSuffix) {
  return new URL(pathSuffix, window.location.origin + window.drupalSettings.path.baseUrl);
}

export default class BaseAssetResolver {

  /* eslint-disable class-methods-use-this */
  async tryResolveAsset(assetRef) {
    const assetTypesReq = await axios.get(createUrl('/api/asset_type/asset_type'), {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
    });

    const assetTypes = assetTypesReq.data.data.map(t => t.attributes.drupal_internal__id);

    let filterQueryString = `filter[id]=${assetRef}`;
    if (/^-?\d+$/.test(assetRef)) {
      filterQueryString = `filter[drupal_internal__id]=${assetRef}`;
    }

    const requests = assetTypes.map(assetType => ({
      uri: `/api/asset/${assetType}?${filterQueryString}`,
      action: 'view',
    }));

    const subrequestsResponse = await axios.post(createUrl('/subrequests'), requests, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
    });

    const responseContentType = subrequestsResponse.headers['content-type'];

    /* eslint-disable max-len */
    // "multipart/related; boundary=\"8383a756e8a86e35ba01a717624ed634\"; type=application/vnd.api+json"
    const boundaryMatch = /boundary="([^"]+)";/.exec(responseContentType);

    const boundary = `--${boundaryMatch[1]}`;

    // Vaguely based on:
    // https://github.com/DanielJDufour/simple-multipart/blob/e83b2ea3114201ed231abefcd458eb5a39c34c53/parse.js#L41-L45
    const lineBreak = '(?:\r?\n)';

    const requestsPattern = `(?<=${boundary} ?${lineBreak})(?<content>[\\s\\S]+?)(?= ?${lineBreak}${boundary})`;

    const rawResponseMatches = Array.from(subrequestsResponse.data.matchAll(new RegExp(requestsPattern, 'gm')));

    const responses = rawResponseMatches
      .map(m => httpParser.parseResponse(m.groups.content))
      .map(r => ({
        data: JSON.parse(r.body),
        status: r.headers.Status,
        headers: r.headers,
      }));

    // TODO: Check that all responses were successful

    const assets = responses.flatMap(r => r.data.data);

    return assets.find(a => a);
  }

}

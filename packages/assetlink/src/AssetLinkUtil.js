import { formatRFC3339 } from 'date-fns'
import createDrupalUrl from 'assetlink/utils/createDrupalUrl';
import geohash from 'ngeohash';
import haversine from 'haversine-distance';

export default class AssetLinkUtil {

  /**
   * Format a date object as an RFC 3339 date string. e.g. '2019-09-18T19:00:52Z'
   */
  get formatRFC3339() {
    return formatRFC3339;
  }

  /**
   * Create a URL relative to the Drupal installation base path given the URL path suffix.
   */
  get createDrupalUrl() {
    return createDrupalUrl;
  }

  /**
   * The node-geohash module: https://github.com/sunng87/node-geohash
   */
  get geohash() {
    return geohash;
  }

  /**
   * A haversine distance function: https://github.com/dcousens/haversine-distance
   */
  get haversine() {
    return haversine;
  }

  /**
   * Roughly implements the same convention encoded in
   * https://github.com/farmOS/farmOS/blob/04bf771d91cde8276b67090d2b97c4e4558332b9/modules/core/log/farm_log.module#L74-L88
   */
  summarizeAssetNames(assets) {
    if (assets.length <= 3) {
      return assets.map(a => a.attributes.name).join(", ");
    }
    return `${assets[0].attributes.name} (+${assets.length - 1} more)`;
  }

}

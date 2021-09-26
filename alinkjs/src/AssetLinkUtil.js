import { formatRFC3339 } from 'date-fns'
import createDrupalUrl from '@/createDrupalUrl';
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

}

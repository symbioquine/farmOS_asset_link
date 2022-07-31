/**
 * Interface for a class that implements the {fetch} function interface
 * potentially managing some state around those http requests - such as
 * caching CSRF tokens or aggregating requests into batches.
 * 
 * @interface
 */
export default class IHttpFetcher {
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/API/fetch
   */
  async fetch(url, opts) {
    
  }
}

export default class HttpAccessDeniedException extends Error {
  constructor(message, options) {
    super(message, options);
  }
}

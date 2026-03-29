export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }

  static badRequest(msg) {
    return new ApiError(400, msg);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Not found') {
    return new ApiError(404, msg);
  }

  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg);
  }
}

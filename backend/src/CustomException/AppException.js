export class AppException extends Error {
  constructor(statusCode, code, message) {
    super(message);

    this.name = "AppException";
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace?.(this, AppException);
  }

  static fromFail(fail) {
    return new AppException(
      fail.httpStatusCode,
      fail.code,
      fail.message
    );
  }
}
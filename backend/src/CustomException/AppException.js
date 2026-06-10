class AppException extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);

    this.name = 'AppException';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

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

module.exports = AppException;
module.exports.AppException = AppException;

const AppException = require('../CustomException/AppException');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const isSafeError = error instanceof AppException || error.statusCode;
  const statusCode = isSafeError ? error.statusCode : 500;
  const code = isSafeError ? error.code : 'INTERNAL_ERROR';
  const message = statusCode >= 500 ? 'Internal server error.' : error.message;

  if (statusCode >= 500) {
    console.error('[api error]', {
      code,
      method: req.method,
      path: req.path,
    });
  }

  const payload = {
    error: {
      code,
      message,
    },
  };

  if (statusCode < 500 && error.details) {
    payload.error.details = error.details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = errorHandler;

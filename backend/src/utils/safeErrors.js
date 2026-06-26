const AppException = require('../CustomException/AppException');

function badRequest(code, message, details) {
  return new AppException(400, code, message, details);
}

function unauthorized(code = 'UNAUTHORIZED', message = 'Authentication is required.') {
  return new AppException(401, code, message);
}

function forbidden(code = 'FORBIDDEN', message = 'You are not allowed to perform this action.') {
  return new AppException(403, code, message);
}

function notFound(code = 'NOT_FOUND', message = 'Resource not found.') {
  return new AppException(404, code, message);
}

function conflict(code, message, details) {
  return new AppException(409, code, message, details);
}

function tooManyRequests(code, message) {
  return new AppException(429, code, message);
}

function internal(code = 'INTERNAL_ERROR', message = 'Internal server error.') {
  return new AppException(500, code, message);
}

module.exports = {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internal,
};

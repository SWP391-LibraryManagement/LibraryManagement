const { defaultAuthService } = require('../services/authService');
const errors = require('../utils/safeErrors');

function createAuthenticate(authService = defaultAuthService) {
  return async function authenticate(req, res, next) {
    try {
      const authorization = req.headers.authorization || '';
      const [scheme, token] = authorization.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw errors.unauthorized();
      }

      req.user = await authService.authenticateToken(token);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

const authenticate = createAuthenticate();

module.exports = {
  authenticate,
  createAuthenticate,
};

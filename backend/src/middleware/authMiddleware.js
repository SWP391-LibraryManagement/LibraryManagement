const { defaultAuthService } = require('../services/authService');
const errors = require('../utils/safeErrors');

function createAuthenticate(authService = defaultAuthService) {
  return async function authenticate(req, res, next) {
    try {
      // @spec FR-FE02-008, FR-FE02-009
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

function requireAnyRole(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toUpperCase());

  return function authorizeRole(req, res, next) {
    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles.map((role) => String(role).toUpperCase())
      : [];

    if (!normalizedAllowedRoles.some((role) => roles.includes(role))) {
      return next(errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.'));
    }

    return next();
  };
}

module.exports = {
  authenticate,
  createAuthenticate,
  requireAnyRole,
};

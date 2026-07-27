const { defaultAuthService } = require('../services/authService');
const errors = require('../utils/safeErrors');

function createAuthenticate(authService = defaultAuthService) {
  return async function authenticate(req, res, next) {
    try {
      // @spec FR-FE02-008, FR-FE02-009
      const authorization = String(req.headers.authorization || '').trim();
      const match = /^Bearer\s+(\S+)$/i.exec(authorization);
      const token = match?.[1];

      if (!token) {
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

// @spec FR-FE07-032
// @spec FR-FE08-030
function requireMemberOnly(req, res, next) {
  const roles = Array.isArray(req.user?.roles)
    ? req.user.roles.map((role) => String(role).toUpperCase())
    : [];
  const isStaff = roles.includes('LIBRARIAN') || roles.includes('ADMIN');

  if (!roles.includes('MEMBER') || isStaff) {
    return next(errors.forbidden('ROLE_REQUIRED', 'Only non-staff members can perform this action.'));
  }

  return next();
}

module.exports = {
  authenticate,
  createAuthenticate,
  requireAnyRole,
  requireMemberOnly,
};

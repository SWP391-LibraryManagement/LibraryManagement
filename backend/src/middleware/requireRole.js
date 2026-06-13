const errors = require('../utils/safeErrors');

function requireRole(roleName) {
  return function requireRoleMiddleware(req, res, next) {
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];

    if (!roles.includes(roleName)) {
      return next(errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.'));
    }

    return next();
  };
}

module.exports = {
  requireRole,
};

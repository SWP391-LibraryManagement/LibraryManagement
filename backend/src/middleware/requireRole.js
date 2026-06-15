const errors = require('../utils/safeErrors');

function requireRole(roleName) {
  return function requireRoleMiddleware(req, res, next) {
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const requiredRole = String(roleName || '').toUpperCase();
    const normalizedRoles = roles.map((role) => String(role || '').toUpperCase());

    if (!normalizedRoles.includes(requiredRole)) {
      return next(errors.forbidden('ADMIN_REQUIRED', 'Admin access is required.'));
    }

    return next();
  };
}

module.exports = {
  requireRole,
};

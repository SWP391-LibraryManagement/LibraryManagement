const errors = require('./safeErrors');

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function toPositiveInteger(value, fieldName) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw errors.badRequest('INVALID_ID', `${fieldName} must be a positive integer.`);
  }

  return numberValue;
}

module.exports = {
  normalizeRole,
  hasAnyRole,
  toPositiveInteger,
};

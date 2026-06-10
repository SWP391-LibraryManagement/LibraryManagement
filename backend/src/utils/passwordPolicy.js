const bcrypt = require('bcrypt');
const env = require('../config/env');

function validatePasswordPolicy(password) {
  const errors = [];

  if (typeof password !== 'string') {
    errors.push('Password is required.');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (password.length > 255) {
    errors.push('Password must be at most 255 characters long.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number.');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least 1 special character.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptCost);
}

async function verifyPassword(password, passwordHash) {
  if (!passwordHash) {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
};

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const errors = require('./safeErrors');

function generateRandomToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getJwtSecret() {
  try {
    return env.requiredEnv('JWT_SECRET');
  } catch (error) {
    throw errors.internal('AUTH_CONFIG_ERROR', 'Authentication configuration is incomplete.');
  }
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.userId),
      email: user.email,
      username: user.username,
      roles: user.roles || [],
    },
    getJwtSecret(),
    {
      expiresIn: env.accessTokenTtlSeconds,
    }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw errors.unauthorized('INVALID_TOKEN', 'Invalid or expired authentication token.');
  }
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

module.exports = {
  generateRandomToken,
  hashToken,
  signAccessToken,
  verifyAccessToken,
  addMinutes,
  addHours,
  addDays,
};

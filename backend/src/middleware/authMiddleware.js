const { verifyAccessToken } = require('../utils/tokenUtils');
const errors = require('../utils/safeErrors');

function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw errors.unauthorized();
    }

    const payload = verifyAccessToken(token);

    req.user = {
      userId: Number(payload.sub),
      email: payload.email,
      username: payload.username,
      roles: payload.roles || [],
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authenticate,
};

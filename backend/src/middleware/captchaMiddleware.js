const errors = require('../utils/safeErrors');
const { verifyCaptcha } = require('../utils/captchaUtils');

function createCaptchaValidator({ required = process.env.NODE_ENV !== 'test' } = {}) {
  return (req, _res, next) => {
    // @spec FR-FE02-029
    if (!required || verifyCaptcha(req.body?.captchaToken, req.body?.captchaAnswer)) return next();
    return next(errors.badRequest('CAPTCHA_INVALID', 'Captcha is invalid or expired.'));
  };
}

module.exports = { createCaptchaValidator };

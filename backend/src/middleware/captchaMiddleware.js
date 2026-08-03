const errors = require('../utils/safeErrors');

function createCaptchaValidator(captchaService) {
  return (req, _res, next) => {
    // @spec FR-FE02-029, FR-FE02-030
    if (captchaService.verifyChallenge(
      req.body?.captchaToken,
      req.body?.captchaAnswer
    )) return next();
    return next(errors.badRequest('CAPTCHA_INVALID', 'Captcha is invalid or expired.'));
  };
}

module.exports = { createCaptchaValidator };

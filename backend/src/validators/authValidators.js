const { body, validationResult } = require('express-validator');
const errors = require('../utils/safeErrors');

function handleValidationErrors(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(
    errors.badRequest(
      'VALIDATION_ERROR',
      'Invalid request.',
      result.array().map((item) => ({
        field: item.path,
        message: item.msg,
      }))
    )
  );
}

const registerValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('username')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters.'),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .isLength({ min: 8, max: 255 })
    .withMessage('Password must be between 8 and 255 characters.'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password confirmation must match password.'),
  body('fullName')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must be at most 100 characters.'),
  body('phoneNumber')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be at most 20 characters.'),
  handleValidationErrors,
];

const verifyEmailValidators = [
  body('token')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Verification token must be a string.')
    .trim()
    .isLength({ max: 512 })
    .withMessage('Verification token is too long.'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Email hợp lệ là bắt buộc khi xác thực bằng OTP.')
    .normalizeEmail(),
  body('otp')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Mã OTP phải gồm đúng 6 chữ số.'),
  body().custom((_, { req }) => {
    const hasToken = typeof req.body.token === 'string' && req.body.token.trim().length > 0;
    const hasOtpFlow =
      typeof req.body.email === 'string' &&
      req.body.email.trim().length > 0 &&
      typeof req.body.otp === 'string' &&
      req.body.otp.trim().length > 0;

    if (hasToken || hasOtpFlow) {
      return true;
    }

    throw new Error('Verification token or email and OTP are required.');
  }),
  handleValidationErrors,
];

const resendVerificationValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  handleValidationErrors,
];

const loginValidators = [
  body('email')
    .isString()
    .withMessage('Email or username is required.')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Email or username is required.')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Email or username must be at most 255 characters.'),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .notEmpty()
    .withMessage('Password is required.')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Password must be at most 255 characters.'),
  handleValidationErrors,
];

const refreshTokenValidators = [
  body('refreshToken').isString().trim().notEmpty().withMessage('Refresh token is required.').isLength({ max: 512 }),
  handleValidationErrors,
];

const logoutValidators = [
  body('refreshToken').isString().trim().notEmpty().withMessage('Refresh token is required.').isLength({ max: 512 }),
  handleValidationErrors,
];

const changePasswordValidators = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required.').isLength({ max: 255 }),
  body('newPassword')
    .isString()
    .withMessage('New password is required.')
    .isLength({ min: 8, max: 255 })
    .withMessage('New password must be between 8 and 255 characters.'),
  handleValidationErrors,
];

const requestChangePasswordOtpValidators = [
  body('currentPassword').isString().notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc.').isLength({ max: 255 }),
  body('newPassword')
    .isString()
    .withMessage('Mật khẩu mới là bắt buộc.')
    .isLength({ min: 8, max: 255 })
    .withMessage('Mật khẩu mới phải từ 8 đến 255 ký tự.'),
  body('confirmNewPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Xác nhận mật khẩu không khớp.'),
  handleValidationErrors,
];

const confirmChangePasswordValidators = [
  body('otp')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc.')
    .matches(/^\d{6}$/)
    .withMessage('Mã OTP phải gồm đúng 6 chữ số.'),
  body('newPassword')
    .isString()
    .withMessage('Mật khẩu mới là bắt buộc.')
    .isLength({ min: 8, max: 255 })
    .withMessage('Mật khẩu mới phải từ 8 đến 255 ký tự.'),
  handleValidationErrors,
];

const forgotPasswordValidators = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  handleValidationErrors,
];

const resetPasswordValidators = [
  body('token')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Reset token must be a string.')
    .trim()
    .isLength({ max: 512 })
    .withMessage('Reset token is too long.'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Email hợp lệ là bắt buộc khi đặt lại mật khẩu bằng OTP.')
    .normalizeEmail(),
  body('otp')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Mã OTP phải gồm đúng 6 chữ số.'),
  body('newPassword')
    .isString()
    .withMessage('Mật khẩu mới là bắt buộc.')
    .isLength({ min: 8, max: 255 })
    .withMessage('Mật khẩu mới phải từ 8 đến 255 ký tự.'),
  body().custom((_, { req }) => {
    const hasToken = typeof req.body.token === 'string' && req.body.token.trim().length > 0;
    const hasOtpFlow =
      typeof req.body.email === 'string' &&
      req.body.email.trim().length > 0 &&
      typeof req.body.otp === 'string' &&
      req.body.otp.trim().length > 0;

    if (hasToken || hasOtpFlow) {
      return true;
    }

    throw new Error('Reset token or email and OTP are required.');
  }),
  handleValidationErrors,
];

module.exports = {
  registerValidators,
  verifyEmailValidators,
  resendVerificationValidators,
  loginValidators,
  refreshTokenValidators,
  logoutValidators,
  changePasswordValidators,
  requestChangePasswordOtpValidators,
  confirmChangePasswordValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  handleValidationErrors,
};

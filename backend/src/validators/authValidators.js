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
  body('token').isString().trim().notEmpty().withMessage('Token is required.').isLength({ max: 512 }),
  handleValidationErrors,
];

const loginValidators = [
  body('email').isString().trim().notEmpty().withMessage('Email or username is required.').isLength({ max: 100 }),
  body('password').isString().notEmpty().withMessage('Password is required.').isLength({ max: 255 }),
  handleValidationErrors,
];

module.exports = {
  registerValidators,
  verifyEmailValidators,
  loginValidators,
  handleValidationErrors,
};

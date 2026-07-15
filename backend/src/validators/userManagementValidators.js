const { param } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

const resendSetupValidators = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

module.exports = {
  resendSetupValidators,
};

const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./authValidators');

function positiveIdParam(name, label) {
  return param(name)
    .isInt({ min: 1 })
    .withMessage(`${label} must be a positive integer.`)
    .toInt();
}

const resendSetupValidators = [
  positiveIdParam('userId', 'User ID'),
  handleValidationErrors,
];

const assignRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  body('roleId')
    .exists({ values: 'null' })
    .withMessage('Role ID is required.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('Role ID must be a positive integer.')
    .toInt(),
  handleValidationErrors,
];

const revokeRoleValidators = [
  positiveIdParam('userId', 'User ID'),
  positiveIdParam('roleId', 'Role ID'),
  handleValidationErrors,
];

module.exports = {
  resendSetupValidators,
  assignRoleValidators,
  revokeRoleValidators,
};

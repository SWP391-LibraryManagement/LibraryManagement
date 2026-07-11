const express = require('express');
const { createInventoryController } = require('../controllers/inventoryController');
const { createAuthenticate, requireAnyRole } = require('../middleware/authMiddleware');
const {
  listInventoryValidators,
  copyIdParamValidators,
  barcodeParamValidators,
  createCopyValidators,
  updateCopyValidators,
  updateCopyStatusValidators,
} = require('../validators/inventoryValidators');

function createInventoryRoutes({ authService, inventoryService } = {}) {
  const router = express.Router();
  const controller = createInventoryController(inventoryService);
  const authenticate = createAuthenticate(authService);
  const staffOnly = [authenticate, requireAnyRole('LIBRARIAN', 'ADMIN')];

  router.get('/inventory', ...staffOnly, listInventoryValidators, controller.listInventory);
  router.get('/book-copies/barcode/:barcode', ...staffOnly, barcodeParamValidators, controller.getCopyByBarcode);
  router.get('/book-copies/:copyId', ...staffOnly, copyIdParamValidators, controller.getCopy);
  router.post('/books/:bookId/copies', ...staffOnly, createCopyValidators, controller.createCopy);
  router.put('/book-copies/:copyId', ...staffOnly, updateCopyValidators, controller.updateCopy);
  router.patch('/book-copies/:copyId/status', ...staffOnly, updateCopyStatusValidators, controller.updateCopyStatus);
  router.delete('/book-copies/:copyId', ...staffOnly, copyIdParamValidators, controller.deactivateCopy);

  return router;
}

module.exports = {
  createInventoryRoutes,
};

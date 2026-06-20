const express = require('express');
const fineController = require('../controllers/fineController');

function createFineRoutes() {
  const router = express.Router();

  router.get('/', fineController.listFines);
  router.post('/', fineController.createFine);
  router.put('/:fineId', fineController.updateFine);
  router.delete('/:fineId', fineController.deleteFine);

  return router;
}

module.exports = {
  createFineRoutes,
};

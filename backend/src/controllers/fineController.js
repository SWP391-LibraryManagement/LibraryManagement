const fineService = require('../services/fineService');

async function listFines(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: fineService.listFines({
        status: req.query.status,
        q: req.query.q,
      }),
    });
  } catch (error) {
    return next(error);
  }
}

async function createFine(req, res, next) {
  try {
    return res.status(201).json({
      success: true,
      data: fineService.createFine(req.body),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateFine(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: fineService.updateFine(req.params.fineId, req.body),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteFine(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: fineService.deleteFine(req.params.fineId),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listFines,
  createFine,
  updateFine,
  deleteFine,
};

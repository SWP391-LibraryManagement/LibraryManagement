const express = require('express');
const bookController = require('../controllers/bookController');

const router = express.Router();

router.get('/', bookController.getHomeBooks);
router.get('/categories', bookController.getCategories);

module.exports = router;
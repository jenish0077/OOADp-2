const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/stats', salesController.getSalesStats);
router.get('/', salesController.getSalesList);

module.exports = router;

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/stats', reportController.getReportStats);
router.get('/category-sales', reportController.getCategorySales);
router.get('/chart', reportController.getChart);

module.exports = router;

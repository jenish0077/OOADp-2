const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getDashboardStats);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/chart', dashboardController.getChart);

module.exports = router;

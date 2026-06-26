const express = require('express');
const ReportController = require('../controllers/reportController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorizePermission('view_reports'));

router.get('/inventory', ReportController.generateInventoryReport);
router.get('/sales', ReportController.generateSalesReport);
router.get('/profit', ReportController.generateProfitReport);
router.get('/waste', ReportController.generateWasteReport);
router.get('/expiry-alerts', ReportController.generateExpiryReport);
router.get('/dashboard-summary', ReportController.generateDashboardSummary);

module.exports = router;

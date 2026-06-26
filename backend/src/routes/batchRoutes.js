const express = require('express');
const BatchController = require('../controllers/batchController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Summary endpoints
router.get('/summary/products', authorizePermission('view_inventory'), BatchController.getProductInventorySummary);
router.get('/summary/raw-materials', authorizePermission('view_inventory'), BatchController.getRawMaterialInventorySummary);

// Batch list endpoints
router.get('/products', authorizePermission('view_inventory'), BatchController.getProductBatches);
router.get('/raw-materials', authorizePermission('view_inventory'), BatchController.getRawMaterialBatches);
router.get('/product/:productId', authorizePermission('view_inventory'), BatchController.getProductBatchesByProductId);
router.get('/material/:materialId', authorizePermission('view_inventory'), BatchController.getRawMaterialBatchesByMaterialId);

// Bill-based payment management
router.get('/bills', authorizePermission('view_inventory'), BatchController.getAllBills);
router.get('/bills/stats', authorizePermission('view_inventory'), BatchController.getPaymentStats);
router.get('/bills/:billId', authorizePermission('view_inventory'), BatchController.getBillDetails);
router.get('/bills/:billId/history', authorizePermission('view_inventory'), BatchController.getBillPaymentHistory);
router.put('/bills/payment', authorizePermission('manage_batches'), BatchController.updateBillPayment);

// Legacy batch payment management
router.put('/payment', authorizePermission('manage_batches'), BatchController.updateBatchPayment);

// Batch endpoints
router.post('/raw', authorizePermission('manage_batches'), BatchController.createRawBatch);
router.post('/product', authorizePermission('manage_batches'), BatchController.createProductBatch);
router.get('/expiring', authorizePermission('view_inventory'), BatchController.getExpiringBatches);
router.get('/:batchId', authorizePermission('view_inventory'), BatchController.getBatchDetails);
router.get('/:batchId/sales', authorizePermission('view_inventory'), BatchController.getBatchSalesHistory);
router.get('/:batchId/profit', authorizePermission('view_inventory'), BatchController.calculateBatchProfit);

module.exports = router;


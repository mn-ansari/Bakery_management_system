const express = require('express');
const SalesController = require('../controllers/salesController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Sales management
router.post('/', authorizePermission('create_sales'), SalesController.createSale);
router.get('/date/:date', authorizePermission('view_sales'), SalesController.getSalesByDate);
router.delete('/:id', authorizePermission('create_sales'), SalesController.deleteSale);

// Sales reports
router.get('/daily', authorizePermission('view_sales'), SalesController.getDailySales);
router.get('/report', authorizePermission('view_sales'), SalesController.getSalesReport);
router.get('/weekly', authorizePermission('view_sales'), SalesController.getWeeklySales);
router.get('/monthly', authorizePermission('view_sales'), SalesController.getMonthlySales);
router.get('/product-wise', authorizePermission('view_sales'), SalesController.getProductWiseSales);

module.exports = router;


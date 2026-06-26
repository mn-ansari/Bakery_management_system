const express = require('express');
const ProductController = require('../controllers/productController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermission('view_inventory'), ProductController.getAllProducts);
router.post('/', authorizePermission('manage_products'), ProductController.createProduct);
router.get('/:id', authorizePermission('view_inventory'), ProductController.getProductById);
router.put('/:id', authorizePermission('manage_products'), ProductController.updateProduct);
router.get('/:id/stock', authorizePermission('view_inventory'), ProductController.getProductStock);

module.exports = router;

const express = require('express');
const RawMaterialController = require('../controllers/rawMaterialController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermission('view_inventory'), RawMaterialController.getAllRawMaterials);
router.post('/', authorizePermission('manage_raw_materials'), RawMaterialController.createRawMaterial);
router.get('/:id', authorizePermission('view_inventory'), RawMaterialController.getRawMaterialById);
router.put('/:id', authorizePermission('manage_raw_materials'), RawMaterialController.updateRawMaterial);
router.get('/:id/batches', authorizePermission('view_inventory'), RawMaterialController.getBatchHistory);
router.get('/alerts/low-stock', authorizePermission('view_inventory'), RawMaterialController.getLowStockAlerts);

module.exports = router;

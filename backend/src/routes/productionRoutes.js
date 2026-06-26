const express = require('express');
const ProductionController = require('../controllers/productionController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizePermission('create_production'), ProductionController.createProduction);
router.get('/', authorizePermission('view_production'), ProductionController.getProductionLogs);
router.get('/:id', authorizePermission('view_production'), ProductionController.getProductionById);
router.get('/summary/daily', authorizePermission('view_production'), ProductionController.getDailyProductionSummary);

module.exports = router;

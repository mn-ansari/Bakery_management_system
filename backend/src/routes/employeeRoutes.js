const express = require('express');
const EmployeeController = require('../controllers/employeeController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermission('manage_employees'), EmployeeController.getAllEmployees);
router.post('/', authorizePermission('manage_employees'), EmployeeController.createEmployee);
router.get('/stats', authorizePermission('manage_employees'), EmployeeController.getEmployeeStats);
router.get('/:id', authorizePermission('manage_employees'), EmployeeController.getEmployeeById);
router.put('/:id', authorizePermission('manage_employees'), EmployeeController.updateEmployee);

module.exports = router;

const express = require('express');
const SalaryController = require('../controllers/salaryController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', authorizePermission('manage_salaries'), SalaryController.recordPayment);
router.get('/employee/:employee_id', authorizePermission('manage_salaries'), SalaryController.getEmployeeSalaryHistory);
router.get('/monthly-status', authorizePermission('manage_salaries'), SalaryController.getMonthlySalaryStatus);
router.get('/yearly/:employee_id', authorizePermission('manage_salaries'), SalaryController.getYearlySalaryReport);
router.get('/expense/total', authorizePermission('manage_salaries'), SalaryController.getTotalSalaryExpense);
router.get('/payroll/summary', authorizePermission('manage_salaries'), SalaryController.getMonthlyPayrollSummary);
router.get('/logs', authorizePermission('manage_salaries'), SalaryController.getRecentLogs);

module.exports = router;

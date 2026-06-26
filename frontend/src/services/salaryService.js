import { API } from '../context/authStore';

const SalaryService = {
  // Record advance/payment
  recordPayment: (paymentData) => API.post('/salaries', paymentData),

  // Get employee salary history
  getEmployeeSalaryHistory: (employeeId) => API.get(`/salaries/employee/${employeeId}`),

  // Get monthly status for all employees
  getMonthlySalaryStatus: (monthYear) => API.get('/salaries/monthly-status', { params: { month_year: monthYear } }),

  // Get yearly report for employee
  getYearlyReport: (employeeId) => API.get(`/salaries/yearly/${employeeId}`),

  // Get total salary expense
  getTotalExpense: (dateFrom, dateTo) => API.get('/salaries/expense/total', { params: { date_from: dateFrom, date_to: dateTo } }),

  // Get payroll summary
  getPayrollSummary: (monthYear) => API.get('/salaries/payroll/summary', { params: { month_year: monthYear } }),

  // Get recent salary logs
  getRecentLogs: (monthYear, limit = 50) => API.get('/salaries/logs', { params: { month_year: monthYear, limit } }),

  // Get all employees (from employee service)
  getEmployees: () => API.get('/employees'),
};

export default SalaryService;

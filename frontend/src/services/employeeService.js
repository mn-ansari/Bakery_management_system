import { API } from '../context/authStore';

const EmployeeService = {
  getEmployees: () => API.get('/employees'),
  createEmployee: (data) => API.post('/employees', data),
  getEmployeeById: (id) => API.get(`/employees/${id}`),
  updateEmployee: (id, data) => API.put(`/employees/${id}`, data),
  getEmployeeStats: () => API.get('/employees/stats')
};

const SalaryService = {
  recordPayment: (data) => API.post('/salaries', data),
  getEmployeeSalaryHistory: (employeeId) => API.get(`/salaries/employee/${employeeId}`),
  getMonthlySalaryStatus: (monthYear) => API.get('/salaries/monthly-status', { params: { month_year: monthYear } }),
  getYearlySalaryReport: (employeeId) => API.get(`/salaries/yearly/${employeeId}`),
  getTotalSalaryExpense: (params) => API.get('/salaries/expense/total', { params }),
  getMonthlyPayrollSummary: (monthYear) => API.get('/salaries/payroll/summary', { params: { month_year: monthYear } })
};

export { EmployeeService, SalaryService };

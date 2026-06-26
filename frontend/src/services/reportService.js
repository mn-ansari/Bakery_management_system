import { API } from '../context/authStore';

const ReportService = {
  getInventoryReport: () => API.get('/reports/inventory'),
  getSalesReport: (params) => API.get('/reports/sales', { params }),
  getProfitReport: (params) => API.get('/reports/profit', { params }),
  getWasteReport: (params) => API.get('/reports/waste', { params }),
  getExpiryReport: (params) => API.get('/reports/expiry-alerts', { params }),
  getDashboardSummary: () => API.get('/reports/dashboard-summary')
};

export default ReportService;

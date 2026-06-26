import { API } from '../context/authStore';

const SalesService = {
  // Sales Management
  createSale: (saleData) => API.post('/sales', saleData),
  getSalesByDate: (date) => API.get(`/sales/date/${date}`),
  deleteSale: (id) => API.delete(`/sales/${id}`),
  getDailySales: (date) => API.get('/sales/daily', { params: { date } }),
  getSalesReport: (params) => API.get('/sales/report', { params }),
  getWeeklySales: () => API.get('/sales/weekly'),
  getMonthlySales: () => API.get('/sales/monthly'),
  getProductWiseSales: (params) => API.get('/sales/product-wise', { params }),

  // Batch Queries for Payments
  getRawMaterialBatches: () => API.get('/inventory/batches/raw-materials'),
  getProductBatches: () => API.get('/inventory/batches/products'),

  // Legacy Payment Management
  updateBatchPayment: (paymentData) => API.put('/inventory/batches/payment', paymentData),

  // Bill-Based Payment Management
  getAllBills: (status) => API.get('/inventory/batches/bills', { params: { status } }),
  getBillDetails: (billId) => API.get(`/inventory/batches/bills/${billId}`),
  updateBillPayment: (paymentData) => API.put('/inventory/batches/bills/payment', paymentData),
  getBillPaymentHistory: (billId) => API.get(`/inventory/batches/bills/${billId}/history`),
  getPaymentStats: () => API.get('/inventory/batches/bills/stats')
};

export default SalesService;


import { API } from '../context/authStore';

/**
 * Utility Bills Service
 * Handles all API calls for utility bill management
 */
const UtilityService = {
  // ==================== BILL MANAGEMENT ====================

  /**
   * Get all utility bills with optional filters
   * @param {Object} filters - { status, bill_type, month }
   */
  getAllBills: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.bill_type) params.append('bill_type', filters.bill_type);
    if (filters.month) params.append('month', filters.month);
    return API.get(`/utilities?${params.toString()}`);
  },

  /**
   * Get single bill by ID
   * @param {number} id - Bill ID
   */
  getBillById: (id) => API.get(`/utilities/bill/${id}`),

  /**
   * Create new utility bill
   * @param {FormData} formData - Bill data including image
   */
  createBill: (formData) => API.post('/utilities', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  /**
   * Update existing bill
   * @param {number} id - Bill ID
   * @param {FormData} formData - Updated bill data
   */
  updateBill: (id, formData) => API.put(`/utilities/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  /**
   * Delete utility bill
   * @param {number} id - Bill ID
   */
  deleteBill: (id) => API.delete(`/utilities/${id}`),

  // ==================== OCR PROCESSING ====================

  /**
   * Upload bill image and process with OCR
   * @param {FormData} formData - Contains bill_image file
   */
  processOCR: (formData) => API.post('/utilities/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // ==================== PAYMENTS ====================

  /**
   * Mark bill as paid
   * @param {number} id - Bill ID
   * @param {FormData} formData - Payment details including optional screenshot
   */
  markAsPaid: (id, formData) => API.post(`/utilities/${id}/pay`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  /**
   * Get payment history for all bills
   */
  getPaymentHistory: () => API.get('/utilities/payments/history'),

  /**
   * Get pending payments
   */
  getPendingPayments: () => API.get('/utilities/payments/pending'),

  // ==================== NOTIFICATIONS ====================

  /**
   * Get all utility notifications
   */
  getNotifications: () => API.get('/utilities/notifications'),

  /**
   * Get notification summary for dashboard
   */
  getNotificationSummary: () => API.get('/utilities/notifications/summary'),

  /**
   * Dismiss a notification
   * @param {number} id - Notification ID
   */
  dismissNotification: (id) => API.put(`/utilities/notifications/${id}/dismiss`),

  // ==================== REPORTS ====================

  /**
   * Get monthly utility summary
   * @param {string} month - Month in format 'YYYY-MM' or month name
   */
  getMonthlySummary: (month) => API.get('/utilities/summary/monthly', { params: { month } }),

  /**
   * Get yearly utility summary
   */
  getYearlySummary: () => API.get('/utilities/summary/yearly'),

  /**
   * Get total expense for date range
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   */
  getTotalExpense: (dateFrom, dateTo) => API.get('/utilities/expense/total', {
    params: { date_from: dateFrom, date_to: dateTo }
  })
};

export { UtilityService };
export default UtilityService;

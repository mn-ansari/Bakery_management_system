import { API } from '../context/authStore';

const ProductionService = {
  createProductionLog: (data) => API.post('/production', data),
  getProductionLogs: (params) => API.get('/production', { params }),
  getProductionById: (id) => API.get(`/production/${id}`),
  getDailyProductionSummary: (date) => API.get('/production/summary/daily', { params: { date } })
};

export default ProductionService;

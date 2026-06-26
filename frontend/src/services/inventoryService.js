import { API } from '../context/authStore';

const InventoryService = {
  getRawMaterials: () => API.get('/inventory/raw-materials'),
  createRawMaterial: (data) => API.post('/inventory/raw-materials', data),
  updateRawMaterial: (id, data) => API.put(`/inventory/raw-materials/${id}`, data),
  getRawMaterialById: (id) => API.get(`/inventory/raw-materials/${id}`),
  getLowStockAlerts: () => API.get('/inventory/raw-materials/alerts/low-stock'),

  getProducts: () => API.get('/inventory/products'),
  createProduct: (data) => API.post('/inventory/products', data),
  updateProduct: (id, data) => API.put(`/inventory/products/${id}`, data),
  getProductById: (id) => API.get(`/inventory/products/${id}`),
  getProductStock: (id) => API.get(`/inventory/products/${id}/stock`),

  createRawBatch: (data) => API.post('/inventory/batches/raw', data),
  createProductBatch: (data) => API.post('/inventory/batches/product', data),
  getExpiringBatches: (days = 7) => API.get('/inventory/batches/expiring', { params: { days } }),
  getBatchDetails: (batchId) => API.get(`/inventory/batches/${batchId}`),
  getBatchSalesHistory: (batchId) => API.get(`/inventory/batches/${batchId}/sales`),
  calculateBatchProfit: (batchId) => API.get(`/inventory/batches/${batchId}/profit`),
  getProductBatchesByProductId: (productId) => API.get(`/inventory/batches/product/${productId}`),
  getRawMaterialBatchesByMaterialId: (materialId) => API.get(`/inventory/batches/material/${materialId}`),

  // Aggregated inventory methods
  getProductInventory: () => API.get('/inventory/batches/summary/products'),
  getRawMaterialInventory: () => API.get('/inventory/batches/summary/raw-materials')
};

export { InventoryService };
export default InventoryService;

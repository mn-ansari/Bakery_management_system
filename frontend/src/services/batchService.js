import { API } from '../context/authStore';

export const BatchService = {
  // Product Batches
  getProductBatches: () => API.get('/inventory/batches/products'),
  
  getProductBatchById: (id) => API.get(`/inventory/batches/products/${id}`),
  
  createProductBatch: (data) => API.post('/inventory/batches/product', data),
  
  updateProductBatch: (id, data) => API.put(`/inventory/batches/products/${id}`, data),
  
  // Raw Material Batches
  getRawMaterialBatches: () => API.get('/inventory/batches/raw-materials'),
  
  getRawMaterialBatchById: (id) => API.get(`/inventory/batches/raw-materials/${id}`),
  
  createRawMaterialBatch: (data) => API.post('/inventory/batches/raw', data),
  
  updateRawMaterialBatch: (id, data) => API.put(`/inventory/batches/raw-materials/${id}`, data),
  
  // Get batches by product/material ID
  getBatchesByProductId: (productId) => API.get(`/inventory/batches/product/${productId}`),
  
  getBatchesByMaterialId: (materialId) => API.get(`/inventory/batches/material/${materialId}`)
};

export default BatchService;

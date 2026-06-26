import { API } from '../context/authStore';

export const ProductService = {
  // Get all products (both readymade and raw materials)
  getProducts: () => API.get('/inventory/products'),
  
  // Get product by ID
  getProductById: (id) => API.get(`/inventory/products/${id}`),
  
  // Create new product
  createProduct: (data) => API.post('/inventory/products', data),
  
  // Update product
  updateProduct: (id, data) => API.put(`/inventory/products/${id}`, data),
  
  // Delete product
  deleteProduct: (id) => API.delete(`/inventory/products/${id}`),
  
  // Get products by type
  getProductsByType: (type) => API.get(`/inventory/products?type=${type}`)
};

export default ProductService;

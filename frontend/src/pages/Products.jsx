import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { FormGroup, Input, Select } from '../components/Form';
import { ProductService } from '../services/productService';
import styles from './Products.module.css';

const Products = () => {
  const [activeTab, setActiveTab] = useState('readymade');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'pieces',
    base_price: '',
    description: '',
    type: 'readymade'
  });

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getProducts();
      const filtered = response.data.filter(p => p.type === activeTab);
      setProducts(filtered || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = { ...formData, type: activeTab };
      console.log('Sending product data:', productData);
      
      const response = await ProductService.createProduct(productData);
      console.log('Product created successfully:', response.data);
      
      setFormData({
        name: '',
        category: '',
        unit: 'pieces',
        base_price: '',
        description: '',
        type: activeTab
      });
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      console.error('Error response:', error.response?.data);
      alert(`Failed to create product: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const readymadeColumns = [
    { key: 'product_id', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit', label: 'Unit' },
    { key: 'base_price', label: 'Base Price (Rs)', render: (val) => `Rs ${parseFloat(val).toFixed(2)}` },
    { key: 'description', label: 'Description' },
    { 
      key: 'created_at', 
      label: 'Added Date',
      render: (val) => new Date(val).toLocaleDateString()
    }
  ];

  const rawMaterialColumns = [
    { key: 'raw_material_id', label: 'ID' },
    { key: 'name', label: 'Material Name' },
    { key: 'unit', label: 'Unit' },
    { key: 'base_price', label: 'Base Price (Rs)', render: (val) => `Rs ${parseFloat(val).toFixed(2)}` },
    { key: 'reorder_level', label: 'Reorder Level' },
    { 
      key: 'created_at', 
      label: 'Added Date',
      render: (val) => new Date(val).toLocaleDateString()
    }
  ];

  return (
    <div className={styles.productsPage}>
      <div className={styles.header}>
        <h1>Product Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Product'}
        </Button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'readymade' ? styles.active : ''}`}
          onClick={() => setActiveTab('readymade')}
        >
          Ready-made Products
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'raw' ? styles.active : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          Raw Materials
        </button>
      </div>

      {/* Add Product Form */}
      {showForm && (
        <Card className={styles.formCard}>
          <h2>Add New {activeTab === 'readymade' ? 'Ready-made Product' : 'Raw Material'}</h2>
          <form onSubmit={handleCreateProduct}>
            <div className={styles.formGrid}>
              <FormGroup label="Name" required>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </FormGroup>

              {activeTab === 'readymade' && (
                <FormGroup label="Category" required>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="Select Category"
                    options={[
                      { value: 'Bread', label: 'Bread' },
                      { value: 'Cake', label: 'Cake' },
                      { value: 'Pastry', label: 'Pastry' },
                      { value: 'Cookies', label: 'Cookies' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    required
                  />
                </FormGroup>
              )}

              <FormGroup label="Unit" required>
                <Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="Select Unit"
                  options={[
                    { value: 'pieces', label: 'Pieces' },
                    { value: 'kg', label: 'Kilograms (kg)' },
                    { value: 'grams', label: 'Grams' },
                    { value: 'liters', label: 'Liters' },
                    { value: 'dozen', label: 'Dozen' }
                  ]}
                  required
                />
              </FormGroup>

              <FormGroup label="Base Price (Rs)" required>
                <Input
                  type="number"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  placeholder="Enter base price"
                  step="0.01"
                  required
                />
              </FormGroup>

              <FormGroup label="Description" fullWidth>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                />
              </FormGroup>
            </div>

            <div className={styles.formActions}>
              <Button type="submit" variant="primary">Add Product</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Products List */}
      <Card>
        <h2>{activeTab === 'readymade' ? 'Ready-made Products' : 'Raw Materials'}</h2>
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <Table
            data={products}
            columns={activeTab === 'readymade' ? readymadeColumns : rawMaterialColumns}
          />
        )}
      </Card>
    </div>
  );
};

export default Products;

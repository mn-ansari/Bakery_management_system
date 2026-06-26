import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { FormGroup, Input, Select } from '../components/Form';
import { BatchService } from '../services/batchService';
import { ProductService } from '../services/productService';
import styles from './BatchTracking.module.css';

const BatchTracking = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [batchType, setBatchType] = useState('product');
  const [productionRows, setProductionRows] = useState([
    {
      id: Date.now(),
      raw_material_id: '',
      batch_number: '',
      quantity: '',
      unit_price: '',
      manufacturing_date: new Date().toISOString().split('T')[0],
      expiry_date: ''
    }
  ]);
  const [formData, setFormData] = useState({
    product_id: '',
    raw_material_id: '',
    batch_number: '',
    quantity: '',
    unit_price: '',
    manufacturing_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    supplier_id: '',
    notes: '',
    bill_id: ''
  });

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, [batchType]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = batchType === 'product' 
        ? await BatchService.getProductBatches()
        : await BatchService.getRawMaterialBatches();
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await ProductService.getProducts();
      const allProducts = response.data || [];
      setProducts(allProducts.filter(p => p.type === 'readymade'));
      setRawMaterials(allProducts.filter(p => p.type === 'raw'));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProductionRow = () => {
    setProductionRows([
      ...productionRows,
      {
        id: Date.now(),
        raw_material_id: '',
        batch_number: '',
        quantity: '',
        unit_price: '',
        manufacturing_date: new Date().toISOString().split('T')[0],
        expiry_date: ''
      }
    ]);
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: value
    });
  };

  const removeProductionRow = (id) => {
    if (productionRows.length > 1) {
      setProductionRows(productionRows.filter(row => row.id !== id));
    }
  };

  const updateProductionRow = (id, field, value) => {
    setProductionRows(productionRows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      if (batchType === 'product') {
        const quantityProduced = parseFloat(formData.quantity) || 0;
        const unitPrice = parseFloat(formData.unit_price) || 0;

        await BatchService.createProductBatch({
          product_id: formData.product_id,
          batch_number: formData.batch_number,
          quantity_produced: quantityProduced,
          production_date: formData.manufacturing_date,
          expiry_date: formData.expiry_date || null,
          production_location: formData.notes || '',
          cost_per_unit: unitPrice,
          selling_price: unitPrice,
          production_cost: quantityProduced * unitPrice,
          bill_id: formData.bill_id
        });
      } else {
        // Create multiple raw material batches with the same bill_id
        for (const row of productionRows) {
          if (row.raw_material_id && row.quantity && row.unit_price) {
            const quantity = parseFloat(row.quantity) || 0;
            const unitPrice = parseFloat(row.unit_price) || 0;
            const selectedMaterial = rawMaterials.find(
              (material) => String(material.raw_material_id) === String(row.raw_material_id)
            );

            await BatchService.createRawMaterialBatch({
              raw_material_id: row.raw_material_id,
              batch_number: row.batch_number,
              quantity,
              unit: selectedMaterial?.unit || 'kg',
              purchase_price: unitPrice,
              purchase_date: row.manufacturing_date,
              expiry_date: row.expiry_date || null,
              supplier_id: null,
              warehouse_location: formData.notes || '',
              bill_id: formData.bill_id
            });
          }
        }
      }

      // Reset form
      setFormData({
        product_id: '',
        raw_material_id: '',
        batch_number: '',
        quantity: '',
        unit_price: '',
        manufacturing_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        supplier_id: '',
        notes: '',
        bill_id: ''
      });
      alert('Batch created successfully!');
      setProductionRows([
        {
          id: Date.now(),
          raw_material_id: '',
          quantity: '',
          unit_price: '',
          manufacturing_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
          batch_number: ''
        }
      ]);
      setShowForm(false);
      fetchBatches();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Failed to create batch: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const productBatchColumns = [
    { key: 'batch_number', label: 'Batch Number' },
    { key: 'bill_id', label: 'Bill ID', render: (val) => val || 'N/A' },
    { key: 'product_name', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit_price', label: 'Unit Price (Rs)', render: (val) => `Rs ${parseFloat(val).toFixed(2)}` },
    { 
      key: 'total_value', 
      label: 'Total Value (Rs)', 
      render: (val, row) => `Rs ${(parseFloat(row.quantity) * parseFloat(row.unit_price)).toFixed(2)}` 
    },
    { 
      key: 'manufacturing_date', 
      label: 'Mfg Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      key: 'expiry_date', 
      label: 'Expiry Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
    },
    { key: 'status', label: 'Status' }
  ];

  const rawBatchColumns = [
    { key: 'batch_number', label: 'Batch Number' },
    { key: 'bill_id', label: 'Bill ID', render: (val) => val || 'N/A' },
    { key: 'material_name', label: 'Raw Material' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit_price', label: 'Unit Price (Rs)', render: (val) => `Rs ${parseFloat(val).toFixed(2)}` },
    { 
      key: 'total_value', 
      label: 'Total Value (Rs)', 
      render: (val, row) => `Rs ${(parseFloat(row.quantity) * parseFloat(row.unit_price)).toFixed(2)}` 
    },
    { key: 'supplier_name', label: 'Supplier' },
    { 
      key: 'received_date', 
      label: 'Received Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className={styles.batchPage}>
      <div className={styles.header}>
        <h1>Batch Tracking</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New Batch'}
        </Button>
      </div>

      {/* Batch Type Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${batchType === 'product' ? styles.active : ''}`}
          onClick={() => setBatchType('product')}
        >
          Product Batches
        </button>
        <button 
          className={`${styles.tab} ${batchType === 'raw' ? styles.active : ''}`}
          onClick={() => setBatchType('raw')}
        >
          Raw Material Batches
        </button>
      </div>

      {/* Add Batch Form */}
      {showForm && (
        <Card className={styles.formCard}>
          <h2>Add New {batchType === 'product' ? 'Product' : 'Raw Material'} Batch</h2>
          <form onSubmit={handleCreateBatch}>
            {/* Common Fields */}
            <div className={styles.formGrid}>
              <FormGroup label="Bill ID" required>
                <Input
                  type="text"
                  name="bill_id"
                  value={formData.bill_id}
                  onChange={handleChange}
                  placeholder="Enter Bill ID (e.g., INV-001, BILL-12345)"
                  required
                />
              </FormGroup>

              {batchType === 'product' && (
                <FormGroup label="Batch Number" required>
                  <Input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleChange}
                    placeholder="Enter Batch Number"
                    required
                  />
                </FormGroup>
              )}

              <FormGroup label="Notes" fullWidth>
                <Input
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                />
              </FormGroup>
            </div>

            {/* Product Batch Form */}
            {batchType === 'product' ? (
              <div className={styles.formGrid}>
                <FormGroup label="Select Product" required>
                  <Select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleProductChange}
                    placeholder="Select Product"
                    options={products.map(p => ({
                      value: p.product_id,
                      label: p.name
                    }))}
                    required
                  />
                </FormGroup>

                <FormGroup label="Quantity" required>
                  <Input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="Enter quantity"
                    step="0.01"
                    required
                  />
                </FormGroup>

                <FormGroup label="Unit Price (Rs)" required>
                  <Input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    placeholder="Enter unit price"
                    step="0.01"
                    required
                  />
                </FormGroup>

                <FormGroup label="Manufacturing Date" required>
                  <Input
                    type="date"
                    name="manufacturing_date"
                    value={formData.manufacturing_date}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>

                <FormGroup label="Expiry Date">
                  <Input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                  />
                </FormGroup>
              </div>
            ) : (
              <div>
                {/* Multiple Raw Materials */}
                <h3 style={{ marginTop: '20px', marginBottom: '15px', color: '#333' }}>Add Multiple Raw Materials</h3>
                <div className={styles.productionTable}>
                  <div className={styles.tableHeader}>
                    <div className={styles.col1}>Batch Number</div>
                    <div className={styles.col2}>Material</div>
                    <div className={styles.col3}>Qty</div>
                    <div className={styles.col4}>Price</div>
                    <div className={styles.col5}>Received Date</div>
                    <div className={styles.col6}>Expiry</div>
                    <div className={styles.col7}>Action</div>
                  </div>

                  {productionRows.map((row) => (
                    <div key={row.id} className={styles.tableRow}>
                      <div className={styles.col1}>
                        <Input
                          type="text"
                          value={row.batch_number}
                          onChange={(e) => updateProductionRow(row.id, 'batch_number', e.target.value)}
                          placeholder="Enter Batch Number"
                          required
                        />
                      </div>
                      <div className={styles.col2}>
                        <Select
                          value={row.raw_material_id}
                          onChange={(e) => updateProductionRow(row.id, 'raw_material_id', e.target.value)}
                          options={rawMaterials.map(r => ({
                            value: r.raw_material_id,
                            label: r.name
                          }))}
                          placeholder="Select material"
                        />
                      </div>
                      <div className={styles.col3}>
                        <Input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => updateProductionRow(row.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          step="0.01"
                        />
                      </div>
                      <div className={styles.col4}>
                        <Input
                          type="number"
                          value={row.unit_price}
                          onChange={(e) => updateProductionRow(row.id, 'unit_price', e.target.value)}
                          placeholder="Price"
                          step="0.01"
                        />
                      </div>
                      <div className={styles.col5}>
                        <Input
                          type="date"
                          value={row.manufacturing_date}
                          onChange={(e) => updateProductionRow(row.id, 'manufacturing_date', e.target.value)}
                        />
                      </div>
                      <div className={styles.col6}>
                        <Input
                          type="date"
                          value={row.expiry_date}
                          onChange={(e) => updateProductionRow(row.id, 'expiry_date', e.target.value)}
                        />
                      </div>
                      <div className={styles.col7}>
                        <Button
                          type="button"
                          onClick={() => removeProductionRow(row.id)}
                          disabled={productionRows.length === 1}
                          style={{ background: productionRows.length === 1 ? '#ccc' : '#dc3545' }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={addProductionRow}
                  style={{ marginTop: '15px', background: '#28a745' }}
                >
                  + Add Material
                </Button>
              </div>
            )}

            <div className={styles.formActions}>
              <Button type="submit" variant="primary">Add Batch</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Batches List */}
      <Card>
        <h2>{batchType === 'product' ? 'Product Batches' : 'Raw Material Batches'}</h2>
        {loading ? (
          <p>Loading batches...</p>
        ) : (
          <Table
            data={batches}
            columns={batchType === 'product' ? productBatchColumns : rawBatchColumns}
          />
        )}
      </Card>
    </div>
  );
};

export default BatchTracking;

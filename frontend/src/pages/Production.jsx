import React from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { FormGroup, Input, Select, Textarea } from '../components/Form';
import ProductionService from '../services/productionService';
import { ProductService } from '../services/productService';
import styles from './Production.module.css';

const Production = () => {
  const [activeTab, setActiveTab] = React.useState('record');
  const [productions, setProductions] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [productionDate, setProductionDate] = React.useState(new Date().toISOString().split('T')[0]);
  
  const [productionRows, setProductionRows] = React.useState([
    { id: Date.now(), product_id: '', quantity_produced: '', expiry_date: '', quality_notes: '' }
  ]);

  React.useEffect(() => {
    fetchProductions();
    fetchProducts();
  }, []);

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const response = await ProductionService.getProductionLogs();
      setProductions(response.data || []);
    } catch (error) {
      console.error('Error fetching productions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await ProductService.getProducts();
      const readymadeProducts = (response.data || []).filter(p => p.type === 'readymade');
      setProducts(readymadeProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProductionRow = () => {
    setProductionRows([
      ...productionRows,
      { id: Date.now(), product_id: '', quantity_produced: '', expiry_date: '', quality_notes: '' }
    ]);
  };

  const removeProductionRow = (id) => {
    if (productionRows.length > 1) {
      setProductionRows(productionRows.filter(row => row.id !== id));
    }
  };

  const updateProductionRow = (id, field, value) => {
    setProductionRows(productionRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const generateBatchId = () => {
    const date = new Date(productionDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `PB-${month}${day}-${timestamp}`;
  };

  const handleSaveAllProduction = async () => {
    try {
      const validRows = productionRows.filter(row => row.product_id && row.quantity_produced);
      
      if (validRows.length === 0) {
        alert('Please fill in at least one product with quantity');
        return;
      }

      const batchId = generateBatchId();
      setLoading(true);

      // Save each product as a separate batch
      for (const row of validRows) {
        await ProductionService.createProductionLog({
          product_id: row.product_id,
          production_date: productionDate,
          quantity_produced: parseFloat(row.quantity_produced),
          machine_used: '',
          production_cost: 0,
          batch_id: batchId,
          notes: row.quality_notes || ''
        });
      }

      // Reset form
      setProductionRows([
        { id: Date.now(), product_id: '', quantity_produced: '', expiry_date: '', quality_notes: '' }
      ]);
      setProductionDate(new Date().toISOString().split('T')[0]);
      setActiveTab('logs');
      fetchProductions();
      alert('Production recorded successfully!');
    } catch (error) {
      console.error('Error saving production:', error);
      alert('Failed to save production');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'product_id', label: 'Product ID' },
    { key: 'production_date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'quantity_produced', label: 'Quantity' },
    { key: 'machine_used', label: 'Machine' },
    { key: 'production_cost', label: 'Cost', render: (value) => `Rs. ${value}` }
  ];

  return (
    <div className={styles.production}>
      <h1>Production Management</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'record' ? styles.active : ''}`}
          onClick={() => setActiveTab('record')}
        >
          Record Daily Production
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'logs' ? styles.active : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Production Logs
        </button>
      </div>

      {/* Record Daily Production Tab */}
      {activeTab === 'record' && (
        <Card className={styles.recordCard}>
          <h2>Record Daily Production</h2>
          
          <FormGroup label="Production Date" required>
            <Input 
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              style={{ maxWidth: '250px' }}
            />
          </FormGroup>

          <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Add Products</h3>

          <div className={styles.productionTable}>
            {/* Header */}
            <div className={styles.productionHeader}>
              <div className={styles.productColumn}>Product</div>
              <div className={styles.quantityColumn}>Quantity</div>
              <div className={styles.expiryColumn}>Expiry Date</div>
              <div className={styles.notesColumn}>Quality Notes</div>
              <div className={styles.actionColumn}>Action</div>
            </div>

            {/* Rows */}
            {productionRows.map((row) => (
              <div key={row.id} className={styles.productionRow}>
                <div className={styles.productColumn}>
                  <Select
                    value={row.product_id}
                    onChange={(e) => updateProductionRow(row.id, 'product_id', e.target.value)}
                    placeholder="Select Product"
                    options={products.map(p => ({
                      value: p.product_id,
                      label: p.name
                    }))}
                    required
                  />
                </div>
                
                <div className={styles.quantityColumn}>
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={row.quantity_produced}
                    onChange={(e) => updateProductionRow(row.id, 'quantity_produced', e.target.value)}
                    step="0.01"
                    required
                  />
                </div>

                <div className={styles.expiryColumn}>
                  <Input
                    type="date"
                    value={row.expiry_date}
                    onChange={(e) => updateProductionRow(row.id, 'expiry_date', e.target.value)}
                  />
                </div>

                <div className={styles.notesColumn}>
                  <Input
                    type="text"
                    placeholder="Quality notes"
                    value={row.quality_notes}
                    onChange={(e) => updateProductionRow(row.id, 'quality_notes', e.target.value)}
                  />
                </div>

                <div className={styles.actionColumn}>
                  <Button
                    onClick={() => removeProductionRow(row.id)}
                    disabled={productionRows.length === 1}
                    style={{ opacity: productionRows.length === 1 ? 0.5 : 1 }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Row Button */}
          <Button 
            onClick={addProductionRow}
            style={{ marginTop: '16px', marginBottom: '24px' }}
          >
            + Add Another Product
          </Button>

          {/* Save All Button */}
          <div className={styles.formActions}>
            <Button 
              onClick={handleSaveAllProduction}
              disabled={loading}
              style={{ 
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Saving...' : 'Save All Production'}
            </Button>
          </div>
        </Card>
      )}

      {/* Production Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <h2>Production Logs ({productions.length})</h2>
          {loading ? (
            <p>Loading...</p>
          ) : productions.length > 0 ? (
            <Table columns={columns} data={productions} />
          ) : (
            <p>No production records yet.</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default Production;

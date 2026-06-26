import React from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { InventoryService } from '../services/inventoryService';
import styles from './Inventory.module.css';

const Inventory = () => {
  const [activeTab, setActiveTab] = React.useState('products');
  const [inventorySummary, setInventorySummary] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [batchModalOpen, setBatchModalOpen] = React.useState(false);
  const [batchLoading, setBatchLoading] = React.useState(false);
  const [batchRows, setBatchRows] = React.useState([]);
  const [batchTitle, setBatchTitle] = React.useState('');
  const [stats, setStats] = React.useState({
    totalProducts: 0,
    totalBatches: 0,
    totalValue: 0,
    lowStockItems: 0
  });

  React.useEffect(() => {
    fetchInventoryData();
  }, [activeTab]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const response = await InventoryService.getProductInventory();
        setInventorySummary(response.data || []);
        calculateStats(response.data || []);
      } else {
        const response = await InventoryService.getRawMaterialInventory();
        setInventorySummary(response.data || []);
        calculateStats(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalProducts = data.length;
    const totalBatches = data.reduce((sum, item) => sum + parseInt(item.total_batches || 0), 0);
    const totalValue = data.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
    const lowStockItems = data.filter(item => parseInt(item.total_quantity) < 50).length;

    setStats({
      totalProducts,
      totalBatches,
      totalValue,
      lowStockItems
    });
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString();
  };

  const formatMoney = (value) => {
    const amount = parseFloat(value || 0);
    return `Rs ${amount.toFixed(2)}`;
  };

  const handleRowClick = async (row) => {
    setBatchModalOpen(true);
    setBatchLoading(true);
    setBatchRows([]);

    try {
      if (activeTab === 'products') {
        const productId = row.product_id;
        setBatchTitle(`Batches for ${row.product_name} (ID: ${productId})`);
        const response = await InventoryService.getProductBatchesByProductId(productId);
        setBatchRows(response.data || []);
      } else {
        const materialId = row.raw_material_id;
        setBatchTitle(`Batches for ${row.material_name} (ID: ${materialId})`);
        const response = await InventoryService.getRawMaterialBatchesByMaterialId(materialId);
        setBatchRows(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const closeBatchModal = () => {
    setBatchModalOpen(false);
    setBatchRows([]);
    setBatchTitle('');
  };

  const productColumns = [
    { key: 'product_name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'total_quantity', label: 'Total Pieces', render: (val) => parseInt(val).toLocaleString() },
    { key: 'total_batches', label: 'Total Batches' },
    { key: 'avg_price', label: 'Avg Price (Rs)', render: (val) => `Rs ${parseFloat(val).toFixed(2)}` },
    { key: 'total_value', label: 'Total Value (Rs)', render: (val) => `Rs ${parseFloat(val).toLocaleString()}` },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val, row) => {
        const qty = parseInt(row.total_quantity);
        if (qty === 0) return <span className={styles.statusOut}>Out of Stock</span>;
        if (qty < 50) return <span className={styles.statusLow}>Low Stock</span>;
        return <span className={styles.statusGood}>In Stock</span>;
      }
    }
  ];

  const rawMaterialColumns = [
    { key: 'material_name', label: 'Material Name' },
    { key: 'unit', label: 'Unit' },
    { key: 'total_quantity', label: 'Total Quantity', render: (val) => parseFloat(val).toFixed(2) },
    { key: 'total_batches', label: 'Total Batches' },
    { key: 'avg_price', label: 'Avg Price (Rs)', render: (val) => `Rs ${parseFloat(val).toFixed(2)}` },
    { key: 'total_value', label: 'Total Value (Rs)', render: (val) => `Rs ${parseFloat(val).toLocaleString()}` },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val, row) => {
        const qty = parseFloat(row.total_quantity);
        if (qty === 0) return <span className={styles.statusOut}>Out of Stock</span>;
        if (qty < 10) return <span className={styles.statusLow}>Low Stock</span>;
        return <span className={styles.statusGood}>In Stock</span>;
      }
    }
  ];

  const productBatchColumns = [
    { key: 'batch_number', label: 'Batch Number' },
    { key: 'manufacturing_date', label: 'Mfg Date', render: (val) => formatDate(val) },
    { key: 'quantity', label: 'Quantity' },
    { key: 'remaining_stock', label: 'Available' },
    { key: 'unit_price', label: 'Unit Price', render: (val) => formatMoney(val) },
    { key: 'expiry_date', label: 'Expiry', render: (val) => formatDate(val) }
  ];

  const rawBatchColumns = [
    { key: 'batch_number', label: 'Batch Number' },
    { key: 'received_date', label: 'Received', render: (val) => formatDate(val) },
    { key: 'quantity', label: 'Quantity' },
    { key: 'remaining_stock', label: 'Available' },
    { key: 'unit_price', label: 'Arrival Price', render: (val) => formatMoney(val) },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'expiry_date', label: 'Expiry', render: (val) => formatDate(val) }
  ];

  return (
    <div className={styles.inventory}>
      <h1>Inventory Overview</h1>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>{activeTab === 'products' ? 'Total Products' : 'Total Materials'}</div>
          <div className={styles.statValue}>{stats.totalProducts}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Total Batches</div>
          <div className={styles.statValue}>{stats.totalBatches}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Total Inventory Value</div>
          <div className={styles.statValue}>Rs {stats.totalValue.toLocaleString()}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Low Stock Items</div>
          <div className={`${styles.statValue} ${styles.warning}`}>{stats.lowStockItems}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'products' ? styles.active : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Product Inventory
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'raw' ? styles.active : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          Raw Material Inventory
        </button>
      </div>

      {/* Inventory Table */}
      <Card>
        <h2>{activeTab === 'products' ? 'Product Inventory Summary' : 'Raw Material Inventory Summary'}</h2>
        <p className={styles.subtitle}>
          Aggregated data from all batches managed in Batch Tracking
        </p>
        {loading ? (
          <p>Loading inventory data...</p>
        ) : (
          <Table
            data={inventorySummary}
            columns={activeTab === 'products' ? productColumns : rawMaterialColumns}
            onRowClick={handleRowClick}
          />
        )}
      </Card>

      {batchModalOpen && (
        <div className={styles.modalOverlay} onClick={closeBatchModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{batchTitle}</h3>
              <button type="button" className={styles.modalClose} onClick={closeBatchModal}>
                Close
              </button>
            </div>
            {batchLoading ? (
              <p>Loading batch history...</p>
            ) : (
              <Table
                data={batchRows}
                columns={activeTab === 'products' ? productBatchColumns : rawBatchColumns}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

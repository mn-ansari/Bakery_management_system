import React from 'react';
import { Card } from '../components/Card';
import ReportService from '../services/reportService';
import styles from './Reports.module.css';

const Reports = () => {
  const [activeReport, setActiveReport] = React.useState('dashboard');
  const [reportData, setReportData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const fetchReport = async (reportType) => {
    setLoading(true);
    try {
      let response;
      const dateFrom = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];

      switch(reportType) {
        case 'dashboard':
          response = await ReportService.getDashboardSummary();
          break;
        case 'sales':
          response = await ReportService.getSalesReport({ date_from: dateFrom, date_to: dateTo });
          break;
        case 'profit':
          response = await ReportService.getProfitReport({ date_from: dateFrom, date_to: dateTo });
          break;
        case 'inventory':
          response = await ReportService.getInventoryReport();
          break;
        case 'expiry':
          response = await ReportService.getExpiryReport({ days: 7 });
          break;
        default:
          return;
      }
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.reports}>
      <h1>Reports & Analytics</h1>

      <div className={styles.tabs}>
        <button 
          className={activeReport === 'dashboard' ? styles.active : ''}
          onClick={() => setActiveReport('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeReport === 'sales' ? styles.active : ''}
          onClick={() => setActiveReport('sales')}
        >
          Sales Report
        </button>
        <button 
          className={activeReport === 'profit' ? styles.active : ''}
          onClick={() => setActiveReport('profit')}
        >
          Profit Analysis
        </button>
        <button 
          className={activeReport === 'inventory' ? styles.active : ''}
          onClick={() => setActiveReport('inventory')}
        >
          Inventory
        </button>
        <button 
          className={activeReport === 'expiry' ? styles.active : ''}
          onClick={() => setActiveReport('expiry')}
        >
          Expiry Alerts
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : reportData ? (
        <div className={styles.content}>
          {activeReport === 'dashboard' && (
            <div>
              <h2>Dashboard Summary</h2>
              <pre>{JSON.stringify(reportData, null, 2)}</pre>
            </div>
          )}
          {activeReport === 'sales' && (
            <Card title="Sales Report">
              <p>Summary: {reportData.summary?.total_transactions} transactions</p>
              <p>Total Revenue: Rs {reportData.summary?.total_revenue}</p>
              <p>Total Items Sold: {reportData.summary?.total_items_sold}</p>
            </Card>
          )}
          {activeReport === 'profit' && (
            <Card title="Profit Analysis">
              <div className={styles.profitData}>
                <div>Revenue: Rs {reportData.revenue}</div>
                <div>Production Cost: Rs {reportData.costs?.production}</div>
                <div>Salaries: Rs {reportData.costs?.salaries}</div>
                <div>Utilities: Rs {reportData.costs?.utilities}</div>
                <strong>Profit: Rs {reportData.profit} ({reportData.profit_margin}%)</strong>
              </div>
            </Card>
          )}
          {activeReport === 'inventory' && (
            <Card title="Inventory Status">
              <p>Raw Materials: {reportData.raw_materials?.length}</p>
              <p>Products: {reportData.products?.length}</p>
            </Card>
          )}
          {activeReport === 'expiry' && (
            <Card title="Expiring Items">
              <p>Items expiring in {reportData.expiry_window_days} days: {reportData.expiring_items?.length}</p>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Reports;

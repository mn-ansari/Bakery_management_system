import React, { useState, useEffect } from 'react';
import SalesService from '../services/salesService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from './Payments.module.css';

export default function Payments() {
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedBill, setSelectedBill] = useState(null);
  const [billDetails, setBillDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [stats, setStats] = useState({
    total_bills: 0,
    total_amount: 0,
    total_paid: 0,
    total_pending: 0
  });
  const [paymentForm, setPaymentForm] = useState({
    paid_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference_number: '',
    notes: '',
    deduct_from_sales: false
  });
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchBills();
    fetchStats();
  }, [activeTab]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await SalesService.getAllBills(activeTab === 'All' ? 'all' : activeTab);
      setBills(response.data || []);
    } catch (err) {
      setError('Failed to load bills: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await SalesService.getPaymentStats();
      setStats(response.data || {});
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSelectBill = async (bill) => {
    setSelectedBill(bill);
    setDetailsLoading(true);
    setError('');
    
    try {
      const [detailsRes, historyRes] = await Promise.all([
        SalesService.getBillDetails(bill.bill_id),
        SalesService.getBillPaymentHistory(bill.bill_id)
      ]);
      
      setBillDetails(detailsRes.data);
      setPaymentHistory(historyRes.data || []);
      
      setPaymentForm({
        paid_amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        reference_number: '',
        notes: '',
        deduct_from_sales: false
      });
    } catch (err) {
      setError('Failed to load bill details: ' + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!selectedBill || !paymentForm.paid_amount) {
      setError('Please enter payment amount');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        bill_id: selectedBill.bill_id,
        ...paymentForm,
        paid_amount: parseFloat(paymentForm.paid_amount)
      };
      
      await SalesService.updateBillPayment(payload);
      
      // If "Deduct from Daily Sales" is checked, create expense entry
      if (paymentForm.deduct_from_sales) {
        const supplierName = billDetails?.supplier_names || selectedBill?.supplier_names || 'Bill Payment';
        await SalesService.createSale({
          buyer_name: `Bill #${selectedBill.bill_id} - ${supplierName}`,
          amount: parseFloat(paymentForm.paid_amount),
          payment_status: 'Expense',
          sale_date: paymentForm.payment_date
        });
      }
      
      setSuccessMsg(`Payment recorded! ${paymentForm.deduct_from_sales ? '(Added to Daily Sales expenses)' : ''}`);
      setSelectedBill(null);
      setBillDetails(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchBills();
      await fetchStats();
    } catch (err) {
      setError('Failed to update payment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFullAmount = () => {
    if (billDetails) {
      setPaymentForm(prev => ({
        ...prev,
        paid_amount: billDetails.remaining_amount.toFixed(2)
      }));
    }
  };

  const closeBillDetails = () => {
    setSelectedBill(null);
    setBillDetails(null);
    setPaymentHistory([]);
    setError('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-PK');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Paid': return styles.statusPaid;
      case 'Partial': return styles.statusPartial;
      default: return styles.statusPending;
    }
  };

  const pendingCount = bills.filter(b => b.payment_status === 'Pending').length;
  const partialCount = bills.filter(b => b.payment_status === 'Partial').length;
  const paidCount = bills.filter(b => b.payment_status === 'Paid').length;

  return (
    <div className={styles.container}>
      <h1>Payment Management</h1>

      {/* Success/Error Messages */}
      {successMsg && <div className={styles.success}>{successMsg}</div>}
      {error && !selectedBill && <div className={styles.error}>{error}</div>}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Total Bills</div>
          <div className={styles.statValue}>{stats.total_bills}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Total Amount</div>
          <div className={styles.statValue}>Rs {parseFloat(stats.total_amount || 0).toLocaleString()}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statLabel}>Total Paid</div>
          <div className={`${styles.statValue} ${styles.paid}`}>Rs {parseFloat(stats.total_paid || 0).toLocaleString()}</div>
        </Card>
        <Card className={`${styles.statCard} ${styles.pendingCard}`}>
          <div className={styles.statLabel}>Pending Amount</div>
          <div className={`${styles.statValue} ${styles.pending}`}>Rs {parseFloat(stats.total_pending || 0).toLocaleString()}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'Pending' ? styles.active : ''}`}
          onClick={() => setActiveTab('Pending')}
        >
          Pending ({pendingCount})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Partial' ? styles.active : ''}`}
          onClick={() => setActiveTab('Partial')}
        >
          Partial ({partialCount})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'Paid' ? styles.active : ''}`}
          onClick={() => setActiveTab('Paid')}
        >
          Paid ({paidCount})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'All' ? styles.active : ''}`}
          onClick={() => setActiveTab('All')}
        >
          All ({bills.length})
        </button>
      </div>

      <div className={styles.mainContent}>
        {/* Bills List */}
        <div className={styles.billsList}>
          <Card>
            <h2>Bills - {activeTab}</h2>
            {loading ? (
              <p className={styles.loading}>Loading bills...</p>
            ) : bills.length === 0 ? (
              <p className={styles.noData}>No bills found</p>
            ) : (
              <div className={styles.billsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.colBillId}>Bill ID</div>
                  <div className={styles.colDate}>Date</div>
                  <div className={styles.colSupplier}>Supplier</div>
                  <div className={styles.colType}>Type</div>
                  <div className={styles.colItems}>Items</div>
                  <div className={styles.colAmount}>Total</div>
                  <div className={styles.colPaid}>Paid</div>
                  <div className={styles.colRemaining}>Remaining</div>
                  <div className={styles.colStatus}>Status</div>
                  <div className={styles.colAction}>Action</div>
                </div>
                {bills.map((bill) => (
                  <div 
                    key={bill.bill_id} 
                    className={`${styles.tableRow} ${selectedBill?.bill_id === bill.bill_id ? styles.selected : ''}`}
                  >
                    <div className={styles.colBillId}>
                      <strong>{bill.bill_id}</strong>
                    </div>
                    <div className={styles.colDate}>
                      {formatDate(bill.bill_date)}
                    </div>
                    <div className={styles.colSupplier}>
                      {bill.supplier_names || 'N/A'}
                    </div>
                    <div className={styles.colType}>
                      <span className={`${styles.typeBadge} ${bill.bill_type === 'raw_material' ? styles.rawType : styles.productType}`}>
                        {bill.bill_type === 'raw_material' ? 'Raw Material' : 'Product'}
                      </span>
                    </div>
                    <div className={styles.colItems}>{bill.item_count} items</div>
                    <div className={styles.colAmount}>Rs {parseFloat(bill.total_amount || 0).toLocaleString()}</div>
                    <div className={styles.colPaid}>Rs {parseFloat(bill.paid_amount || 0).toLocaleString()}</div>
                    <div className={styles.colRemaining}>Rs {parseFloat(bill.remaining_amount || 0).toLocaleString()}</div>
                    <div className={styles.colStatus}>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(bill.payment_status)}`}>
                        {bill.payment_status}
                      </span>
                    </div>
                    <div className={styles.colAction}>
                      <Button 
                        onClick={() => handleSelectBill(bill)}
                        className={styles.viewBtn}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Bill Details Panel */}
        {selectedBill && (
          <div className={styles.detailsPanel}>
            <Card>
              <div className={styles.detailsHeader}>
                <h2>Bill Details: {selectedBill.bill_id}</h2>
                <button onClick={closeBillDetails} className={styles.closeBtn}>×</button>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              {detailsLoading ? (
                <p className={styles.loading}>Loading details...</p>
              ) : billDetails ? (
                <>
                  {/* Bill Summary */}
                  <div className={styles.billSummary}>
                    <div className={styles.summaryRow}>
                      <span>Supplier:</span>
                      <strong>{billDetails.supplier_names || 'N/A'}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Bill Date:</span>
                      <strong>{formatDate(billDetails.bill_date)}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Total Items:</span>
                      <strong>{billDetails.item_count}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Total Amount:</span>
                      <strong className={styles.totalAmount}>Rs {parseFloat(billDetails.total_amount || 0).toFixed(2)}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Paid Amount:</span>
                      <strong className={styles.paidAmount}>Rs {parseFloat(billDetails.paid_amount || 0).toFixed(2)}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Remaining:</span>
                      <strong className={styles.remainingAmount}>Rs {parseFloat(billDetails.remaining_amount || 0).toFixed(2)}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Status:</span>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(billDetails.payment_status)}`}>
                        {billDetails.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className={styles.itemsSection}>
                    <h3>Items in Bill ({billDetails.item_count})</h3>
                    <div className={styles.itemsList}>
                      <div className={styles.itemsHeader}>
                        <div className={styles.itemCol1}>Batch</div>
                        <div className={styles.itemCol2}>Item</div>
                        <div className={styles.itemCol3}>Qty</div>
                        <div className={styles.itemCol4}>Price</div>
                        <div className={styles.itemCol5}>Total</div>
                      </div>
                      {billDetails.items?.map((item, idx) => (
                        <div key={idx} className={styles.itemRow}>
                          <div className={styles.itemCol1}>
                            <small>{item.batch_number}</small>
                          </div>
                          <div className={styles.itemCol2}>
                            <span className={styles.itemName}>{item.item_name}</span>
                            <small className={`${styles.itemType} ${item.item_type === 'raw_material' ? styles.rawItem : styles.productItem}`}>
                              {item.item_type === 'raw_material' ? 'Raw' : 'Product'}
                            </small>
                          </div>
                          <div className={styles.itemCol3}>{item.quantity} {item.unit}</div>
                          <div className={styles.itemCol4}>Rs {parseFloat(item.unit_price || 0).toFixed(2)}</div>
                          <div className={styles.itemCol5}>Rs {parseFloat(item.total_value || 0).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Form */}
                  {billDetails.remaining_amount > 0 && (
                    <div className={styles.paymentSection}>
                      <h3>Record Payment</h3>
                      <form onSubmit={handleUpdatePayment} className={styles.paymentForm}>
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>Payment Amount (Rs) *</label>
                            <div className={styles.amountInputGroup}>
                              <input
                                type="number"
                                name="paid_amount"
                                value={paymentForm.paid_amount}
                                onChange={handlePaymentInputChange}
                                placeholder="Enter amount"
                                step="0.01"
                                max={billDetails.remaining_amount}
                                required
                              />
                              <button 
                                type="button" 
                                onClick={handlePayFullAmount}
                                className={styles.payFullBtn}
                              >
                                Pay Full
                              </button>
                            </div>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Payment Date</label>
                            <input
                              type="date"
                              name="payment_date"
                              value={paymentForm.payment_date}
                              onChange={handlePaymentInputChange}
                            />
                          </div>
                        </div>

                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label>Payment Method</label>
                            <select
                              name="payment_method"
                              value={paymentForm.payment_method}
                              onChange={handlePaymentInputChange}
                            >
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Online">Online Payment</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Reference Number</label>
                            <input
                              type="text"
                              name="reference_number"
                              value={paymentForm.reference_number}
                              onChange={handlePaymentInputChange}
                              placeholder="Transaction/Cheque No."
                            />
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label>Notes</label>
                          <textarea
                            name="notes"
                            value={paymentForm.notes}
                            onChange={handlePaymentInputChange}
                            placeholder="Add notes..."
                            rows="2"
                          />
                        </div>

                        {/* Deduct from Daily Sales Checkbox */}
                        <div className={styles.deductCheckbox}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              name="deduct_from_sales"
                              checked={paymentForm.deduct_from_sales}
                              onChange={handlePaymentInputChange}
                            />
                            <span className={styles.checkmark}></span>
                            <span className={styles.checkboxText}>
                              💵 Deduct from Daily Sales
                              <small>This payment will be added as expense in today's cash register</small>
                            </span>
                          </label>
                        </div>

                        <div className={styles.formActions}>
                          <Button type="submit" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Payment'}
                          </Button>
                          <Button 
                            type="button" 
                            onClick={closeBillDetails}
                            className={styles.cancelBtn}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Payment History */}
                  {paymentHistory.length > 0 && (
                    <div className={styles.historySection}>
                      <h3>Payment History</h3>
                      <div className={styles.historyList}>
                        {paymentHistory.map((payment, idx) => (
                          <div key={idx} className={styles.historyItem}>
                            <div className={styles.historyAmount}>Rs {parseFloat(payment.amount_paid || 0).toFixed(2)}</div>
                            <div className={styles.historyDetails}>
                              <span>{formatDate(payment.payment_date)}</span>
                              <span className={styles.historyMethod}>{payment.payment_method}</span>
                              {payment.reference_number && <span>Ref: {payment.reference_number}</span>}
                            </div>
                            {payment.notes && <p className={styles.historyNotes}>{payment.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fully Paid Message */}
                  {billDetails.payment_status === 'Paid' && (
                    <div className={styles.paidMessage}>
                      <span>✓</span> This bill has been fully paid
                    </div>
                  )}
                </>
              ) : null}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { Input, Select, FormGroup } from '../components/Form';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import UtilityService from '../services/utilityService';
import styles from './Utilities.module.css';
import { 
  FiUpload, FiZap, FiDroplet, FiCalendar, FiDollarSign, 
  FiAlertTriangle, FiCheckCircle, FiClock, FiImage, FiX,
  FiFileText, FiEye, FiTrash2, FiCreditCard, FiBell
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5001';

/**
 * Utility Bills Management Page
 * Features: Bill upload with OCR, payment processing, notifications
 */
const Utilities = () => {
  // ==================== STATE ====================
  const [bills, setBills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bills'); // bills, upload, history
  const [filter, setFilter] = useState({ status: '', bill_type: '' });

  // Upload & OCR state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [billFormData, setBillFormData] = useState({
    bill_type: 'electricity',
    due_date: '',
    total_amount: '',
    late_surcharge: '',
    billing_month: '',
    reference_number: '',
    notes: ''
  });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    amount_paid: '',
    transaction_id: '',
    notes: ''
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);

  // View bill modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewBill, setViewBill] = useState(null);

  // ==================== DATA FETCHING ====================
  const fetchBills = useCallback(async () => {
    try {
      const response = await UtilityService.getAllBills(filter);
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load utility bills');
    }
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const response = await UtilityService.getNotificationSummary();
      setNotifications(response.data.upcoming_bills || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await UtilityService.getPaymentHistory();
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBills(), fetchNotifications(), fetchPaymentHistory()]);
      setLoading(false);
    };
    loadData();
  }, [fetchBills]);

  // ==================== FILE UPLOAD & OCR ====================
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setExtractedData(null);
    }
  };

  const handleOCRProcess = async () => {
    if (!uploadFile) {
      toast.warning('Please select a bill image first');
      return;
    }

    setOcrProcessing(true);
    try {
      const formData = new FormData();
      formData.append('bill_image', uploadFile);

      const response = await UtilityService.processOCR(formData);
      const data = response.data;

      console.log('OCR Response:', data);
      console.log('Extracted Data:', data.extracted_data);
      console.log('Raw Text:', data.raw_text);

      setExtractedData(data.extracted_data);
      
      // Update form with extracted data, converting null to empty strings
      const extracted = data.extracted_data || {};
      
      // Check if any meaningful data was extracted
      const hasData = extracted.total_amount || extracted.due_date || extracted.reference_number;
      
      setBillFormData(prev => ({
        ...prev,
        bill_type: extracted.bill_type || prev.bill_type || 'electricity',
        due_date: extracted.due_date || prev.due_date || '',
        total_amount: extracted.total_amount !== null && extracted.total_amount !== undefined 
          ? String(extracted.total_amount) 
          : prev.total_amount || '',
        late_surcharge: extracted.late_surcharge !== null && extracted.late_surcharge !== undefined 
          ? String(extracted.late_surcharge) 
          : prev.late_surcharge || '',
        billing_month: extracted.billing_month || prev.billing_month || '',
        reference_number: extracted.reference_number || prev.reference_number || ''
      }));

      if (hasData) {
        toast.success('OCR processing complete! Please verify the extracted data.');
      } else {
        toast.warning('Could not extract data from image. Please enter details manually.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('OCR processing failed. Please enter data manually.');
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.warning('Please upload a bill image');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('bill_image', uploadFile);
      // Append all form data including 0 values
      Object.entries(billFormData).forEach(([key, value]) => {
        formData.append(key, value !== null && value !== undefined ? value : '');
      });

      await UtilityService.createBill(formData);
      toast.success('Utility bill added successfully!');

      // Reset form
      setUploadFile(null);
      setUploadPreview(null);
      setExtractedData(null);
      setBillFormData({
        bill_type: 'electricity',
        due_date: '',
        total_amount: '',
        late_surcharge: '',
        billing_month: '',
        reference_number: '',
        notes: ''
      });

      // Refresh data
      fetchBills();
      fetchNotifications();
      setActiveTab('bills');
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to add utility bill');
    }
  };

  // ==================== PAYMENT PROCESSING ====================
  const openPaymentModal = (bill) => {
    if (!bill) return;
    setSelectedBill(bill);
    setPaymentData({
      payment_method: 'cash',
      amount_paid: bill.total_amount || 0,
      transaction_id: '',
      notes: ''
    });
    setPaymentScreenshot(null);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('payment_method', paymentData.payment_method);
      formData.append('amount_paid', paymentData.amount_paid);
      formData.append('transaction_id', paymentData.transaction_id || '');
      formData.append('notes', paymentData.notes);
      if (paymentScreenshot) {
        formData.append('payment_screenshot', paymentScreenshot);
      }

      await UtilityService.markAsPaid(selectedBill.id, formData);
      toast.success('Bill marked as paid successfully!');

      setShowPaymentModal(false);
      fetchBills();
      fetchNotifications();
      fetchPaymentHistory();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  // ==================== DELETE BILL ====================
  const handleDeleteBill = async (bill) => {
    if (!bill) return;
    if (bill.status === 'paid') {
      toast.error('Cannot delete a paid bill');
      return;
    }

    if (window.confirm(`Delete ${bill.bill_type || 'this'} bill for ${bill.billing_month || 'this month'}?`)) {
      try {
        await UtilityService.deleteBill(bill.id);
        toast.success('Bill deleted successfully');
        fetchBills();
        fetchNotifications();
      } catch (error) {
        toast.error('Failed to delete bill');
      }
    }
  };

  // ==================== VIEW BILL ====================
  const openViewModal = (bill) => {
    setViewBill(bill);
    setShowViewModal(true);
  };

  // ==================== HELPERS ====================
  const getStatusBadge = (bill) => {
    if (!bill) return <span className={styles.statusBadge}>-</span>;
    const type = bill.notification_type || 'info';
    const statusMap = {
      overdue: { class: styles.statusOverdue, icon: <FiAlertTriangle />, text: 'OVERDUE' },
      warning: { class: styles.statusWarning, icon: <FiClock />, text: `Due in ${bill.days_until_due || 0} days` },
      success: { class: styles.statusPaid, icon: <FiCheckCircle />, text: 'PAID' },
      info: { class: styles.statusPending, icon: <FiClock />, text: 'PENDING' }
    };
    const status = statusMap[type] || statusMap.info;
    return (
      <span className={`${styles.statusBadge} ${status.class}`}>
        {status.icon} {status.text}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num === 0) return 'Rs. 0';
    return `Rs. ${num.toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // ==================== RENDER ====================
  if (loading) {
    return <div className={styles.loading}>Loading utility bills...</div>;
  }

  return (
    <div className={styles.utilities}>
      <div className={styles.header}>
        <h1><FiZap /> Utility Bills</h1>
        <p>Manage electricity and gas bills with smart notifications</p>
      </div>

      {/* Notification Summary */}
      {notifications.length > 0 && (
        <div className={styles.notificationBar}>
          <FiBell className={styles.bellIcon} />
          <div className={styles.notifContent}>
            {notifications.map((notif, idx) => (
              <span key={idx} className={`${styles.notifItem} ${styles[notif.notification_type]}`}>
                {notif.bill_type?.toUpperCase() || 'BILL'}: {formatCurrency(notif.total_amount)} 
                {notif.days_until_due <= 0 ? ' (OVERDUE)' : ` due in ${notif.days_until_due} days`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'bills' ? styles.active : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          <FiFileText /> All Bills
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <FiUpload /> Upload Bill
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FiCreditCard /> Payment History
        </button>
      </div>

      {/* Bills List Tab */}
      {activeTab === 'bills' && (
        <Card title="Utility Bills">
          {/* Filters */}
          <div className={styles.filters}>
            <Select
              value={filter.bill_type}
              onChange={(e) => setFilter({ ...filter, bill_type: e.target.value })}
              options={[
                { value: '', label: 'All Types' },
                { value: 'electricity', label: 'Electricity' },
                { value: 'gas', label: 'Gas' }
              ]}
            />
            <Select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              options={[
                { value: '', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'paid', label: 'Paid' }
              ]}
            />
          </div>

          {/* Bills Table */}
          <div className={styles.tableWrapper}>
            <Table
              columns={[
                { 
                  key: 'bill_type', 
                  label: 'Type',
                  render: (value, row) => (
                    <span className={styles.billType}>
                      {row?.bill_type === 'electricity' ? <FiZap /> : <FiDroplet />}
                      {row?.bill_type?.toUpperCase() || '-'}
                    </span>
                  )
                },
                { key: 'billing_month', label: 'Month' },
                { key: 'reference_number', label: 'Ref #' },
                { 
                  key: 'total_amount', 
                  label: 'Amount',
                  render: (value) => formatCurrency(value)
                },
                { 
                  key: 'due_date', 
                  label: 'Due Date',
                  render: (value) => formatDate(value)
                },
                { 
                  key: 'late_surcharge', 
                  label: 'Late Fee',
                  render: (value) => formatCurrency(value)
                },
                { 
                  key: 'status', 
                  label: 'Status',
                  render: (value, row) => getStatusBadge(row)
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (value, row) => (
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => openViewModal(row)}
                        title="View Bill"
                      >
                        <FiEye />
                      </button>
                      {row?.status !== 'paid' && (
                        <>
                          <button 
                            className={`${styles.actionBtn} ${styles.payBtn}`}
                            onClick={() => openPaymentModal(row)}
                            title="Mark as Paid"
                          >
                            <FiCreditCard />
                          </button>
                          <button 
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDeleteBill(row)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  )
                }
              ]}
              data={bills}
              emptyMessage="No utility bills found"
            />
          </div>
        </Card>
      )}

      {/* Upload Bill Tab */}
      {activeTab === 'upload' && (
        <div className={styles.uploadSection}>
          <Card title="Upload Bill Image">
            <div className={styles.uploadArea}>
              <div className={styles.dropzone}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                  id="billImageInput"
                  className={styles.fileInput}
                />
                <label htmlFor="billImageInput" className={styles.dropzoneLabel}>
                  {uploadPreview ? (
                    <img src={uploadPreview} alt="Bill preview" className={styles.preview} />
                  ) : (
                    <>
                      <FiUpload size={48} />
                      <span>Click or drag bill image here</span>
                      <span className={styles.hint}>Supports: JPG, PNG, GIF (Max 10MB)</span>
                    </>
                  )}
                </label>
              </div>

              {uploadFile && (
                <div className={styles.ocrActions}>
                  <Button 
                    onClick={handleOCRProcess} 
                    disabled={ocrProcessing}
                    className={styles.ocrBtn}
                  >
                    {ocrProcessing ? (
                      <>Processing OCR...</>
                    ) : (
                      <><FiImage /> Extract Data with OCR</>
                    )}
                  </Button>
                </div>
              )}

              {extractedData && (
                <div className={styles.ocrResult}>
                  <span className={styles.ocrBadge}>
                    <FiCheckCircle /> OCR Data Extracted - Please verify below
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Bill Details">
            <form onSubmit={handleBillSubmit}>
              <div className={styles.formGrid}>
                <FormGroup label="Bill Type">
                  <Select
                    value={billFormData.bill_type}
                    onChange={(e) => setBillFormData({ ...billFormData, bill_type: e.target.value })}
                    options={[
                      { value: 'electricity', label: 'Electricity' },
                      { value: 'gas', label: 'Gas' }
                    ]}
                    required
                  />
                </FormGroup>

                <FormGroup label="Due Date">
                  <Input
                    type="date"
                    value={billFormData.due_date}
                    onChange={(e) => setBillFormData({ ...billFormData, due_date: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup label="Total Amount (Rs.)">
                  <Input
                    type="number"
                    value={billFormData.total_amount}
                    onChange={(e) => setBillFormData({ ...billFormData, total_amount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </FormGroup>

                <FormGroup label="Late Surcharge (Rs.)">
                  <Input
                    type="number"
                    value={billFormData.late_surcharge}
                    onChange={(e) => setBillFormData({ ...billFormData, late_surcharge: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                  />
                </FormGroup>

                <FormGroup label="Billing Month">
                  <Input
                    type="text"
                    value={billFormData.billing_month}
                    onChange={(e) => setBillFormData({ ...billFormData, billing_month: e.target.value })}
                    placeholder="e.g., January 2026"
                  />
                </FormGroup>

                <FormGroup label="Reference Number">
                  <Input
                    type="text"
                    value={billFormData.reference_number}
                    onChange={(e) => setBillFormData({ ...billFormData, reference_number: e.target.value })}
                    placeholder="Bill reference number"
                  />
                </FormGroup>

                <FormGroup label="Notes" className={styles.fullWidth}>
                  <Input
                    type="text"
                    value={billFormData.notes}
                    onChange={(e) => setBillFormData({ ...billFormData, notes: e.target.value })}
                    placeholder="Additional notes (optional)"
                  />
                </FormGroup>
              </div>

              <div className={styles.formActions}>
                <Button type="submit" disabled={!uploadFile}>
                  <FiCheckCircle /> Save Bill
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <Card title="Payment History">
          <div className={styles.tableWrapper}>
            <Table
              columns={[
                { 
                  key: 'bill_type', 
                  label: 'Type',
                  render: (value, row) => (
                    <span className={styles.billType}>
                      {row?.bill_type === 'electricity' ? <FiZap /> : <FiDroplet />}
                      {row?.bill_type?.toUpperCase() || '-'}
                    </span>
                  )
                },
                { key: 'billing_month', label: 'Bill Month' },
                { 
                  key: 'amount_paid', 
                  label: 'Amount Paid',
                  render: (value) => formatCurrency(value)
                },
                { 
                  key: 'payment_date', 
                  label: 'Payment Date',
                  render: (value) => formatDate(value)
                },
                { 
                  key: 'payment_method', 
                  label: 'Method',
                  render: (value) => (
                    <span className={styles.paymentMethod}>
                      {value?.replace('_', ' ').toUpperCase() || '-'}
                    </span>
                  )
                },
                {
                  key: 'screenshot',
                  label: 'Receipt',
                  render: (value, row) => row?.payment_screenshot ? (
                    <a 
                      href={`${API_BASE}${row.payment_screenshot}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.receiptLink}
                    >
                      <FiImage /> View
                    </a>
                  ) : '-'
                },
                {
                  key: 'bill_image',
                  label: 'Bill',
                  render: (value, row) => row?.bill_image ? (
                    <a 
                      href={`${API_BASE}${row.bill_image}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.receiptLink}
                    >
                      <FiFileText /> View
                    </a>
                  ) : '-'
                }
              ]}
              data={paymentHistory}
              emptyMessage="No payment history found"
            />
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><FiCreditCard /> Mark Bill as Paid</h2>
              <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}>
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.billSummary}>
                <div className={styles.summaryItem}>
                  <span>Bill Type</span>
                  <strong>{selectedBill.bill_type?.toUpperCase() || '-'}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>Amount Due</span>
                  <strong>{formatCurrency(selectedBill.total_amount)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>Late Surcharge</span>
                  <strong>{formatCurrency(selectedBill.late_surcharge)}</strong>
                </div>
                {selectedBill.days_until_due <= 0 && (
                  <div className={styles.summaryItem}>
                    <span>Total with Fine</span>
                    <strong className={styles.overdue}>
                      {formatCurrency(parseFloat(selectedBill.total_amount) + parseFloat(selectedBill.late_surcharge || 0))}
                    </strong>
                  </div>
                )}
              </div>

              <form onSubmit={handlePaymentSubmit}>
                <FormGroup label="Payment Method">
                  <Select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    options={[
                      { value: 'cash', label: 'Cash' },
                      { value: 'bank', label: 'Bank Transfer' },
                      { value: 'online_app', label: 'Online App (JazzCash, EasyPaisa, etc.)' }
                    ]}
                    required
                  />
                </FormGroup>

                <FormGroup label="Amount Paid (Rs.)">
                  <Input
                    type="number"
                    value={paymentData.amount_paid}
                    onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                    step="0.01"
                    required
                  />
                </FormGroup>

                {(paymentData.payment_method === 'bank' || paymentData.payment_method === 'online_app') && (
                  <FormGroup label="Transaction ID / Reference Number">
                    <Input
                      type="text"
                      value={paymentData.transaction_id}
                      onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                      placeholder="Enter transaction ID or reference number"
                      required={paymentData.payment_method !== 'cash'}
                    />
                  </FormGroup>
                )}

                {paymentData.payment_method === 'online_app' && (
                  <FormGroup label="Payment Screenshot (Recommended)">
                    <div className={styles.screenshotUpload}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentScreenshot(e.target.files[0])}
                        id="screenshotInput"
                        className={styles.fileInput}
                      />
                      <label htmlFor="screenshotInput" className={styles.screenshotLabel}>
                        <FiUpload /> {paymentScreenshot ? paymentScreenshot.name : 'Upload Screenshot'}
                      </label>
                    </div>
                  </FormGroup>
                )}

                <FormGroup label="Notes (Optional)">
                  <Input
                    type="text"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Payment notes"
                  />
                </FormGroup>

                <div className={styles.modalActions}>
                  <Button type="button" onClick={() => setShowPaymentModal(false)} className={styles.cancelBtn}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <FiCheckCircle /> Confirm Payment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {showViewModal && viewBill && (
        <div className={styles.modalOverlay} onClick={() => setShowViewModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><FiEye /> Bill Details</h2>
              <button className={styles.closeBtn} onClick={() => setShowViewModal(false)}>
                <FiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              {viewBill.image_path && (
                <div className={styles.billImageView}>
                  <img 
                    src={`${API_BASE}${viewBill.image_path}`} 
                    alt="Bill" 
                    className={styles.billImage}
                  />
                </div>
              )}

              <div className={styles.billDetails}>
                <div className={styles.detailRow}>
                  <span>Bill Type</span>
                  <strong>{viewBill.bill_type?.toUpperCase() || '-'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Billing Month</span>
                  <strong>{viewBill.billing_month || '-'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Reference Number</span>
                  <strong>{viewBill.reference_number || '-'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Due Date</span>
                  <strong>{formatDate(viewBill.due_date)}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Total Amount</span>
                  <strong>{formatCurrency(viewBill.total_amount)}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Late Surcharge</span>
                  <strong>{formatCurrency(viewBill.late_surcharge)}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Status</span>
                  {getStatusBadge(viewBill)}
                </div>
                {viewBill.payment_method && (
                  <>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                      <span>Payment Method</span>
                      <strong>{viewBill.payment_method?.replace('_', ' ').toUpperCase() || '-'}</strong>
                    </div>
                    <div className={styles.detailRow}>
                      <span>Payment Date</span>
                      <strong>{formatDate(viewBill.payment_date)}</strong>
                    </div>
                    {viewBill.transaction_id && (
                      <div className={styles.detailRow}>
                        <span>Transaction ID</span>
                        <strong className={styles.transactionId}>{viewBill.transaction_id}</strong>
                      </div>
                    )}
                    {viewBill.payment_screenshot && (
                      <div className={styles.detailRow}>
                        <span>Payment Receipt</span>
                        <a 
                          href={`${API_BASE}${viewBill.payment_screenshot}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.receiptLink}
                        >
                          <FiImage /> View Receipt
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilities;

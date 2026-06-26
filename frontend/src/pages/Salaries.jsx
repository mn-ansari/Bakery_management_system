import React, { useState, useEffect } from 'react';
import SalaryService from '../services/salaryService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from './Salaries.module.css';

const Salaries = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryStatus, setSalaryStatus] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [logsModalEmployee, setLogsModalEmployee] = useState(null);
  const [empLogs, setEmpLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: 'advance',
    reason: '',
    payment_date: new Date().toISOString().split('T')[0]
  });

  // Quick amount buttons
  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  useEffect(() => {
    fetchMonthlySalaryStatus();
  }, [selectedMonth]);

  const fetchMonthlySalaryStatus = async () => {
    setLoading(true);
    try {
      const response = await SalaryService.getMonthlySalaryStatus(selectedMonth);
      setSalaryStatus(response.data || []);
    } catch (err) {
      setError('Failed to load salary data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogs = async (e, emp) => {
    e.stopPropagation(); // Prevent card selection
    setLogsModalEmployee(emp);
    try {
      const response = await SalaryService.getEmployeeSalaryHistory(emp.id);
      setEmpLogs(response.data || []);
    } catch (err) {
      console.error('Failed to load employee logs:', err);
      setEmpLogs([]);
    }
  };

  const fetchEmployeeHistory = async (employeeId) => {
    try {
      const response = await SalaryService.getEmployeeSalaryHistory(employeeId);
      setPaymentHistory(response.data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowPaymentForm(true);
    setPaymentForm({
      amount: '',
      payment_type: 'advance',
      reason: '',
      payment_date: new Date().toISOString().split('T')[0]
    });
    fetchEmployeeHistory(employee.id);
  };

  const handleQuickAmount = (amount) => {
    setPaymentForm(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !paymentForm.amount) {
      setError('Please enter amount');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    const remaining = selectedEmployee.remaining_amount || selectedEmployee.monthly_salary;
    
    if (amount > remaining) {
      setError(`Amount exceeds remaining salary (Rs ${remaining.toLocaleString()})`);
      return;
    }

    try {
      await SalaryService.recordPayment({
        employee_id: selectedEmployee.id,
        amount: amount,
        payment_date: paymentForm.payment_date,
        payment_type: paymentForm.payment_type,
        reason: paymentForm.reason || `${paymentForm.payment_type} payment`,
        month_year: selectedMonth
      });

      setSuccess(`Rs ${amount.toLocaleString()} paid to ${selectedEmployee.name}`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh data
      fetchMonthlySalaryStatus();
      fetchEmployeeHistory(selectedEmployee.id);
      
      // Reset form
      setPaymentForm({
        amount: '',
        payment_type: 'advance',
        reason: '',
        payment_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError('Payment failed: ' + err.message);
    }
  };

  const handleFullSalary = async () => {
    if (!selectedEmployee) return;
    const remaining = selectedEmployee.remaining_amount;
    if (remaining <= 0) {
      setError('Salary already fully paid');
      return;
    }
    
    setPaymentForm(prev => ({
      ...prev,
      amount: remaining.toString(),
      payment_type: 'full',
      reason: 'Full salary settlement'
    }));
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatLogDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'advance': return '#ff6b35';
      case 'partial': return '#00d4ff';
      case 'full': return '#00ff88';
      default: return '#64748b';
    }
  };

  // Calculate totals
  const totalMonthly = salaryStatus.reduce((sum, e) => sum + parseFloat(e.monthly_salary || 0), 0);
  const totalPaid = salaryStatus.reduce((sum, e) => sum + parseFloat(e.paid_amount || 0), 0);
  const totalRemaining = totalMonthly - totalPaid;

  return (
    <div className={styles.salaries}>
      <h1>Salary Management</h1>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {/* Stats Section */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Monthly</div>
            <div className={styles.statValue}>Rs {totalMonthly.toLocaleString()}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.paidCard}`}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Paid This Month</div>
            <div className={styles.statValue}>Rs {totalPaid.toLocaleString()}</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.remainingCard}`}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Remaining</div>
            <div className={styles.statValue}>Rs {totalRemaining.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className={styles.monthSelector}>
        <label>Select Month:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className={styles.monthInput}
        />
      </div>

      <div className={styles.mainContent}>
        {/* Employee List */}
        <div className={styles.employeeList}>
          <h2>Employees</h2>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <div className={styles.employeeGrid}>
              {salaryStatus.map((emp) => {
                const paidPercent = (emp.paid_amount / emp.monthly_salary) * 100;
                const isFullyPaid = paidPercent >= 100;
                
                return (
                  <div
                    key={emp.id}
                    className={`${styles.employeeCard} ${selectedEmployee?.id === emp.id ? styles.selected : ''} ${isFullyPaid ? styles.fullyPaid : ''}`}
                    onClick={() => handleSelectEmployee(emp)}
                  >
                    <div className={styles.empHeader}>
                      <div className={styles.empAvatar}>
                        {emp.name?.charAt(0)}
                      </div>
                      <div className={styles.empInfo}>
                        <div className={styles.empName}>{emp.name}</div>
                        <div className={styles.empRole}>{emp.role}</div>
                      </div>
                      {isFullyPaid && <span className={styles.paidBadge}>PAID</span>}
                    </div>
                    
                    <div className={styles.empSalaryInfo}>
                      <div className={styles.salaryRow}>
                        <span>Monthly Salary</span>
                        <span className={styles.salaryAmount}>Rs {parseFloat(emp.monthly_salary).toLocaleString()}</span>
                      </div>
                      <div className={styles.salaryRow}>
                        <span>Advances Taken</span>
                        <span className={styles.advanceAmount}>Rs {parseFloat(emp.paid_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className={`${styles.salaryRow} ${styles.remainingRow}`}>
                        <span>Remaining</span>
                        <span className={styles.remainingAmount}>Rs {parseFloat(emp.remaining_amount || emp.monthly_salary).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${Math.min(paidPercent, 100)}%`,
                          background: isFullyPaid ? '#00ff88' : 'linear-gradient(90deg, #ff6b35, #00d4ff)'
                        }}
                      />
                    </div>
                    <div className={styles.progressLabel}>
                      {emp.advance_count || 0} advance(s) • {paidPercent.toFixed(0)}% paid
                    </div>
                    <button 
                      className={styles.logsBtn}
                      onClick={(e) => handleOpenLogs(e, emp)}
                    >
                      📋 View Logs
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Panel */}
        {showPaymentForm && selectedEmployee && (
          <div className={styles.paymentPanel}>
            <Card title={`Pay ${selectedEmployee.name}`}>
              <div className={styles.selectedEmpInfo}>
                <div className={styles.infoRow}>
                  <span>Monthly Salary:</span>
                  <span className={styles.highlightValue}>Rs {parseFloat(selectedEmployee.monthly_salary).toLocaleString()}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Already Paid:</span>
                  <span className={styles.paidValue}>Rs {parseFloat(selectedEmployee.paid_amount || 0).toLocaleString()}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Remaining Balance:</span>
                  <span className={styles.remainingValue}>Rs {parseFloat(selectedEmployee.remaining_amount || selectedEmployee.monthly_salary).toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className={styles.paymentForm}>
                {/* Quick Amount Buttons */}
                <div className={styles.quickAmounts}>
                  <label>Quick Select:</label>
                  <div className={styles.amountButtons}>
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`${styles.amountBtn} ${paymentForm.amount === amt.toString() ? styles.activeAmount : ''}`}
                        onClick={() => handleQuickAmount(amt)}
                      >
                        Rs {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Amount (Rs)</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className={styles.input}
                    min="1"
                    max={selectedEmployee.remaining_amount || selectedEmployee.monthly_salary}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Payment Type</label>
                  <select
                    value={paymentForm.payment_type}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_type: e.target.value }))}
                    className={styles.select}
                  >
                    <option value="advance">Advance</option>
                    <option value="partial">Partial Payment</option>
                    <option value="full">Full Settlement</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Reason/Note (Optional)</label>
                  <input
                    type="text"
                    value={paymentForm.reason}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Weekly advance, Emergency"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formActions}>
                  <Button type="submit" className={styles.payBtn}>
                    💸 Pay Rs {paymentForm.amount || '0'}
                  </Button>
                  <button 
                    type="button" 
                    className={styles.fullSalaryBtn}
                    onClick={handleFullSalary}
                  >
                    Pay Full Remaining
                  </button>
                </div>
              </form>

              {/* Payment History */}
              <div className={styles.historySection}>
                <h3>Recent Payments</h3>
                {paymentHistory.length === 0 ? (
                  <p className={styles.noHistory}>No payments recorded yet</p>
                ) : (
                  <div className={styles.historyList}>
                    {paymentHistory.slice(0, 10).map((payment, idx) => (
                      <div key={idx} className={styles.historyItem}>
                        <div className={styles.historyLeft}>
                          <span 
                            className={styles.paymentType}
                            style={{ backgroundColor: getPaymentTypeColor(payment.payment_type) }}
                          >
                            {payment.payment_type}
                          </span>
                          <span className={styles.historyReason}>{payment.reason || '-'}</span>
                        </div>
                        <div className={styles.historyRight}>
                          <span className={styles.historyAmount}>Rs {parseFloat(payment.amount).toLocaleString()}</span>
                          <span className={styles.historyDate}>{formatDate(payment.payment_date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Logs Modal */}
      {logsModalEmployee && (
        <div className={styles.modalOverlay} onClick={() => setLogsModalEmployee(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <div className={styles.modalAvatar}>{logsModalEmployee.name?.charAt(0)}</div>
                <div>
                  <h3>{logsModalEmployee.name}</h3>
                  <span className={styles.modalRole}>{logsModalEmployee.role}</span>
                </div>
              </div>
              <button className={styles.modalClose} onClick={() => setLogsModalEmployee(null)}>×</button>
            </div>
            
            <div className={styles.modalStats}>
              <div className={styles.modalStat}>
                <span>Monthly</span>
                <strong>Rs {parseFloat(logsModalEmployee.monthly_salary).toLocaleString()}</strong>
              </div>
              <div className={styles.modalStat}>
                <span>Paid</span>
                <strong className={styles.paidText}>Rs {parseFloat(logsModalEmployee.paid_amount || 0).toLocaleString()}</strong>
              </div>
              <div className={styles.modalStat}>
                <span>Remaining</span>
                <strong className={styles.remainingText}>Rs {parseFloat(logsModalEmployee.remaining_amount || logsModalEmployee.monthly_salary).toLocaleString()}</strong>
              </div>
            </div>

            <div className={styles.modalLogs}>
              <h4>Payment History</h4>
              {empLogs.length === 0 ? (
                <p className={styles.noLogs}>No payments recorded yet</p>
              ) : (
                <div className={styles.logsList}>
                  {empLogs.map((log, idx) => (
                    <div key={idx} className={styles.logItem}>
                      <div className={styles.logContent}>
                        <div className={styles.logMain}>
                          <span className={styles.logAmount}>Rs {parseFloat(log.amount).toLocaleString()}</span>
                          <span 
                            className={styles.logType}
                            style={{ backgroundColor: getPaymentTypeColor(log.payment_type) }}
                          >
                            {log.payment_type}
                          </span>
                        </div>
                        <div className={styles.logMeta}>
                          <span className={styles.logDate}>{formatLogDate(log.payment_date)}</span>
                          {log.reason && <span className={styles.logReason}> • {log.reason}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salaries;

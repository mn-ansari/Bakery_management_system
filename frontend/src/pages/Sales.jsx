import React, { useState, useEffect } from 'react';
import SalesService from '../services/salesService';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import styles from './Sales.module.css';

export default function Sales() {
  const [dailyData, setDailyData] = useState({
    totalSales: '',
    creditGiven: '',
    expenses: [],
    date: new Date().toISOString().split('T')[0]
  });
  
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [savedRecords, setSavedRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Tab and Logs state
  const [activeTab, setActiveTab] = useState('sales');
  const [logsData, setLogsData] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchDailyRecords();
  }, [selectedDate]);

  const fetchDailyRecords = async () => {
    try {
      setLoading(true);
      const response = await SalesService.getSalesByDate(selectedDate);
      const records = Array.isArray(response.data) ? response.data : [];
      setSavedRecords(records);
      
      // Calculate totals from saved records
      const totalSales = records
        .filter(r => r.payment_status === 'Clear')
        .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || 0)), 0);
      const creditGiven = records
        .filter(r => r.payment_status === 'Credit')
        .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || 0)), 0);
      const expenses = records
        .filter(r => r.payment_status === 'Expense')
        .map(r => ({ description: r.buyer_name, amount: Math.abs(parseFloat(r.amount || 0)), id: r.sale_id }));
      
      setDailyData({
        totalSales: totalSales > 0 ? totalSales.toString() : '',
        creditGiven: creditGiven > 0 ? creditGiven.toString() : '',
        expenses: expenses,
        date: selectedDate
      });
    } catch (err) {
      console.error('Failed to load records:', err);
      setSavedRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      setError('Enter expense description and amount');
      return;
    }
    setDailyData(prev => ({
      ...prev,
      expenses: [...prev.expenses, { 
        description: newExpense.description, 
        amount: parseFloat(newExpense.amount),
        isNew: true
      }]
    }));
    setNewExpense({ description: '', amount: '' });
    setError('');
  };

  const handleRemoveExpense = (index) => {
    setDailyData(prev => ({
      ...prev,
      expenses: prev.expenses.filter((_, i) => i !== index)
    }));
  };

  const handleSaveDaily = async () => {
    if (!dailyData.totalSales) {
      setError('Enter total sales amount');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Delete old records for this date first (to update)
      for (const record of savedRecords) {
        try {
          await SalesService.deleteSale(record.sale_id);
        } catch (e) {
          console.log('Delete error:', e);
        }
      }

      // Save total sales as Clear
      if (parseFloat(dailyData.totalSales) > 0) {
        await SalesService.createSale({
          buyer_name: 'Daily Cash Sales',
          amount: parseFloat(dailyData.totalSales),
          payment_status: 'Clear',
          sale_date: selectedDate
        });
      }

      // Save credit given
      if (parseFloat(dailyData.creditGiven) > 0) {
        await SalesService.createSale({
          buyer_name: 'Credit Given',
          amount: parseFloat(dailyData.creditGiven),
          payment_status: 'Credit',
          sale_date: selectedDate
        });
      }

      // Save each expense
      for (const exp of dailyData.expenses) {
        await SalesService.createSale({
          buyer_name: exp.description,
          amount: exp.amount,
          payment_status: 'Expense',
          sale_date: selectedDate
        });
      }

      setSuccess('Daily record saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchDailyRecords();
    } catch (err) {
      setError('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalSales = Math.abs(parseFloat(dailyData.totalSales) || 0);
  const totalExpenses = dailyData.expenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const creditGiven = Math.abs(parseFloat(dailyData.creditGiven) || 0);
  const netCash = totalSales - totalExpenses - creditGiven;

  // Quick expense buttons
  const quickExpenses = [
    { label: 'Egg Supplier', icon: '🥚' },
    { label: 'Flour/Maida', icon: '🌾' },
    { label: 'Sugar', icon: '🍬' },
    { label: 'Milk/Cream', icon: '🥛' },
    { label: 'Gas Bill', icon: '🔥' },
    { label: 'Electricity', icon: '⚡' },
    { label: 'Other', icon: '📦' }
  ];

  // Fetch logs - last 30 days
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const logs = [];
      const today = new Date();
      
      // Get last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const response = await SalesService.getSalesByDate(dateStr);
          const records = Array.isArray(response.data) ? response.data : [];
          
          if (records.length > 0) {
            const sales = records.filter(r => r.payment_status === 'Clear')
              .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || 0)), 0);
            const credit = records.filter(r => r.payment_status === 'Credit')
              .reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || 0)), 0);
            const expenseRecords = records.filter(r => r.payment_status === 'Expense');
            const expenseTotal = expenseRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.amount || 0)), 0);
            
            logs.push({
              date: dateStr,
              totalSales: sales,
              creditGiven: credit,
              expenses: expenseRecords.map(r => ({
                description: r.buyer_name,
                amount: Math.abs(parseFloat(r.amount || 0))
              })),
              expenseTotal: expenseTotal,
              netCash: sales - expenseTotal - credit
            });
          }
        } catch (e) {
          // Skip dates with errors
        }
      }
      
      setLogsData(logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch logs when switching to logs tab
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  return (
    <div className={styles.container}>
      <h1>Daily Cash Register</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          type="button"
          className={`${styles.tab} ${activeTab === 'sales' ? styles.active : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          💰 Daily Sales
        </button>
        <button 
          type="button"
          className={`${styles.tab} ${activeTab === 'logs' ? styles.active : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📊 Sales Logs
        </button>
      </div>

      {/* Daily Sales Tab */}
      {activeTab === 'sales' && (
        <>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

      {/* Date Selector */}
      <div className={styles.dateSelector}>
        <label>📅 Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.dateInput}
        />
      </div>

      {/* Main Cash Summary */}
      <div className={styles.cashSummary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Sales</span>
            <span className={styles.summaryValue}>Rs {totalSales.toLocaleString()}</span>
          </div>
        </div>
        <div className={styles.summaryCardExpense}>
          <div className={styles.summaryIcon}>📤</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Expenses Paid</span>
            <span className={styles.summaryValue}>Rs {totalExpenses.toLocaleString()}</span>
          </div>
        </div>
        <div className={styles.summaryCardCredit}>
          <div className={styles.summaryIcon}>📝</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Credit Given</span>
            <span className={styles.summaryValue}>Rs {creditGiven.toLocaleString()}</span>
          </div>
        </div>
        <div className={styles.summaryCardNet}>
          <div className={styles.summaryIcon}>🏦</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Net Cash</span>
            <span className={`${styles.summaryValue} ${netCash < 0 ? styles.negative : ''}`}>
              Rs {netCash.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column - Entry Forms */}
        <div className={styles.entrySection}>
          {/* Total Sales Entry */}
          <Card className={styles.entryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💵</span>
              <h2>Today's Total Sales</h2>
            </div>
            <div className={styles.bigInput}>
              <span className={styles.currency}>Rs</span>
              <input
                type="number"
                value={dailyData.totalSales}
                onChange={(e) => setDailyData(prev => ({ ...prev, totalSales: e.target.value }))}
                placeholder="0"
                className={styles.salesInput}
              />
            </div>
            <p className={styles.hint}>Enter total cash received from sales today</p>
          </Card>

          {/* Credit Given */}
          <Card className={styles.entryCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📝</span>
              <h2>Credit Given (Udhar)</h2>
            </div>
            <div className={styles.bigInput}>
              <span className={styles.currency}>Rs</span>
              <input
                type="number"
                value={dailyData.creditGiven}
                onChange={(e) => setDailyData(prev => ({ ...prev, creditGiven: e.target.value }))}
                placeholder="0"
                className={styles.creditInput}
              />
            </div>
            <p className={styles.hint}>Total credit given to customers today (no names needed)</p>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSaveDaily} 
            disabled={loading}
            className={styles.saveBtn}
          >
            {loading ? '⏳ Saving...' : '💾 Save Daily Record'}
          </Button>
        </div>

        {/* Right Column - Expenses */}
        <div className={styles.expenseSection}>
          <Card className={styles.expenseCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📤</span>
              <h2>Bills Paid From Cash</h2>
            </div>
            
            {/* Quick Expense Buttons */}
            <div className={styles.quickExpenses}>
              <label>Quick Add:</label>
              <div className={styles.quickBtns}>
                {quickExpenses.map((exp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.quickBtn}
                    onClick={() => setNewExpense(prev => ({ ...prev, description: exp.label }))}
                  >
                    {exp.icon} {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Expense Form */}
            <div className={styles.addExpenseForm}>
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Bill description (e.g., Egg wala)"
                className={styles.expenseInput}
              />
              <div className={styles.expenseAmountRow}>
                <div className={styles.amountInputWrapper}>
                  <span>Rs</span>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    className={styles.expenseAmountInput}
                  />
                </div>
                <button type="button" onClick={handleAddExpense} className={styles.addBtn}>
                  + Add
                </button>
              </div>
            </div>

            {/* Expense List */}
            <div className={styles.expenseList}>
              {dailyData.expenses.length === 0 ? (
                <p className={styles.noExpenses}>No expenses added yet</p>
              ) : (
                dailyData.expenses.map((exp, idx) => (
                  <div key={idx} className={styles.expenseItem}>
                    <div className={styles.expenseInfo}>
                      <span className={styles.expenseDesc}>{exp.description}</span>
                      <span className={styles.expenseAmount}>Rs {exp.amount.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveExpense(idx)}
                      className={styles.removeBtn}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {dailyData.expenses.length > 0 && (
              <div className={styles.expenseTotal}>
                <span>Total Expenses:</span>
                <span>Rs {totalExpenses.toLocaleString()}</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Net Cash Calculation */}
      <div className={styles.netCashSection}>
        <div className={styles.calculation}>
          <div className={styles.calcRow}>
            <span>Total Sales</span>
            <span className={styles.positive}>+ Rs {totalSales.toLocaleString()}</span>
          </div>
          <div className={styles.calcRow}>
            <span>Expenses Paid</span>
            <span className={styles.negativeText}>- Rs {totalExpenses.toLocaleString()}</span>
          </div>
          <div className={styles.calcRow}>
            <span>Credit Given</span>
            <span className={styles.negativeText}>- Rs {creditGiven.toLocaleString()}</span>
          </div>
          <div className={styles.calcTotal}>
            <span>💵 Cash In Hand</span>
            <span className={netCash >= 0 ? styles.positive : styles.negativeText}>
              Rs {netCash.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Sales Logs Tab */}
      {activeTab === 'logs' && (
        <div className={styles.logsSection}>
          <h2>📊 Daily Sales Logs (Last 30 Days)</h2>
          <div className={styles.logsContainer}>
            {logsLoading ? (
              <div className={styles.loadingLogs}>Loading logs...</div>
            ) : logsData.length === 0 ? (
              <div className={styles.noLogs}>No sales records found</div>
            ) : (
              logsData.map((log, idx) => (
                <div key={idx} className={styles.logCard}>
                  <div className={styles.logDate}>
                    📅 {new Date(log.date).toLocaleDateString('en-PK', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className={styles.logSummary}>
                    <div className={styles.logItem}>
                      <span className={styles.logLabel}>💰 Total Sales:</span>
                      <span className={styles.logValueGreen}>Rs {log.totalSales.toLocaleString()}</span>
                    </div>
                    <div className={styles.logItem}>
                      <span className={styles.logLabel}>📝 Credit Given:</span>
                      <span className={styles.logValueOrange}>Rs {log.creditGiven.toLocaleString()}</span>
                    </div>
                    <div className={styles.logItem}>
                      <span className={styles.logLabel}>📤 Total Expenses:</span>
                      <span className={styles.logValueRed}>Rs {log.expenseTotal.toLocaleString()}</span>
                    </div>
                    {log.expenses.length > 0 && (
                      <div className={styles.logExpenses}>
                        <span className={styles.expenseListTitle}>Expense Breakdown:</span>
                        {log.expenses.map((exp, i) => (
                          <div key={i} className={styles.logExpenseItem}>
                            <span>{exp.description}</span>
                            <span>Rs {exp.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={styles.logNetCash}>
                      <span>💵 Net Cash:</span>
                      <span className={log.netCash >= 0 ? styles.logValueGreen : styles.logValueRed}>
                        Rs {log.netCash.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

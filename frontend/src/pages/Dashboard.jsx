import React from 'react';
import { Card, StatsCard } from '../components/Card';
import ReportService from '../services/reportService';
import UtilityService from '../services/utilityService';
import SalesService from '../services/salesService';
import styles from './Dashboard.module.css';
import { FiShoppingCart, FiBarChart2, FiUsers, FiClipboard, FiClock, FiCheckCircle, FiBell, FiAlertCircle, FiPackage, FiZap, FiX, FiFileText } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [utilityNotifications, setUtilityNotifications] = React.useState([]);
  const [billNotifications, setBillNotifications] = React.useState([]);
  // Load dismissed notifications from localStorage
  const [dismissedNotifications, setDismissedNotifications] = React.useState(() => {
    try {
      const saved = localStorage.getItem('dismissedNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save dismissed notifications to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissedNotifications));
  }, [dismissedNotifications]);

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, utilityRes, billsRes] = await Promise.all([
          ReportService.getDashboardSummary(),
          UtilityService.getNotificationSummary().catch(err => {
            console.error('Utility notification error:', err);
            return { data: { upcoming_bills: [] } };
          }),
          // Get all bills, then filter for unpaid ones (Pending + Partial)
          SalesService.getAllBills('all').catch(err => {
            console.error('Bills notification error:', err);
            return { data: [] };
          })
        ]);
        setSummary(summaryRes.data.dashboard);
        
        // Transform utility notifications
        console.log('Utility Response:', utilityRes);
        const utilityBills = utilityRes.data?.upcoming_bills || [];
        console.log('Utility Bills:', utilityBills);
        const utilNotifs = utilityBills.map(bill => ({
          id: `util-${bill.id}`,
          type: bill.notification_type === 'overdue' ? 'warning' : 
                bill.notification_type === 'warning' ? 'warning' : 'info',
          title: bill.days_until_due === 1 ? `⚠️ ${bill.bill_type.toUpperCase()} BILL DUE TOMORROW!` :
                 `${bill.bill_type.toUpperCase()} BILL ${bill.days_until_due <= 0 ? 'OVERDUE' : 'DUE SOON'}`,
          desc: `Rs. ${bill.total_amount} ${bill.days_until_due <= 0 ? '- Payment overdue!' : 
                 bill.days_until_due === 1 ? '- Pay today to avoid late charges!' : 
                 `due in ${bill.days_until_due} days`}`,
          time: bill.days_until_due <= 0 ? 'Overdue' : bill.days_until_due === 1 ? '1 DAY LEFT!' : `${bill.days_until_due} days`,
          isNew: bill.days_until_due <= 3,
          isUtility: true,
          isUrgent: bill.days_until_due === 1
        }));
        setUtilityNotifications(utilNotifs);

        // Transform pending sales bills to notifications
        const allBills = billsRes.data || [];
        // Filter for unpaid bills (Pending or Partial)
        const pendingBills = allBills.filter(bill => 
          bill.payment_status === 'Pending' || bill.payment_status === 'Partial'
        );
        console.log('Pending Bills from API:', pendingBills);
        const billNotifs = pendingBills.slice(0, 5).map(bill => ({
          id: `bill-${bill.bill_id}`,
          type: bill.payment_status === 'Pending' ? 'warning' : 'info',
          title: `${bill.payment_status.toUpperCase()} BILL #${bill.bill_id}`,
          desc: `${bill.supplier_names || 'Production Cost'} - Rs. ${bill.remaining_amount?.toLocaleString() || bill.total_amount?.toLocaleString()} remaining`,
          time: new Date(bill.bill_date).toLocaleDateString(),
          isNew: true,
          isBill: true,
          isUrgent: bill.remaining_amount > 10000
        }));
        setBillNotifications(billNotifs);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Handler to dismiss a notification
  const handleDismissNotification = (notifId) => {
    setDismissedNotifications(prev => [...prev, notifId]);
  };

  // Handler to clear all notifications
  const handleClearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setDismissedNotifications(allIds);
  };

  // Handler to reset/show all notifications again
  const handleResetNotifications = () => {
    setDismissedNotifications([]);
    localStorage.removeItem('dismissedNotifications');
  };

  // Combine utility and bill notifications (removed static fake notifications)
  const allNotifications = [...utilityNotifications, ...billNotifications];
  const notifications = allNotifications.filter(n => !dismissedNotifications.includes(n.id));
  const hasHiddenNotifications = allNotifications.length > notifications.length;

  // Chart configuration
  const chartLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 15000, 13500, 18000],
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#00ff88',
      },
      {
        label: 'Sales',
        data: [8000, 11000, 9500, 14000],
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#00d4ff',
      },
      {
        label: 'Production Cost',
        data: [4000, 5000, 4500, 5500],
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#ff6b35',
      },
      {
        label: 'Salaries',
        data: [2000, 2000, 2000, 2500],
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#ffc107',
      },
      {
        label: 'Utilities',
        data: [500, 600, 550, 700],
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#9c27b0',
      },
      {
        label: 'Profit',
        data: [5500, 7400, 6450, 9300],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4caf50',
        borderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: {
            family: 'Rajdhani',
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: 'Orbitron',
          size: 12,
        },
        bodyFont: {
          family: 'Rajdhani',
          size: 14,
        },
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': Rs ' + context.raw.toLocaleString();
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'Share Tech Mono',
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: {
            family: 'Share Tech Mono',
            size: 11,
          },
          callback: function(value) {
            return 'Rs ' + value.toLocaleString();
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.dashboardLayout}>
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <StatsCard 
          title="Today's Sales" 
          value={`Rs ${summary?.today?.sales?.amount || 0}`}
          icon={<FiShoppingCart />}
          change={summary?.today?.sales?.change || 15}
          subtitle="DAILY REVENUE"
        />
        <StatsCard 
          title="Inventory Value" 
          value={`Rs ${summary?.inventory_value || '12,450'}`}
          icon={<FiPackage />}
          change={summary?.inventory_change || 3}
          subtitle="STOCK VALUE"
        />
        <StatsCard 
          title="Active Employees" 
          value={summary?.employees?.active || 0}
          icon={<FiUsers />}
          change={0}
          subtitle="ON DUTY TODAY"
        />
        <StatsCard 
          title="Low Stock Alerts" 
          value={summary?.today?.low_stock_alerts || 0}
          icon={<FiBarChart2 />}
          change={-(summary?.today?.low_stock_alerts || 5)}
          subtitle="ITEMS NEED RESTOCK"
        />
      </div>

      <div className={styles.chartSection}>
        <Card title="Monthly Overview">
          <div className={styles.chartContainer}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>
      </div>
    </div>

      {/* Right Sidebar */}
      <div className={styles.rightSidebar}>
        {/* Time & Date Section */}
        <div className={styles.timeSection}>
          <div className={styles.dayLabel}>{currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</div>
          <div className={styles.dateLabel}>{currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</div>
          <div className={styles.timeDisplay}>{formatTime(currentTime)}</div>
          <div className={styles.clockIcon}>
            <FiClock />
          </div>
          <div className={styles.locationInfo}>
            <span className={styles.temp}>🏪</span>
            <span>NAFEES BAKERY</span>
          </div>
        </div>

        {/* Notifications Section */}
        <div className={styles.notificationsSection}>
          <div className={styles.notifHeader}>
            <span><FiBell /> NOTIFICATIONS</span>
            {notifications.length > 0 && (
              <button className={styles.clearBtn} onClick={handleClearAllNotifications}>CLEAR ALL</button>
            )}
          </div>
          <div className={styles.notifList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyNotif}>
                <FiBell style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                  {allNotifications.length === 0 ? 'No new notifications' : 'All notifications cleared'}
                </p>
                {hasHiddenNotifications && (
                  <button className={styles.resetBtn} onClick={handleResetNotifications}>
                    SHOW DISMISSED ({allNotifications.length})
                  </button>
                )}
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`${styles.notifItem} ${styles[notif.type]} ${notif.isUrgent ? styles.urgent : ''}`}>
                  <div className={styles.notifIcon}>
                    {notif.isUtility && <FiZap />}
                    {notif.isBill && <FiFileText />}
                    {!notif.isUtility && !notif.isBill && notif.type === 'success' && <FiCheckCircle />}
                    {!notif.isUtility && !notif.isBill && notif.type === 'warning' && <FiAlertCircle />}
                    {!notif.isUtility && !notif.isBill && notif.type === 'info' && <FiBell />}
                  </div>
                  <div className={styles.notifContent}>
                    <div className={styles.notifTitle}>
                      {notif.title}
                      {notif.isNew && <span className={styles.newBadge}>NEW</span>}
                    </div>
                    <p className={styles.notifDesc}>{notif.desc}</p>
                    <span className={styles.notifTime}>{notif.time}</span>
                  </div>
                  <button 
                    className={styles.dismissBtn} 
                    onClick={() => handleDismissNotification(notif.id)}
                    title="Dismiss notification"
                  >
                    <FiX />
                  </button>
                </div>
              ))
            )}
          </div>
          {hasHiddenNotifications && notifications.length > 0 && (
            <button className={styles.showAllBtn} onClick={handleResetNotifications}>
              SHOW HIDDEN ({allNotifications.length - notifications.length})
            </button>
          )}
          {!hasHiddenNotifications && notifications.length > 0 && (
            <button className={styles.showAllBtn}>SHOWING ALL ({notifications.length})</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

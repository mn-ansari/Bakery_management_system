import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import styles from './Navigation.module.css';

export const Navigation = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '🍞' },
    { path: '/batch-tracking', label: 'Batch Tracking', icon: '📦' },
    { path: '/inventory', label: 'Inventory', icon: '📋' },
    { path: '/production', label: 'Production', icon: '🏭' },
    { path: '/sales', label: 'Sales', icon: '💰' },
    { path: '/payments', label: 'Payments', icon: '💳' },
    { path: '/utilities', label: 'Utilities', icon: '⚡' },
    { path: '/employees', label: 'Employees', icon: '👥' },
    { path: '/salaries', label: 'Salaries', icon: '💵' },
    { path: '/reports', label: 'Reports', icon: '📈' },
  ];

  return (
    <nav className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo Section */}
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>🍞</div>
        {!collapsed && (
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>NAFEES</span>
            <span className={styles.logoSubtitle}>BAKERY</span>
          </div>
        )}
        <button 
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Menu Items */}
      <ul className={styles.menu}>
        {menuItems.map((item, index) => (
          <li 
            key={item.path}
            className={styles.menuItem}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <a 
              href={item.path}
              className={`${styles.menuLink} ${location.pathname === item.path ? styles.active : ''}`}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.menuLabel}>{item.label}</span>}
              {location.pathname === item.path && <span className={styles.activeIndicator} />}
            </a>
          </li>
        ))}
      </ul>

      {/* User Section */}
      <div className={styles.userSection}>
        <div className={styles.userAvatar}>
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        {!collapsed && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.full_name}</span>
            <span className={styles.userRole}>Administrator</span>
          </div>
        )}
        <button 
          className={styles.logoutBtn}
          onClick={logout}
          title="Logout"
        >
          ⏻
        </button>
      </div>
    </nav>
  );
};

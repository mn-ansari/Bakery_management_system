import React from 'react';
import styles from './Card.module.css';

export const Card = ({ title, children, footer }) => {
  return (
    <div className={styles.card}>
      {title && <div className={styles.cardHeader}>{title}</div>}
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
};

export const StatsCard = ({ title, value, icon, change, subtitle }) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  return (
    <div className={styles.statsCard}>
      <div className={styles.statsLeft}>
        <div className={styles.statsIcon}>{icon}</div>
        <div className={styles.statsContent}>
          <div className={styles.statsTitle}>{title}</div>
          <div className={styles.statsValue}>{value}</div>
          {subtitle && <div className={styles.statsSubtitle}>{subtitle}</div>}
        </div>
      </div>
      
      {/* Animated Flowing Arrows */}
      {change !== undefined && change !== 0 && (
        <div className={`${styles.arrowContainer} ${isPositive ? styles.arrowUp : styles.arrowDown}`}>
          <div className={styles.arrowStack}>
            <span className={`${styles.arrow} ${styles.arrow1}`}>
              {isPositive ? '▲' : '▼'}
            </span>
            <span className={`${styles.arrow} ${styles.arrow2}`}>
              {isPositive ? '▲' : '▼'}
            </span>
            <span className={`${styles.arrow} ${styles.arrow3}`}>
              {isPositive ? '▲' : '▼'}
            </span>
            <span className={`${styles.arrow} ${styles.arrow4}`}>
              {isPositive ? '▲' : '▼'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import styles from './Button.module.css';

export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, type = 'button' }) => {
  return (
    <button 
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export const SecondaryButton = ({ children, ...props }) => (
  <Button variant="secondary" {...props}>{children}</Button>
);

export const DangerButton = ({ children, ...props }) => (
  <Button variant="danger" {...props}>{children}</Button>
);

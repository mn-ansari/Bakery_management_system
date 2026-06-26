import React from 'react';
import styles from './Form.module.css';

export const FormGroup = ({ label, error, children }) => {
  return (
    <div className={styles.formGroup}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export const Input = ({ type = 'text', placeholder, value, onChange, error, ...props }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`${styles.input} ${error ? styles.inputError : ''}`}
      {...props}
    />
  );
};

export const Select = ({ options, value, onChange, placeholder, error, ...props }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${styles.select} ${error ? styles.selectError : ''}`}
      {...props}
    >
      <option value="">{placeholder || 'Select...'}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
};

export const Textarea = ({ rows = 4, placeholder, value, onChange, error, ...props }) => {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
      {...props}
    />
  );
};

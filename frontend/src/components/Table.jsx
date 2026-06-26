import React from 'react';
import styles from './Table.module.css';

export const Table = ({ columns, data, onRowClick, loading = false }) => {
  return (
    <div className={styles.tableContainer}>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : data.length === 0 ? (
        <div className={styles.empty}>No data found</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => {
                const field = col.field ?? col.key;
                return <th key={field}>{col.label}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} onClick={() => onRowClick && onRowClick(row)}>
                {columns.map((col) => {
                  const field = col.field ?? col.key;
                  return (
                    <td key={field}>
                      {col.render ? col.render(row[field], row) : row[field]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

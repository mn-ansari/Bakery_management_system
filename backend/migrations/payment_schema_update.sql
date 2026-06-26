-- Payment and Sales Management Schema Updates
-- Add payment tracking to batches
-- Simplify sales tracking to buyer-based model
-- Add Bill ID field for batch tracking

-- ============================================
-- UPDATE SALES TABLE STRUCTURE (Already Applied)
-- ============================================
-- Commented out as already applied in previous migration run

-- ALTER TABLE sales CHANGE COLUMN id sale_id INT AUTO_INCREMENT;
-- ALTER TABLE sales ADD COLUMN buyer_name VARCHAR(100) NOT NULL;
-- ALTER TABLE sales ADD COLUMN amount DECIMAL(12, 2) NOT NULL;
-- ALTER TABLE sales ADD COLUMN payment_status ENUM('Clear', 'Credit', 'Pending', 'Expense') DEFAULT 'Pending';
-- ALTER TABLE sales ADD COLUMN created_by INT;
-- ALTER TABLE sales ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add Expense to payment_status enum if not exists (for existing installations)
ALTER TABLE sales MODIFY COLUMN payment_status ENUM('Clear', 'Credit', 'Pending', 'Expense') DEFAULT 'Pending';

-- ============================================
-- ADD PAYMENT TRACKING TO BATCHES
-- ============================================

-- Add payment fields to raw_batches
ALTER TABLE raw_batches
  ADD COLUMN paid_amount DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN payment_status ENUM('Clear', 'Credit', 'Pending') DEFAULT 'Pending',
  ADD COLUMN payment_date DATE,
  ADD COLUMN payment_notes TEXT,
  ADD COLUMN bill_id VARCHAR(50);

-- Add payment fields to product_batches
ALTER TABLE product_batches
  ADD COLUMN paid_amount DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN payment_status ENUM('Clear', 'Credit', 'Pending') DEFAULT 'Pending',
  ADD COLUMN payment_date DATE,
  ADD COLUMN payment_notes TEXT,
  ADD COLUMN bill_id VARCHAR(50);

-- ============================================
-- CREATE PAYMENT HISTORY TABLE (Optional, for audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS payment_history (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(50) NOT NULL,
  batch_type ENUM('raw', 'product') NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_status ENUM('Clear', 'Credit', 'Pending') DEFAULT 'Pending',
  notes TEXT,
  recorded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_batch_id (batch_id),
  KEY idx_batch_type (batch_type)
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_raw_batch_status ON raw_batches(payment_status);
CREATE INDEX IF NOT EXISTS idx_raw_batch_bill ON raw_batches(bill_id);
CREATE INDEX IF NOT EXISTS idx_product_batch_status ON product_batches(payment_status);
CREATE INDEX IF NOT EXISTS idx_product_batch_bill ON product_batches(bill_id);

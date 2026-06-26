-- Bill-Based Payment Management
-- This migration creates tables for tracking payments by bill ID
-- Import this file into phpMyAdmin to set up the bill payments system

-- ============================================
-- BILL PAYMENTS TABLE
-- Groups all batches by bill_id and tracks total payment
-- ============================================

CREATE TABLE IF NOT EXISTS bill_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bill_id VARCHAR(50) NOT NULL UNIQUE,
  supplier_name VARCHAR(100),
  total_amount DECIMAL(12, 2) DEFAULT 0,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  remaining_amount DECIMAL(12, 2) DEFAULT 0,
  payment_status ENUM('Pending', 'Partial', 'Paid') DEFAULT 'Pending',
  payment_date DATE,
  notes TEXT,
  bill_date DATE NOT NULL,
  bill_type ENUM('raw_material', 'product', 'mixed') DEFAULT 'raw_material',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bill_id (bill_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_bill_date (bill_date)
);

-- ============================================
-- PAYMENT HISTORY TABLE
-- Tracks all payment transactions for audit trail
-- ============================================

CREATE TABLE IF NOT EXISTS bill_payment_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bill_payment_id INT NOT NULL,
  bill_id VARCHAR(50) NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method ENUM('Cash', 'Bank Transfer', 'Cheque', 'Online', 'Other') DEFAULT 'Cash',
  reference_number VARCHAR(100),
  notes TEXT,
  recorded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bill_payment_id) REFERENCES bill_payments(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bill_payment_id (bill_payment_id),
  INDEX idx_payment_date (payment_date)
);

-- ============================================
-- STORED PROCEDURE: Auto-create bill_payments from batches
-- Call this procedure to sync existing batches to bill_payments
-- ============================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sync_bill_payments()
BEGIN
  -- Insert bill_payments from raw_batches
  INSERT INTO bill_payments (bill_id, total_amount, paid_amount, remaining_amount, payment_status, bill_date, bill_type)
  SELECT 
    rb.bill_id,
    SUM(rb.quantity * rb.purchase_price) as total_amount,
    SUM(COALESCE(rb.paid_amount, 0)) as paid_amount,
    SUM(rb.quantity * rb.purchase_price) - SUM(COALESCE(rb.paid_amount, 0)) as remaining_amount,
    CASE 
      WHEN SUM(COALESCE(rb.paid_amount, 0)) >= SUM(rb.quantity * rb.purchase_price) THEN 'Paid'
      WHEN SUM(COALESCE(rb.paid_amount, 0)) > 0 THEN 'Partial'
      ELSE 'Pending'
    END as payment_status,
    MIN(rb.purchase_date) as bill_date,
    'raw_material' as bill_type
  FROM raw_batches rb
  WHERE rb.bill_id IS NOT NULL AND rb.bill_id != ''
  GROUP BY rb.bill_id
  ON DUPLICATE KEY UPDATE
    total_amount = VALUES(total_amount),
    paid_amount = VALUES(paid_amount),
    remaining_amount = VALUES(remaining_amount),
    payment_status = VALUES(payment_status),
    updated_at = NOW();

  -- Insert bill_payments from product_batches
  INSERT INTO bill_payments (bill_id, total_amount, paid_amount, remaining_amount, payment_status, bill_date, bill_type)
  SELECT 
    pb.bill_id,
    SUM(pb.quantity_produced * pb.cost_per_unit) as total_amount,
    SUM(COALESCE(pb.paid_amount, 0)) as paid_amount,
    SUM(pb.quantity_produced * pb.cost_per_unit) - SUM(COALESCE(pb.paid_amount, 0)) as remaining_amount,
    CASE 
      WHEN SUM(COALESCE(pb.paid_amount, 0)) >= SUM(pb.quantity_produced * pb.cost_per_unit) THEN 'Paid'
      WHEN SUM(COALESCE(pb.paid_amount, 0)) > 0 THEN 'Partial'
      ELSE 'Pending'
    END as payment_status,
    MIN(pb.production_date) as bill_date,
    'product' as bill_type
  FROM product_batches pb
  WHERE pb.bill_id IS NOT NULL AND pb.bill_id != ''
  GROUP BY pb.bill_id
  ON DUPLICATE KEY UPDATE
    total_amount = VALUES(total_amount),
    paid_amount = VALUES(paid_amount),
    remaining_amount = VALUES(remaining_amount),
    payment_status = VALUES(payment_status),
    updated_at = NOW();
END //

DELIMITER ;

-- ============================================
-- TRIGGER: Auto-update bill_payments when batch is created
-- ============================================

DELIMITER //

CREATE TRIGGER IF NOT EXISTS after_raw_batch_insert
AFTER INSERT ON raw_batches
FOR EACH ROW
BEGIN
  IF NEW.bill_id IS NOT NULL AND NEW.bill_id != '' THEN
    INSERT INTO bill_payments (bill_id, total_amount, paid_amount, remaining_amount, payment_status, bill_date, bill_type)
    VALUES (
      NEW.bill_id,
      NEW.quantity * NEW.purchase_price,
      COALESCE(NEW.paid_amount, 0),
      (NEW.quantity * NEW.purchase_price) - COALESCE(NEW.paid_amount, 0),
      CASE 
        WHEN COALESCE(NEW.paid_amount, 0) >= (NEW.quantity * NEW.purchase_price) THEN 'Paid'
        WHEN COALESCE(NEW.paid_amount, 0) > 0 THEN 'Partial'
        ELSE 'Pending'
      END,
      NEW.purchase_date,
      'raw_material'
    )
    ON DUPLICATE KEY UPDATE
      total_amount = total_amount + (NEW.quantity * NEW.purchase_price),
      remaining_amount = remaining_amount + (NEW.quantity * NEW.purchase_price),
      payment_status = CASE 
        WHEN (paid_amount >= total_amount + (NEW.quantity * NEW.purchase_price)) THEN 'Paid'
        WHEN paid_amount > 0 THEN 'Partial'
        ELSE 'Pending'
      END,
      updated_at = NOW();
  END IF;
END //

CREATE TRIGGER IF NOT EXISTS after_product_batch_insert
AFTER INSERT ON product_batches
FOR EACH ROW
BEGIN
  IF NEW.bill_id IS NOT NULL AND NEW.bill_id != '' THEN
    INSERT INTO bill_payments (bill_id, total_amount, paid_amount, remaining_amount, payment_status, bill_date, bill_type)
    VALUES (
      NEW.bill_id,
      NEW.quantity_produced * NEW.cost_per_unit,
      COALESCE(NEW.paid_amount, 0),
      (NEW.quantity_produced * NEW.cost_per_unit) - COALESCE(NEW.paid_amount, 0),
      CASE 
        WHEN COALESCE(NEW.paid_amount, 0) >= (NEW.quantity_produced * NEW.cost_per_unit) THEN 'Paid'
        WHEN COALESCE(NEW.paid_amount, 0) > 0 THEN 'Partial'
        ELSE 'Pending'
      END,
      NEW.production_date,
      'product'
    )
    ON DUPLICATE KEY UPDATE
      total_amount = total_amount + (NEW.quantity_produced * NEW.cost_per_unit),
      remaining_amount = remaining_amount + (NEW.quantity_produced * NEW.cost_per_unit),
      payment_status = CASE 
        WHEN (paid_amount >= total_amount + (NEW.quantity_produced * NEW.cost_per_unit)) THEN 'Paid'
        WHEN paid_amount > 0 THEN 'Partial'
        ELSE 'Pending'
      END,
      updated_at = NOW();
  END IF;
END //

DELIMITER ;

-- ============================================
-- VIEWS FOR EASIER QUERYING
-- ============================================

-- View to get bill details with all items
CREATE OR REPLACE VIEW bill_details_view AS
SELECT 
  bill_id,
  'raw_material' as item_type,
  rm.name as item_name,
  rb.batch_id as batch_number,
  rb.quantity,
  rm.unit,
  rb.purchase_price as unit_price,
  (rb.quantity * rb.purchase_price) as total_value,
  rb.purchase_date as entry_date,
  rb.expiry_date,
  s.name as supplier_name
FROM raw_batches rb
JOIN raw_materials rm ON rb.raw_material_id = rm.id
LEFT JOIN suppliers s ON rb.supplier_id = s.id
WHERE rb.bill_id IS NOT NULL AND rb.bill_id != ''

UNION ALL

SELECT 
  bill_id,
  'product' as item_type,
  p.name as item_name,
  pb.batch_id as batch_number,
  pb.quantity_produced as quantity,
  'pcs' as unit,
  pb.cost_per_unit as unit_price,
  (pb.quantity_produced * pb.cost_per_unit) as total_value,
  pb.production_date as entry_date,
  pb.expiry_date,
  NULL as supplier_name
FROM product_batches pb
JOIN products p ON pb.product_id = p.id
WHERE pb.bill_id IS NOT NULL AND pb.bill_id != '';

-- ============================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ============================================

-- Uncomment below to add sample bill payment data
/*
INSERT INTO bill_payments (bill_id, supplier_name, total_amount, paid_amount, remaining_amount, payment_status, bill_date, bill_type, notes) VALUES
('BILL-001', 'ABC Suppliers', 15000.00, 5000.00, 10000.00, 'Partial', '2026-02-01', 'raw_material', 'Flour and Sugar purchase'),
('BILL-002', 'XYZ Traders', 8500.00, 8500.00, 0.00, 'Paid', '2026-02-05', 'raw_material', 'Packaging materials'),
('BILL-003', 'Local Bakery Supplies', 25000.00, 0.00, 25000.00, 'Pending', '2026-02-10', 'raw_material', 'Monthly stock replenishment');
*/

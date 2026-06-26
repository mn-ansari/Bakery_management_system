-- Utility Bills Management Module Database Schema
-- Run this in phpMyAdmin

-- Utility Bills Table
CREATE TABLE IF NOT EXISTS utility_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_type ENUM('electricity', 'gas') NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    late_surcharge DECIMAL(10, 2) DEFAULT 0.00,
    billing_month VARCHAR(50),
    reference_number VARCHAR(100),
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_bill_type (bill_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Utility Payments Table
CREATE TABLE IF NOT EXISTS utility_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    payment_method ENUM('bank', 'online_app', 'cash') NOT NULL,
    payment_date DATE NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    screenshot_path VARCHAR(255) DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES utility_bills(id) ON DELETE CASCADE,
    INDEX idx_bill_id (bill_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('utility_due', 'utility_overdue', 'utility_paid', 'low_stock', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id INT DEFAULT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    severity ENUM('info', 'warning', 'urgent', 'success') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Data for Testing
INSERT INTO utility_bills (bill_type, image_path, due_date, total_amount, late_surcharge, billing_month, reference_number, status)
VALUES 
    ('electricity', '/uploads/bills/sample_elec_bill.jpg', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 2450.00, 245.00, 'January 2026', 'ELEC-2026-001', 'pending'),
    ('gas', '/uploads/bills/sample_gas_bill.jpg', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1850.00, 185.00, 'January 2026', 'GAS-2026-001', 'pending'),
    ('electricity', '/uploads/bills/old_elec_bill.jpg', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 2100.00, 210.00, 'December 2025', 'ELEC-2025-012', 'overdue');

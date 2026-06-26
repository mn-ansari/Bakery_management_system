-- Nafees Bakery Management System Database Schema
-- IMPORTANT: Tables are ordered by dependency - base tables first, then dependent tables

-- ============================================
-- BASE TABLES (No dependencies)
-- ============================================

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(255),
  module VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Utilities and Expenses Table
CREATE TABLE IF NOT EXISTS utilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bill_number VARCHAR(100) UNIQUE,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  bill_month DATE NOT NULL,
  due_date DATE,
  paid_status ENUM('paid', 'unpaid', 'pending') DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reports Cache Table
CREATE TABLE IF NOT EXISTS reports_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_type VARCHAR(50) NOT NULL,
  report_data JSON NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL
);

-- ============================================
-- USERS & ACCESS CONTROL
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role_id INT NOT NULL,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  record_id INT,
  old_value JSON,
  new_value JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Raw Materials Table
CREATE TABLE IF NOT EXISTS raw_materials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  supplier_id INT,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  minimum_stock DECIMAL(10, 2) DEFAULT 0,
  purchase_price DECIMAL(10, 2) DEFAULT 0,
  warehouse_location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Raw Material Batches Table
CREATE TABLE IF NOT EXISTS raw_batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(50) UNIQUE NOT NULL,
  raw_material_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  purchase_price DECIMAL(10, 2) DEFAULT 0,
  purchase_date DATE NOT NULL,
  expiry_date DATE,
  supplier_id INT,
  warehouse_location VARCHAR(100),
  remaining_stock DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Products Table (In-house manufactured and purchased)
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  type ENUM('manufactured', 'purchased') NOT NULL,
  cost_per_unit DECIMAL(10, 2) DEFAULT 0,
  selling_price DECIMAL(10, 2) NOT NULL,
  recipe_reference INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Product Batches Table
CREATE TABLE IF NOT EXISTS product_batches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(50) UNIQUE NOT NULL,
  product_id INT NOT NULL,
  quantity_produced DECIMAL(10, 2) NOT NULL,
  remaining_stock DECIMAL(10, 2) NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE,
  production_location VARCHAR(100),
  cost_per_unit DECIMAL(10, 2) DEFAULT 0,
  selling_price DECIMAL(10, 2) NOT NULL,
  production_cost DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================
-- PRODUCTION & RECIPES
-- ============================================

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  product_id INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Recipe Ingredients Table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL,
  raw_material_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- Production Logs Table
CREATE TABLE IF NOT EXISTS production_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  production_date DATE NOT NULL,
  quantity_produced DECIMAL(10, 2) NOT NULL,
  machine_used VARCHAR(100),
  production_cost DECIMAL(12, 2) DEFAULT 0,
  produced_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (produced_by) REFERENCES users(id),
  UNIQUE KEY unique_batch (batch_id)
);

-- Raw Material Usage Log (Track consumption during production)
CREATE TABLE IF NOT EXISTS raw_material_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  production_log_id INT NOT NULL,
  raw_batch_id INT NOT NULL,
  quantity_used DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  cost DECIMAL(12, 2) DEFAULT 0,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (production_log_id) REFERENCES production_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (raw_batch_id) REFERENCES raw_batches(id)
);

-- ============================================
-- SALES
-- ============================================

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sale_date DATE NOT NULL,
  product_id INT NOT NULL,
  batch_id VARCHAR(50),
  quantity_sold DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  sale_type ENUM('retail', 'bulk', 'discounted', 'waste') DEFAULT 'retail',
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  notes TEXT,
  sold_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (sold_by) REFERENCES users(id),
  FOREIGN KEY (batch_id) REFERENCES product_batches(batch_id)
);

-- Batch Waste Log Table
CREATE TABLE IF NOT EXISTS batch_waste (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batch_id VARCHAR(50),
  product_id INT,
  type ENUM('expired', 'damaged', 'unsold') DEFAULT 'expired',
  quantity DECIMAL(10, 2) NOT NULL,
  waste_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================
-- HUMAN RESOURCES & PAYROLL
-- ============================================

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  join_date DATE NOT NULL,
  monthly_salary DECIMAL(10, 2) NOT NULL,
  cnic VARCHAR(20),
  contact VARCHAR(20),
  status ENUM('active', 'inactive', 'on-leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Salary Payments Table
CREATE TABLE IF NOT EXISTS salary_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type ENUM('partial', 'full', 'advance') DEFAULT 'partial',
  reason VARCHAR(255),
  month_year VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- FORMULAS & PROFIT CALCULATIONS
-- ============================================

-- Formulas Table (For profit estimation)
CREATE TABLE IF NOT EXISTS formulas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  input_formula JSON NOT NULL,
  expected_output DECIMAL(10, 2),
  expected_revenue DECIMAL(12, 2),
  expected_profit DECIMAL(12, 2),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Create Initial Roles
INSERT INTO roles (name, description) VALUES
('Owner Admin', 'Full system access'),
('Shop Employee', 'Sales entry and stock view'),
('Factory Employee', 'Production and raw material usage'),
('Manager', 'Reports and approvals')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Create Initial Permissions
INSERT INTO permissions (name, module, description) VALUES
('create_user', 'auth', 'Create new user'),
('view_users', 'auth', 'View user list'),
('edit_user', 'auth', 'Edit user details'),
('delete_user', 'auth', 'Delete user'),
('view_inventory', 'inventory', 'View inventory'),
('manage_raw_materials', 'inventory', 'Manage raw materials'),
('manage_products', 'inventory', 'Manage products'),
('manage_batches', 'batch', 'Manage batches'),
('create_production', 'production', 'Create production log'),
('view_production', 'production', 'View production'),
('create_sales', 'sales', 'Create sales entry'),
('view_sales', 'sales', 'View sales'),
('manage_employees', 'employee', 'Manage employees'),
('manage_salaries', 'salary', 'Manage salary payments'),
('view_reports', 'reports', 'View reports'),
('manage_utilities', 'utilities', 'Manage utilities'),
('view_analytics', 'analytics', 'View graphs and analytics'),
('manage_formulas', 'formulas', 'Manage profit formulas')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Assign all permissions to Owner Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
ON DUPLICATE KEY UPDATE permission_id=VALUES(permission_id);

-- Create default admin user (username: admin, email: admin@nafees.com)
-- Password hash: $2a$10$N9qo8uLOickgx2ZMRZoXyeo.5MqRPU2L4qmYv5SPZ/p2.zcEaAB4a (bcrypt hashed for: admin123)
INSERT INTO users (username, email, password, full_name, role_id, status) VALUES
('admin', 'admin@nafees.com', '$2a$10$N9qo8uLOickgx2ZMRZoXyeo.5MqRPU2L4qmYv5SPZ/p2.zcEaAB4a', 'System Administrator', 1, 'active')
ON DUPLICATE KEY UPDATE status=VALUES(status);

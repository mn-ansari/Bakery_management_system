-- Insert Sample Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
('Flour Mill Co', 'Ahmed Khan', '03001234567', 'ahmed@flourmill.com', 'Rawalpindi'),
('Sugar House', 'Fatima Ali', '03005678901', 'fatima@sugarhouse.com', 'Islamabad'),
('Dairy Farm', 'Hassan Abbas', '03009876543', 'hassan@dairy.com', 'Lahore');

-- Insert Sample Raw Materials
INSERT INTO raw_materials (name, unit, supplier_id, current_stock, minimum_stock, purchase_price, warehouse_location) VALUES
('Flour', 'kg', 1, 500, 50, 85, 'Warehouse A'),
('Sugar', 'kg', 2, 300, 30, 120, 'Warehouse B'),
('Butter', 'kg', 3, 100, 10, 450, 'Warehouse C'),
('Eggs', 'dozen', 3, 200, 20, 500, 'Warehouse C'),
('Baking Powder', 'kg', 1, 50, 5, 300, 'Warehouse A'),
('Vanilla Extract', 'ltr', 2, 20, 2, 800, 'Warehouse B');

-- Insert Sample Products
INSERT INTO products (name, category, type, cost_per_unit, selling_price) VALUES
('White Bread', 'Bread', 'manufactured', 120, 200),
('Whole Wheat Bread', 'Bread', 'manufactured', 130, 220),
('Croissant', 'Pastry', 'manufactured', 150, 280),
('Chocolate Cake', 'Cake', 'manufactured', 300, 550),
('Donuts', 'Pastry', 'manufactured', 80, 150),
('Cookies', 'Biscuits', 'manufactured', 50, 100);

-- Insert Sample Employees
INSERT INTO employees (name, role, join_date, monthly_salary, cnic, contact, status) VALUES
('Ali Ahmed', 'Baker', '2023-01-15', 25000, '12345-1234567-1', '03001111111', 'active'),
('Zainab Khan', 'Receptionist', '2023-02-20', 18000, '12345-1234567-2', '03002222222', 'active'),
('Muhammad Hassan', 'Manager', '2022-06-10', 40000, '12345-1234567-3', '03003333333', 'active'),
('Ayesha Malik', 'Baker', '2023-03-05', 25000, '12345-1234567-4', '03004444444', 'active'),
('Usman Iqbal', 'Driver', '2023-04-12', 20000, '12345-1234567-5', '03005555555', 'active');

-- Insert Sample Raw Material Batches
INSERT INTO raw_batches (batch_id, raw_material_id, quantity, unit, purchase_price, purchase_date, expiry_date, supplier_id, warehouse_location, remaining_stock) VALUES
('BATCH-FLOUR-001', 1, 200, 'kg', 85, '2026-02-01', '2026-04-01', 1, 'Warehouse A', 180),
('BATCH-SUGAR-001', 2, 150, 'kg', 120, '2026-02-05', '2026-08-05', 2, 'Warehouse B', 140),
('BATCH-BUTTER-001', 3, 50, 'kg', 450, '2026-02-03', '2026-04-03', 3, 'Warehouse C', 45),
('BATCH-EGGS-001', 4, 100, 'dozen', 500, '2026-02-06', '2026-02-20', 3, 'Warehouse C', 95);

-- Insert Sample Product Batches
INSERT INTO product_batches (batch_id, product_id, quantity_produced, remaining_stock, production_date, expiry_date, production_location, cost_per_unit, selling_price, production_cost) VALUES
('PRD-BREAD-001', 1, 500, 450, '2026-02-08', '2026-02-11', 'Production Unit A', 120, 200, 60000),
('PRD-BREAD-002', 2, 300, 280, '2026-02-08', '2026-02-11', 'Production Unit A', 130, 220, 39000),
('PRD-CROISSANT-001', 3, 200, 180, '2026-02-09', '2026-02-12', 'Production Unit B', 150, 280, 30000),
('PRD-CAKE-001', 4, 100, 90, '2026-02-09', '2026-02-15', 'Production Unit B', 300, 550, 30000);

-- Insert Sample Sales
INSERT INTO sales (sale_date, product_id, batch_id, quantity_sold, selling_price, total_amount, sale_type, discount_percent, sold_by) VALUES
('2026-02-10', 1, 'PRD-BREAD-001', 50, 200, 10000, 'retail', 0, 1),
('2026-02-10', 3, 'PRD-CROISSANT-001', 30, 280, 8400, 'retail', 5, 1),
('2026-02-10', 4, 'PRD-CAKE-001', 10, 550, 5500, 'retail', 0, 1),
('2026-02-10', 1, 'PRD-BREAD-001', 100, 200, 20000, 'bulk', 10, 1),
('2026-02-09', 2, 'PRD-BREAD-002', 50, 220, 11000, 'retail', 0, 1),
('2026-02-09', 5, NULL, 200, 150, 30000, 'bulk', 15, 1);

-- Insert Sample Production Logs
INSERT INTO production_logs (batch_id, product_id, production_date, quantity_produced, machine_used, production_cost, produced_by, notes) VALUES
('PRD-BREAD-001', 1, '2026-02-08', 500, 'Oven A', 60000, 1, 'Standard white bread production'),
('PRD-BREAD-002', 2, '2026-02-08', 300, 'Oven B', 39000, 1, 'Whole wheat bread batch'),
('PRD-CROISSANT-001', 3, '2026-02-09', 200, 'Oven A', 30000, 1, 'Morning croissant batch'),
('PRD-CAKE-001', 4, '2026-02-09', 100, 'Mixer C', 30000, 1, 'Chocolate cake batch');

-- Insert Sample Salary Payments
INSERT INTO salary_payments (employee_id, amount, payment_date, payment_type, reason, month_year, created_by) VALUES
(1, 25000, '2026-02-01', 'full', 'Monthly salary', '2026-02', 1),
(2, 18000, '2026-02-01', 'full', 'Monthly salary', '2026-02', 1),
(3, 40000, '2026-02-01', 'full', 'Monthly salary', '2026-02', 1),
(4, 25000, '2026-02-01', 'full', 'Monthly salary', '2026-02', 1),
(5, 20000, '2026-02-01', 'full', 'Monthly salary', '2026-02', 1);

-- Insert Sample Utilities
INSERT INTO utilities (bill_number, category, amount, bill_month, due_date, paid_status, notes) VALUES
('UTIL-2026-02-001', 'Electricity', 15000, '2026-02-01', '2026-02-15', 'paid', 'Monthly electricity bill'),
('UTIL-2026-02-002', 'Water', 5000, '2026-02-01', '2026-02-15', 'paid', 'Monthly water bill'),
('UTIL-2026-02-003', 'Gas', 8000, '2026-02-01', '2026-02-15', 'pending', 'Monthly gas bill'),
('UTIL-2026-02-004', 'Internet', 3000, '2026-02-01', '2026-02-15', 'paid', 'Internet service');

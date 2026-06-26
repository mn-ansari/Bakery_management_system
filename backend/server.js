const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/inventory/raw-materials', require('./src/routes/rawMaterialRoutes'));
app.use('/api/inventory/products', require('./src/routes/productRoutes'));
app.use('/api/inventory/batches', require('./src/routes/batchRoutes'));
app.use('/api/production', require('./src/routes/productionRoutes'));
app.use('/api/sales', require('./src/routes/salesRoutes'));
app.use('/api/employees', require('./src/routes/employeeRoutes'));
app.use('/api/salaries', require('./src/routes/salaryRoutes'));
app.use('/api/utilities', require('./src/routes/utilityRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

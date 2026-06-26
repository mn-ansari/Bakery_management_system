# Bakery Management System

[![Repository](https://img.shields.io/badge/GitHub-Bakery__management__system-blue?logo=github)](https://github.com/mn-ansari/Bakery_management_system)

A full-stack bakery management system for **Nafees Bakery**, built with a Node.js/Express backend and a React frontend. Manage inventory, production, sales, employees, salaries, utilities, and generate detailed business reports from one dashboard.

## 🎯 Features

### Core Modules
- **Authentication & Authorization** - Role-based access control with JWT
- **Inventory Management** - Raw materials, manufactured products, purchased products
- **Batch Tracking** - FIFO-based batch tracking with expiry alerts
- **Production Management** - Production logs with raw material consumption tracking
- **Sales Management** - Daily sales entry with batch linking
- **Employee Management** - Employee profiles and status tracking
- **Salary Management** - Partial and full salary payment tracking
- **Utilities & Expenses** - Track utility bills and operational expenses
- **Reports & Analytics** - Comprehensive reports and profit analysis
- **Dashboard** - Real-time overview of business metrics

### Key Features
✅ Batch-based inventory tracking with FIFO
✅ Expiry date alerts
✅ Raw material usage tracking during production
✅ Profit calculation per batch
✅ Monthly payroll summary
✅ Low stock alerts
✅ Sales and production reports
✅ Role-based permissions
✅ Audit logging
✅ AI-ready architecture

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator

### Frontend
- **Library**: React 18
- **Routing**: React Router v6
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: CSS Modules
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: react-icons

## 📁 Project Structure

```
Bakery Management System/
├── backend/
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth and validation middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   ├── migrations/        # Database schema
│   ├── server.js          # Express app
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   ├── services/      # API service layer
    │   ├── context/       # State management
    │   ├── App.jsx
    │   └── index.js
    ├── public/
    ├── package.json
    └── .env
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MySQL Server
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=nafees_bakery
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

4. **Create database and import schema**
   ```bash
   mysql -u root -p < migrations/schema.sql
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint** (already set to localhost:5000 in package.json proxy)

4. **Start the development server**
   ```bash
   npm start
   ```
   App will open at http://localhost:3000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Inventory
- `GET /api/inventory/raw-materials` - Get all raw materials
- `POST /api/inventory/raw-materials` - Create raw material
- `GET /api/inventory/products` - Get all products
- `GET /api/inventory/batches/expiring` - Get expiring batches

### Production
- `POST /api/production` - Log production
- `GET /api/production` - Get production logs
- `GET /api/production/summary/daily` - Daily production summary

### Sales
- `POST /api/sales` - Record sale
- `GET /api/sales/daily` - Get today's sales
- `GET /api/sales/report` - Get sales report
- `GET /api/sales/product-wise` - Product-wise sales

### Employees & Salaries
- `POST /api/employees` - Create employee
- `GET /api/employees` - Get all employees
- `POST /api/salaries` - Record salary payment
- `GET /api/salaries/monthly-status` - Monthly salary status

### Utilities
- `POST /api/utilities` - Create utility bill
- `GET /api/utilities/summary/monthly` - Monthly utility summary
- `GET /api/utilities/expense/total` - Total expenses

### Reports
- `GET /api/reports/dashboard-summary` - Dashboard overview
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/profit` - Profit analysis
- `GET /api/reports/expiry-alerts` - Expiry alerts

## 👥 User Roles

1. **Owner Admin** - Full system access
2. **Shop Employee** - Sales entry and stock view
3. **Factory Employee** - Production and raw material usage
4. **Manager** - Reports and approvals (optional)

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Permission-based middleware
- Audit logging for all critical operations
- Secure database credentials in environment variables

## 📊 Database Schema Highlights

- **Raw Materials**: Track ingredients with batch tracking
- **Products**: Support both manufactured and purchased items
- **Batches**: FIFO-based tracking with expiry dates
- **Production Logs**: Track raw material consumption
- **Sales**: Link sales to specific batches
- **Employees**: Track staff and status
- **Salary Payments**: Record partial and full payments
- **Utilities**: Track all operational expenses
- **Audit Logs**: Complete history of changes

## 🎯 Key Workflows

### Production Flow
1. Add raw materials in batches
2. Define recipes linking raw materials to products
3. Log production with raw material consumption
4. System automatically deducts from raw batch (FIFO)
5. Creates product batch with production cost

### Sales Flow
1. Record daily sales
2. System automatically selects batch using FIFO
3. Updates batch remaining stock
4. Calculates profits per batch
5. Generates sales reports

### Inventory Flow
1. Monitor low stock alerts
2. Check expiry dates (7-day alerts)
3. Track raw material usage patterns
4. Plan replenishment

## 📈 Analytics & Reporting

- Daily, weekly, monthly sales reports
- Product-wise profitability analysis
- Batch-wise profit calculation
- Monthly profit and loss analysis
- Waste tracking and reports
- Employee performance (production/sales)
- Utility cost analysis
- Expiry management

## 🔄 Future Enhancements (AI-Ready)

The system is designed for AI integration:
- Demand prediction
- Production optimization
- Inventory level suggestions
- Price optimization
- Seasonal trend analysis
- Waste prediction and prevention
- Customer behavior analysis

## 🤝 Contributing

1. Fork the [repository](https://github.com/mn-ansari/Bakery_management_system)
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear messages
4. Push to your fork and open a Pull Request

## 📝 License

This project is proprietary to Nafees Bakery.

## 📞 Support

For issues or questions, open an issue on [GitHub](https://github.com/mn-ansari/Bakery_management_system/issues) or contact the development team.

---

**Repository**: [github.com/mn-ansari/Bakery_management_system](https://github.com/mn-ansari/Bakery_management_system)  
**Last Updated**: June 2026  
**Version**: 1.0.0 Beta

# Nafees Bakery Backend API

RESTful API for Nafees Bakery Management System built with Express.js and MySQL.

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MySQL Server running
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Configure database in `.env`**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=nafees_bakery
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=7d
   PORT=5000
   ```

4. **Create database and import schema**
   ```bash
   mysql -u root -p -e "CREATE DATABASE nafees_bakery;"
   mysql -u root -p nafees_bakery < migrations/schema.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Server runs on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── rawMaterialController.js
│   │   ├── productController.js
│   │   ├── batchController.js
│   │   ├── productionController.js
│   │   ├── salesController.js
│   │   ├── employeeController.js
│   │   ├── salaryController.js
│   │   ├── utilityController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT auth & permissions
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── rawMaterialRoutes.js
│   │   ├── productRoutes.js
│   │   ├── batchRoutes.js
│   │   ├── productionRoutes.js
│   │   ├── salesRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── salaryRoutes.js
│   │   ├── utilityRoutes.js
│   │   └── reportRoutes.js
│   └── utils/
├── migrations/
│   └── schema.sql               # Database schema
├── server.js                    # Express app
├── package.json
└── .env.example
```

## 🔑 Key Dependencies

- **express**: Web framework
- **mysql2**: MySQL client with promises
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **cors**: Cross-origin resource sharing
- **express-validator**: Input validation
- **dotenv**: Environment variables
- **moment**: Date/time utilities

## 🔐 Authentication

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "Owner Admin"
  }
}
```

### Using API
Add token to Authorization header:
```
Authorization: Bearer <token>
```

## 📚 API Endpoints

### Auth Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Inventory Endpoints

**Raw Materials**
- `GET /api/inventory/raw-materials` - List all
- `POST /api/inventory/raw-materials` - Create
- `GET /api/inventory/raw-materials/:id` - Get by ID
- `PUT /api/inventory/raw-materials/:id` - Update
- `GET /api/inventory/raw-materials/alerts/low-stock` - Low stock
- `GET /api/inventory/raw-materials/:id/batches` - Batch history

**Products**
- `GET /api/inventory/products` - List all
- `POST /api/inventory/products` - Create
- `GET /api/inventory/products/:id` - Get by ID
- `PUT /api/inventory/products/:id` - Update
- `GET /api/inventory/products/:id/stock` - Stock info

**Batches**
- `POST /api/inventory/batches/raw` - Create raw batch
- `POST /api/inventory/batches/product` - Create product batch
- `GET /api/inventory/batches/expiring` - Expiring items (query: days=7)
- `GET /api/inventory/batches/:batchId` - Get batch details
- `GET /api/inventory/batches/:batchId/sales` - Sales history
- `GET /api/inventory/batches/:batchId/profit` - Profit calculation

### Production Endpoints
- `POST /api/production` - Log production
- `GET /api/production` - Get logs (query: product_id, date_from, date_to)
- `GET /api/production/:id` - Get details
- `GET /api/production/summary/daily` - Daily summary (query: date)

### Sales Endpoints
- `POST /api/sales` - Record sale
- `GET /api/sales/daily` - Today's sales (query: date)
- `GET /api/sales/report` - Sales report (query: date_from, date_to, product_id, sale_type)
- `GET /api/sales/weekly` - Weekly data
- `GET /api/sales/monthly` - Monthly data
- `GET /api/sales/product-wise` - By product (query: date_from, date_to)

### Employee Endpoints
- `POST /api/employees` - Create
- `GET /api/employees` - List all
- `GET /api/employees/stats` - Statistics
- `GET /api/employees/:id` - Get by ID
- `PUT /api/employees/:id` - Update

### Salary Endpoints
- `POST /api/salaries` - Record payment
- `GET /api/salaries/employee/:employee_id` - Payment history
- `GET /api/salaries/monthly-status` - Monthly status (query: month_year)
- `GET /api/salaries/yearly/:employee_id` - Yearly report
- `GET /api/salaries/expense/total` - Total (query: date_from, date_to)
- `GET /api/salaries/payroll/summary` - Payroll summary (query: month_year)

### Utility Endpoints
- `POST /api/utilities` - Create bill
- `GET /api/utilities` - List all
- `GET /api/utilities/:id` - Get by ID
- `PUT /api/utilities/:id` - Update
- `GET /api/utilities/summary/monthly` - Monthly (query: month)
- `GET /api/utilities/summary/yearly` - Yearly
- `GET /api/utilities/expense/total` - Total (query: date_from, date_to)
- `GET /api/utilities/payments/pending` - Pending bills

### Report Endpoints
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/sales` - Sales report (query: date_from, date_to)
- `GET /api/reports/profit` - Profit analysis (query: date_from, date_to)
- `GET /api/reports/waste` - Waste report (query: date_from, date_to)
- `GET /api/reports/expiry-alerts` - Expiry report (query: days=7)
- `GET /api/reports/dashboard-summary` - Dashboard overview

## 🗂️ Database Schema

### Core Tables
- `users` - System users
- `roles` - User roles
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mapping
- `audit_logs` - Change audit trail

### Inventory Tables
- `raw_materials` - Raw material definitions
- `raw_batches` - Raw material batches with expiry
- `products` - Product master
- `product_batches` - Product batches
- `recipes` - Product recipes
- `recipe_ingredients` - Recipe components

### Operations Tables
- `production_logs` - Production records
- `raw_material_usage` - Raw material consumption
- `sales` - Sales transactions
- `batch_waste` - Waste tracking

### HR Tables
- `employees` - Employee records
- `salary_payments` - Salary transactions

### Finance Tables
- `utilities` - Utility bills
- `formulas` - Profit estimation formulas

## 🔄 Sample Request/Response

### Create Production Log
```bash
POST /api/production
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 1,
  "production_date": "2024-02-10",
  "quantity_produced": 100,
  "machine_used": "Oven A",
  "produced_by": 5,
  "raw_materials_used": [
    {
      "raw_material_id": 1,
      "quantity": 50,
      "unit": "kg",
      "unitPrice": 10
    }
  ]
}
```

Response:
```json
{
  "message": "Production logged successfully",
  "batchId": "PROD-1707573600000",
  "productionLogId": 12,
  "productionCost": 500
}
```

## 🛠️ Development

### Run in Development Mode
```bash
npm run dev
```
Uses nodemon for auto-reload.

### Environment Variables
See `.env.example` for all available options:
- `NODE_ENV` - Development/Production
- `PORT` - Server port (default: 5000)
- `DB_*` - Database credentials
- `JWT_SECRET` - Secret key for token signing
- `JWT_EXPIRE` - Token expiration time

## 📊 Database Connection

Using MySQL2 connection pool for better performance:
- 10 active connections limit
- Automatic connection management
- Promise-based API

## ✅ Input Validation

All endpoints validate input using `express-validator`. Validation errors return 400 status with error details.

## 🔒 Security Features

- JWT token expiration
- Password hashing with bcrypt (10 rounds)
- Role-based access control
- Permission-based route protection
- Audit logging of sensitive operations

## 📝 Error Handling

Standard error responses:
```json
{
  "message": "Error description"
}
```

Status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

## 🚀 Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper database
4. Enable CORS appropriately
5. Use HTTPS
6. Set up backups
7. Configure logging
8. Monitor performance

## 📞 Support

For issues or questions, please contact the development team.

---

**Version**: 1.0.0
**Last Updated**: February 2026

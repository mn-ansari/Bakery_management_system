# System Architecture & Implementation Guide

## 📐 System Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React Frontend (localhost:3000)                            │
│  - Dashboard, Inventory, Sales, Reports, etc.              │
│  - User Interface & State Management (Zustand)             │
│  - HTTP Client (Axios with JWT interceptor)                │
└──────────────────────┬──────────────────────────────────────┘
                       │ JSON API Calls
                       │ (GET, POST, PUT, DELETE)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  Express.js API Server (localhost:5000)                     │
│  - Route handlers & Controllers                             │
│  - Authentication & Authorization (JWT + RBAC)             │
│  - Business logic & Validation                              │
│  - Audit logging & Error handling                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL Queries
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  MySQL Database (localhost:3306)                            │
│  - Relational data storage                                  │
│  - ACID compliance                                          │
│  - Connection pooling                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication & Authorization Flow

### JWT Token Flow

```
┌─────────────────────┐
│  User Login         │
├─────────────────────┤
│ email + password    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Backend Auth Check  │
├─────────────────────┤
│ Hash comparison     │
│ Role lookup         │
└──────────┬──────────┘
           │
           ▼ (Success)
┌─────────────────────┐
│ Create JWT Token    │
├─────────────────────┤
│ Payload: User ID,   │
│ Email, Role,        │
│ Permissions         │
│ Expiry: 7 days      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Return Token        │
├─────────────────────┤
│ Store in client     │
│ localStorage        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Subsequent Requests │
├─────────────────────┤
│ Add to Header:      │
│ Authorization:      │
│ Bearer <token>      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Verify & Authorize  │
├─────────────────────┤
│ Check token valid   │
│ Check permissions   │
│ Grant access        │
└─────────────────────┘
```

## 📊 Database Schema Key Relationships

### Inventory Relationships

```
raw_materials (Flour, Sugar, etc.)
    │
    ├── current_stock (total across all batches)
    │
    └──→ raw_batches (Batch tracking)
         │
         ├── batch_id (unique)
         ├── quantity, expiry_date
         ├── remaining_stock (used during production)
         │
         └──→ raw_material_usage
              (Track consumption in production)

products (Bread, Cakes, etc.)
    │
    └──→ product_batches (Production batches)
         │
         ├── batch_id
         ├── quantity_produced
         ├── remaining_stock
         ├── production_cost
         │
         └──→ sales
              (Link sales to specific batches)
```

### Financial Relationships

```
employees
    │
    └──→ salary_payments
         (Track partial & full payments)

utilities
    (Electricity, gas, water, etc.)
    │
    └──→ Monthly aggregations
         for profit calculation

production_logs
    │
    ├──→ raw_material_usage (Cost tracking)
    │
    └──→ product_batches
         └──→ profit calculation
              (Revenue - Production Cost)
```

## 🔄 Key Business Logic Flows

### Production Workflow

```
Input Raw Materials
    ↓
Log Production
    ├─ Create production log
    ├─ Record raw material usage
    ├─ Find batch using FIFO
    ├─ Deduct from raw_batches.remaining_stock
    ├─ Calculate production cost
    └─ Create product_batch
         ├─ batch_id (auto-generated)
         ├─ quantity_produced
         ├─ production_cost
         └─ remaining_stock = quantity_produced

Product Ready for Sale
```

### Sales Workflow

```
Customer Purchase
    ↓
Record Sale
    ├─ Select product
    ├─ Find available batch (FIFO)
    ├─ Link to product_batch
    ├─ Record transaction
    └─ Update batch.remaining_stock
         remaining = remaining - quantity_sold

Sales Report
    ├─ Revenue = sum(total_amount)
    ├─ Link to production_cost
    ├─ Calculate batch profit
    └─ Update dashboard

Batch Analysis
    ├─ Profit per batch = Revenue - Cost
    ├─ Profit margin = (Profit / Revenue) * 100
    └─ Waste tracking
```

### Profit Calculation

```
For a Period (Monthly):

Revenue = SUM(sales.total_amount)
         where sale_date in period

Costs:
  - Production Cost = SUM(production_logs.production_cost)
  - Salary Cost = SUM(salary_payments.amount)
  - Utility Cost = SUM(utilities.amount where paid)
  - Total Cost = Production + Salary + Utility

Profit = Revenue - Total Cost
Margin = (Profit / Revenue) * 100

Per Batch:
  Batch Profit = Revenue(batch) - Production Cost(batch)
                where Revenue = SUM(sales for that batch_id)
```

## 🗂️ Module Architecture

### Inventory Module
```
Raw Materials
  ├─ CRUD operations
  ├─ Current stock tracking
  ├─ Minimum stock alerts
  └─ Batch history

Products
  ├─ Master data management
  ├─ Category classification
  ├─ Price management
  └─ Recipe linking

Batches
  ├─ Auto-generation of batch IDs
  ├─ Expiry tracking
  ├─ FIFO support
  └─ Waste recording
```

### Production Module
```
Production Logging
  ├─ Batch creation
  ├─ Raw material consumption
  ├─ Cost calculation
  ├─ Production history
  └─ Machine tracking

Raw Material Usage
  ├─ FIFO selection
  ├─ Quantity deduction
  ├─ Cost accumulation
  └─ Usage history
```

### Sales Module
```
Sales Entry
  ├─ Batch auto-selection (FIFO)
  ├─ Price management
  ├─ Discount handling
  ├─ Sale type classification
  └─ Multiple sales in one entry

Analytics
  ├─ Daily summaries
  ├─ Weekly trends
  ├─ Monthly reports
  ├─ Product-wise analysis
  └─ Batch profitability
```

### Employee & Salary Module
```
Employees
  ├─ Profile management
  ├─ Role assignment
  ├─ Status tracking
  └─ Contact info

Salary Management
  ├─ Monthly salary definition
  ├─ Partial payment recording
  ├─ Advance tracking
  ├─ Settlement calculation
  └─ Payment history
```

### Reports Module
```
Pre-built Reports
  ├─ Inventory Status
  ├─ Sales Analysis
  ├─ Profit & Loss
  ├─ Waste Report
  ├─ Expiry Alerts
  └─ Dashboard Summary

Report Features
  ├─ Date range filtering
  ├─ Data aggregation
  ├─ Caching for performance
  └─ Export capability (future)
```

## 🔒 Security Implementation

### Authentication
```
Password Security
  ├─ Bcryptjs hashing (10 rounds) ← Slow by design
  ├─ Never store plaintext
  ├─ Never return password in API
  └─ Compare on login

Token Security
  ├─ JWT with HS256 algorithm
  ├─ Secret key 128+ characters
  ├─ Payload includes user metadata
  ├─ 7-day expiration
  └─ Cannot be modified without secret
```

### Authorization
```
Role-Based Access Control (RBAC)
  ├─ Users have role (owner, employee, factory, manager)
  ├─ Roles have permissions
  └─ At runtime: role → permissions → access

Middleware Chain
  ├─ 1. Auth check (token valid?)
  ├─ 2. Extract user from token
  ├─ 3. Permission check
  └─ 4. Execute controller
```

### Audit & Compliance
```
Audit Logging
  ├─ User ID → What action
  ├─ Module → Sales, Inventory, Salary
  ├─ Record ID → Which sale, product
  ├─ Old value → Before change
  ├─ New value → After change
  ├─ Timestamp → When
  └─ IP address → From where

Benefit
  ├─ Track who changed what
  ├─ When was change made
  ├─ Revert capability
  └─ Compliance & accountability
```

## ⚙️ API Design Patterns

### RESTful Endpoints
```
Collection
  GET    /api/resource              → List all
  POST   /api/resource              → Create

Item
  GET    /api/resource/:id          → Get specific
  PUT    /api/resource/:id          → Update
  DELETE /api/resource/:id          → Delete

Custom Actions
  GET    /api/resource/action       → Specific query
  GET    /api/resource/:id/related  → Related data
```

### Request/Response Format
```
Request
{
  "field": "value",
  "date": "2024-02-10",
  "quantity": 100
}

Success Response (200/201)
{
  "message": "Operation successful",
  "id": 123,
  "data": { ... }
}

Error Response (400/401/403/404/500)
{
  "message": "Error description"
}
```

### Status Codes
```
200 OK - Successful GET/PUT
201 Created - Successful POST
400 Bad Request - Invalid input
401 Unauthorized - Missing/invalid token
403 Forbidden - Insufficient permissions
404 Not Found - Resource doesn't exist
500 Server Error - Unexpected error
```

## 🗄️ Database Optimization

### Indexes
```
By default, MySQL creates indexes on:
  ├─ Primary keys
  └─ Foreign keys

Additional indexes created for:
  ├─ batch_id (fast batch lookups)
  ├─ user_id (fast user lookups)
  ├─ sale_date (range queries for reports)
  ├─ production_date (production analysis)
  └─ expiry_date (expiry alerts)
```

### Connection Pooling
```
MySQL2 Pool Configuration
  ├─ Max connections: 10
  ├─ Queue limit: 0 (unlimited)
  ├─ Wait for connections: true
  └─ Automatic cleanup

Benefits
  ├─ Reuse connections
  ├─ Reduce overhead
  ├─ Better performance
  └─ Production-ready
```

### Query Performance
```
Optimized for:
  ├─ Aggregation (SUM, COUNT)
  ├─ Date range queries
  ├─ FIFO batch selection
  ├─ Batch-wise profit calculation
  └─ Batch expiry lookups

Used Techniques:
  ├─ Foreign key relationships
  ├─ Proper data types
  ├─ Indexes on foreign keys
  └─ Efficient GROUP BY queries
```

## 📈 Scalability & Future Enhancements

### Current Architecture Supports
```
Estimated Capacity:
  ├─ 1-5 employees
  ├─ 100+ products
  ├─ 1000+ batches/month
  ├─ 10,000+ daily sales
  └─ Single MySQL server

Workload Profile:
  ├─ Read-heavy (reports, views)
  ├─ Write-moderate (sales, production)
  ├─ OLTP + analytical queries
  └─ Real-time data requirements
```

### Scaling Path (Future)

```
Phase 2: Performance
  ├─ Add caching layer (Redis)
  ├─ Database query optimization
  ├─ Implement pagination
  └─ API rate limiting

Phase 3: Advanced Features
  ├─ GraphQL API
  ├─ Mobile app
  ├─ Real-time notifications
  ├─ Advanced analytics
  └─ BI integration

Phase 4: AI Integration
  ├─ Demand forecasting
  ├─ Production optimization
  ├─ Price optimization
  ├─ Anomaly detection
  └─ Customer insights

Phase 5: Enterprise
  ├─ Multi-branch support
  ├─ Multi-user concurrency
  ├─ Cloud deployment (AWS/Azure)
  ├─ Data warehouse
  └─ ERP integration
```

### Code Structure for AI Integration

```
Current Data Layer
  ├─ Data normalized ✓
  ├─ All history preserved ✓
  ├─ Timestamps tracked ✓
  └─ Batch tracking enabled ✓

API Layer
  ├─ Separate endpoints ✓
  ├─ Consistent format ✓
  ├─ Versioning ready ✓
  └─ Microservice ready ✓

Future AI Service
  /
  ├─ Prediction Engine
  ├─ Optimization Engine
  ├─ Forecasting Module
  └─ Recommendation System
```

## 🔧 Deployment Architecture

### Development Environment
```
Local Machine:
  ├─ Node.js (v14+) + npm
  ├─ React development server (:3000)
  ├─ Express dev server (:5000)
  ├─ Local MySQL (:3306)
  └─ Hot reload enabled
```

### Testing Environment
```
Can run all 3 components locally
  ├─ Frontend: npm start
  ├─ Backend: npm run dev
  ├─ Database: local MySQL
  └─ No build step needed
```

### Production Environment
```
Frontend:
  ├─ Build: npm run build
  ├─ Output: Optimized static files
  ├─ Hosting: Vercel / Netlify / S3
  ├─ CDN: CloudFront (optional)
  └─ Environment: Single Page App

Backend:
  ├─ Build: npm install --production
  ├─ Hosting: Heroku / AWS EC2 / DigitalOcean
  ├─ Process manager: PM2
  ├─ Reverse proxy: Nginx
  └─ HTTPS: Let's Encrypt

Database:
  ├─ Provider: AWS RDS / Cloud SQL
  ├─ Backup: Automated daily
  ├─ Redundancy: Multi-AZ
  ├─ Monitoring: CloudWatch / Datadog
  └─ Security: VPC, SSL, Firewall
```

## 📊 Key Metrics & KPIs

### System Monitoring
```
Performance Metrics:
  ├─ API response time < 200ms
  ├─ Database query time < 100ms
  ├─ Page load time < 2s
  ├─ Uptime > 99.5%
  └─ Error rate < 0.1%

Business Metrics:
  ├─ Daily sales volume
  ├─ Production efficiency
  ├─ Waste percentage
  ├─ Profit margin
  └─ Employee productivity
```

## 🎯 Development Best Practices

```
Code Organization:
  ├─ Modular structure ✓
  ├─ Separation of concerns ✓
  ├─ Reusable components ✓
  ├─ Service layer pattern ✓
  └─ Consistent naming ✓

Testing:
  ├─ API endpoint tests (Plan)
  ├─ Database query tests (Plan)
  ├─ Component tests (Plan)
  └─ Integration tests (Plan)

Documentation:
  ├─ API documentation ✓
  ├─ Database schema ✓
  ├─ Setup guide ✓
  ├─ Architecture doc ✓
  └─ Code comments (Needed)
```

## 🔄 CI/CD Pipeline (Future)

```
Suggested Pipeline:
  ├─ Code push to GitHub
  ├─ Run tests
  ├─ Build checks
  ├─ Lint & format check
  ├─ Security scan
  ├─ Deploy to staging
  ├─ Smoke tests
  └─ Deploy to production

Tools:
  ├─ GitHub Actions / GitLab CI
  ├─ Jest for testing
  ├─ ESLint for code quality
  ├─ OWASP for security
  └─ Auto-deploy on tags
```

---

This architecture provides a solid foundation for a modern bakery management system with room for growth and AI integration in the future.

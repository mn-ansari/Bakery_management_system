# Nafees Bakery Frontend

React-based dashboard for Nafees Bakery Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

App opens at `http://localhost:3000`

Note: Backend API must be running on `http://localhost:5000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Form.jsx
│   │   ├── Navigation.jsx
│   │   ├── Table.jsx
│   │   └── *.module.css
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Inventory.jsx
│   │   ├── Sales.jsx
│   │   ├── Reports.jsx
│   │   └── *.module.css
│   ├── services/            # API service layer
│   │   ├── authStore.js
│   │   ├── inventoryService.js
│   │   ├── salesService.js
│   │   ├── employeeService.js
│   │   ├── productionService.js
│   │   ├── utilityService.js
│   │   ├── reportService.js
│   │   └── raportService.js
│   ├── context/             # State management
│   │   └── authStore.js
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── public/
│   ├── index.html
├── package.json
└── .env (if needed)
```

## 🔑 Key Dependencies

- **react**: UI library
- **react-router-dom**: Client-side routing
- **axios**: HTTP client
- **zustand**: State management
- **chart.js**: Charting library
- **react-chartjs-2**: React wrapper for charts
- **react-icons**: Icon library
- **date-fns**: Date utilities
- **react-toastify**: Toast notifications

## 📄 Pages

### Login Page
- Email/password authentication
- JWT token storage
- Redirect to dashboard on success

### Dashboard
- Real-time statistics
- Today's sales and production
- Monthly overview
- Quick action buttons
- Low stock alerts count

### Inventory Management
- **Raw Materials Tab**
  - List all raw materials
  - Add new materials
  - View stock levels
  - Track location

- **Products Tab**
  - List products (manufactured and purchased)
  - View stock by batch
  - Track product categories

- **Expiring Items Tab**
  - Items expiring within 7 days
  - Stock levels
  - Batch information

- **Low Stock Alerts Tab**
  - Items below minimum stock
  - Current vs minimum levels

### Sales Management
- Record daily sales
- Link to product batches
- Track sale types (retail, bulk, discounted, waste)
- View today's sales
- Sales summary

### Reports
- **Dashboard Report** - Business overview
- **Sales Report** - Revenue and transactions
- **Profit Analysis** - Costs and margins
- **Inventory Report** - Stock status
- **Expiry Alerts** - Expiring items

## 🔐 Authentication

### Login Flow
1. User enters email and password
2. API call to `/api/auth/login`
3. Receive JWT token
4. Store in `localStorage`
5. Redirect to dashboard

### Token Management
- Auto-included in all API requests via Axios interceptor
- Stored in `localStorage`
- Used for authorization

### User State
- Managed with Zustand `authStore`
- Global state accessible everywhere
- Automatic logout clears storage

## 🎨 UI Components

### Button Component
```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

### Table Component
```jsx
<Table 
  columns={[
    { field: 'name', label: 'Name' },
    { field: 'stock', label: 'Stock', render: (val) => `${val} kg` }
  ]}
  data={items}
  loading={loading}
  onRowClick={handleRowClick}
/>
```

### Card Component
```jsx
<Card title="Title">
  Content here
</Card>
```

### Form Components
```jsx
<FormGroup label="Email">
  <Input type="email" value={email} onChange={handleChange} />
</FormGroup>
```

## 🌐 API Integration

### Services Pattern
Each module has a service file for API calls:

```javascript
// inventoryService.js
const InventoryService = {
  getRawMaterials: () => API.get('/inventory/raw-materials'),
  createProduct: (data) => API.post('/inventory/products', data),
  ...
};
```

### Usage in Components
```javascript
const response = await InventoryService.getRawMaterials();
const materials = response.data;
```

## 📊 State Management with Zustand

### Auth Store
```javascript
const { user, token, isAuthenticated, login, logout } = useAuthStore();
```

### Features
- Persistent state (localStorage)
- No boilerplate
- Lightweight
- Easy to test

## 🎯 Features

### Dashboard
- Quick statistics
- Monthly profit summary
- Quick actions to main features
- Real-time data

### Inventory
- Batch tracking
- FIFO support
- Expiry alerts
- Low stock warnings
- Location tracking

### Sales
- Record transactions
- Auto-batch selection
- Sales by type
- Daily summaries

### Reports
- Multiple report types
- Date range filtering
- Profit analysis
- Inventory status
- Expiry monitoring

### Employee Management (Coming Soon)
- Staff profiles
- Salary tracking
- Payment history

## 🚀 Development Features

### CSS Modules
Each component has its own CSS module for scoped styles:
```jsx
import styles from './Component.module.css';
<div className={styles.container}></div>
```

### Responsive Design
Mobile-first approach with media queries for tablet/desktop.

### Icons
Using `react-icons` for consistent icon set:
```jsx
import { FiShoppingCart } from 'react-icons/fi';
```

## 🔧 Configuration

### API Endpoint
Set in `package.json`:
```json
"proxy": "http://localhost:5000"
```

Or use environment variables:
```
REACT_APP_API_URL=http://localhost:5000
```

## 🛠️ Available Scripts

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Eject Configuration (One-way)
```bash
npm run eject
```

## 📝 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🚀 Deployment

### Build Optimization
```bash
npm run build
```

Output in `build/` directory ready for deployment.

### Services to Deploy To
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Traditional hosting with Node server

## 📞 Support

For issues or questions, contact the development team.

---

**Version**: 1.0.0 Beta
**Last Updated**: February 2026

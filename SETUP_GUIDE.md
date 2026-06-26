# Setup Guide - Nafees Bakery Management System

## System Requirements

- **Operating System**: Windows, Mac, or Linux
- **Node.js**: v14.x or higher
- **MySQL**: v5.7 or higher
- **RAM**: Minimum 2GB
- **Storage**: 500MB free space
- **Internet**: Required for npm package installation

## Complete Installation Steps

### Step 1: Prerequisites Installation

#### Windows
1. Download and install Node.js from https://nodejs.org/ (LTS version)
2. Download and install MySQL Community Server from https://dev.mysql.com/downloads/mysql/
3. During MySQL installation, note the root password

#### Mac
```bash
# Using Homebrew
brew install node
brew install mysql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install nodejs npm mysql-server
```

### Step 2: Project Setup

1. **Navigate to project directory**
   ```bash
   cd "c:\xampp\htdocs\bytes\Bakery mangement system"
   ```

2. **Create `.env` files**

   **Backend (.env)**
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `backend/.env`:
   ```
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=nafees_bakery
   JWT_SECRET=nafees_bakery_secret_key_2024
   JWT_EXPIRE=7d
   ```

### Step 3: Database Setup

1. **Create MySQL database and user**
   ```bash
   mysql -u root -p
   ```

   In MySQL prompt:
   ```sql
   CREATE DATABASE nafees_bakery;
   CREATE USER 'bakery_user'@'localhost' IDENTIFIED BY 'bakery_password_123';
   GRANT ALL PRIVILEGES ON nafees_bakery.* TO 'bakery_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

2. **Import database schema**
   ```bash
   mysql -u bakery_user -p nafees_bakery < migrations/schema.sql
   ```

3. **Verify database**
   ```bash
   mysql -u bakery_user -p nafees_bakery -e "SHOW TABLES;"
   ```

### Step 4: Backend Setup

1. **Navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start backend server**
   ```bash
   npm run dev
   ```

   Expected output:
   ```
   Server running on port 5000
   ```

4. **Test API health**
   ```bash
   curl http://localhost:5000/api/health
   ```

### Step 5: Frontend Setup

1. **In a new terminal, navigate to frontend**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start frontend development server**
   ```bash
   npm start
   ```

   App should open automatically at `http://localhost:3000`

### Step 6: Initial Login

1. **First user registration**
   
   Since the database is fresh, register the admin user:
   - Navigate to login page
   - Click "Register" (if available) or use API:

   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d {
       "username": "admin",
       "email": "admin@nafees.com",
       "password": "admin123",
       "full_name": "Admin User",
       "role_id": 1
     }
   ```

2. **Login with credentials**
   - Email: `admin@nafees.com`
   - Password: `admin123`

## Verification Checklist

- [ ] Node.js installed (`node -v`)
- [ ] npm working (`npm -v`)
- [ ] MySQL running (`mysql -u root -p`)
- [ ] Database `nafees_bakery` created
- [ ] Backend dependencies installed
- [ ] Backend server running on port 5000
- [ ] Frontend dependencies installed
- [ ] Frontend server running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can login with admin credentials
- [ ] Dashboard displays data

## Common Issues & Solutions

### MySQL Connection Error
**Error**: "ER_NOT_SUPPORTED_AUTH_PLUGIN"

**Solution**:
```bash
mysql -u root -p
ALTER USER 'bakery_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

### Port Already in Use
**Error**: "Error: listen EADDRINUSE :::5000"

**Solution**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
# Change PORT in .env to 5001
```

### Dependencies Installation Fails
**Error**: "npm ERR! code ERESOLVE"

**Solution**:
```bash
npm install --legacy-peer-deps
```

### React App Won't Load

**Solution**:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart development servers
3. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

### API Connection Error

**Solution**:
1. Ensure backend is running on port 5000
2. Check CORS configuration in backend
3. Verify API endpoint in frontend `.env`

## Development Workflow

### Start Development

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm start
```

**Terminal 3 - MySQL (Optional)**
```bash
mysql -u bakery_user -p nafees_bakery
```

### Create New Features

1. **Backend API**
   - Create controller in `src/controllers/`
   - Create routes in `src/routes/`
   - Add to server.js
   - Test with PostMan or curl

2. **Frontend**
   - Create service in `src/services/`
   - Create component in `src/components/`
   - Create page in `src/pages/`
   - Add route to App.jsx

### Database Queries

Run queries directly:
```bash
mysql -u bakery_user -p nafees_bakery -e "SELECT * FROM users;"
```

Or in MySQL prompt:
```bash
mysql -u bakery_user -p nafees_bakery
mysql> SELECT COUNT(*) as users FROM users;
```

## Production Deployment

### Backend Deployment

1. **Update .env**
   ```
   NODE_ENV=production
   DB_HOST=your_production_db_host
   DB_USER=your_prod_user
   DB_PASSWORD=your_prod_password
   JWT_SECRET=your_secure_secret_key
   ```

2. **Deploy to hosting**
   - Heroku
   - AWS EC2
   - DigitalOcean
   - Azure App Service

3. **Sample Heroku deployment**
   ```bash
   heroku create your-app-name
   heroku config:set DB_HOST=your_db_host
   git push heroku main
   ```

### Frontend Deployment

1. **Build optimized version**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to**
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront

3. **Sample Netlify deployment**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=build
   ```

## Monitoring

### Check Backend Logs
```bash
# Development mode shows logs in console
# For production, redirect to file
npm start > app.log 2>&1 &
```

### Monitor Database
```bash
mysql -u bakery_user -p
mysql> SHOW PROCESSLIST;
mysql> SHOW STATUS;
```

### API Testing
```bash
# Test auth endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nafees.com","password":"admin123"}'

# Test with token
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/inventory/raw-materials
```

## Security Reminders

1. **Never commit `.env` files**
2. **Use strong passwords** for MySQL and JWT
3. **Keep dependencies updated**
   ```bash
   npm update
   ```
4. **Use HTTPS in production**
5. **Implement rate limiting**
6. **Regular database backups**

## Backup and Restore

### Backup Database
```bash
mysqldump -u bakery_user -p nafees_bakery > backup.sql
```

### Restore Database
```bash
mysql -u bakery_user -p nafees_bakery < backup.sql
```

## Next Steps

1. Review the [Main README](./README.md)
2. Check [Backend Documentation](./backend/README.md)
3. Review [Frontend Documentation](./frontend/README.md)
4. Start development!

## Support

For issues refer to:
- Backend logs: Check browser console network tab
- Database logs: `mysql error.log`
- Windows Event Viewer for system errors
- Project README files for detailed API docs

---

Setup completed! You're ready to start development.

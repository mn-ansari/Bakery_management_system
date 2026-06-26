import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import { Navigation } from './components/Navigation';
import LoginPage from './pages/Login';
import TestLogin from './pages/TestLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import BatchTracking from './pages/BatchTracking';
import Inventory from './pages/Inventory';
import Production from './pages/Production';
import Sales from './pages/Sales';
import Payments from './pages/Payments';
import Utilities from './pages/Utilities';
import Employees from './pages/Employees';
import Salaries from './pages/Salaries';
import Reports from './pages/Reports';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="app-layout">
        {isAuthenticated && <Navigation />}
        <div className={isAuthenticated ? "main-content" : ""}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test-login" element={<TestLogin />} />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/products" element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            } />
            <Route path="/batch-tracking" element={
              <PrivateRoute>
                <BatchTracking />
              </PrivateRoute>
            } />
            <Route path="/inventory" element={
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            } />
            <Route path="/production" element={
              <PrivateRoute>
                <Production />
              </PrivateRoute>
            } />
            <Route path="/sales" element={
              <PrivateRoute>
                <Sales />
              </PrivateRoute>
            } />
            <Route path="/payments" element={
              <PrivateRoute>
                <Payments />
              </PrivateRoute>
            } />
            <Route path="/utilities" element={
              <PrivateRoute>
                <Utilities />
              </PrivateRoute>
            } />
            <Route path="/employees" element={
              <PrivateRoute>
                <Employees />
              </PrivateRoute>
            } />
            <Route path="/salaries" element={
              <PrivateRoute>
                <Salaries />
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

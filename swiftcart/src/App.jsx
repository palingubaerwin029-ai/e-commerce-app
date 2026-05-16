import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  PlusCircle 
} from 'lucide-react'

// Pages (will create these next)
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import EditProduct from './pages/EditProduct'
import Orders from './pages/Orders'
import Login from './pages/Login'

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <ShoppingBag size={32} />
        <span>SwiftCart</span>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
          <Package size={20} />
          Products
        </Link>
        <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
          <ShoppingBag size={20} />
          Orders
        </Link>
      </nav>
      <div style={{ marginTop: 'auto' }}>
        <button className="nav-link" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }} 
                onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/login'; }}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  )
}

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/products/add" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
        <Route path="/products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App

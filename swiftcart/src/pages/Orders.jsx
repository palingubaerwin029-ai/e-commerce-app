import React, { useEffect, useState } from 'react';
import { fetchAllOrders, updateOrderStatus } from '../services/api';
import { Package, Clock, CheckCircle, Truck, ShoppingBag, Eye } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'shipped': return 'badge-primary';
      case 'delivered': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return '';
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading orders...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Orders</h1>
          <p style={{ color: '#64748b' }}>Monitor and manage customer transactions</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><span style={{ fontWeight: 700, color: '#475569' }}>#{order.id}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>{order.user_email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.phone || 'No phone'}</div>
                  </td>
                  <td><span style={{ fontWeight: 700 }}>${parseFloat(order.total_amount).toFixed(2)}</span></td>
                  <td>
                    <div className={`badge ${getStatusClass(order.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getStatusIcon(order.status)}
                      {order.status.toUpperCase()}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <select 
                      value={order.status} 
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '0.4rem', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;

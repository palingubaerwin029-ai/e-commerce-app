import React, { useEffect, useState, useMemo } from 'react';
import { fetchAllOrders, updateOrderStatus } from '../services/api';
import { Package, Clock, CheckCircle, Truck, ShoppingBag, Eye } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCustomerEmail, setExpandedCustomerEmail] = useState(null);

  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart.charAt(0)}***@${domain}`;
    }
    return `${localPart.substring(0, 3)}***@${domain}`;
  };

  const groupedByCustomer = useMemo(() => {
    const groups = {};
    orders.forEach(order => {
      const email = order.user_email || 'unknown';
      if (!groups[email]) {
        groups[email] = {
          user_name: order.user_name || 'Customer',
          user_email: order.user_email,
          orders: [],
          totalSpent: 0,
        };
      }
      groups[email].orders.push(order);
      groups[email].totalSpent += parseFloat(order.total_amount || 0);
    });
    return Object.values(groups);
  }, [orders]);

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
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
                <th>Customer</th>
                <th>Email Address</th>
                <th>Orders Placed</th>
                <th>Total Spent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedByCustomer.map(customer => {
                const isExpanded = expandedCustomerEmail === customer.user_email;
                return (
                  <React.Fragment key={customer.user_email}>
                    <tr 
                      onClick={() => setExpandedCustomerEmail(isExpanded ? null : customer.user_email)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s', background: isExpanded ? '#f8fafc' : 'white' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {customer.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{customer.user_name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{maskEmail(customer.user_email)}</span>
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ShoppingBag size={12} />
                          {customer.orders.length} {customer.orders.length === 1 ? 'order' : 'orders'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₱{customer.totalSpent.toFixed(2)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{isExpanded ? 'Hide Details' : 'View Orders'}</span>
                          <Eye size={16} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan="5" style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              Order History — {customer.user_name}
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              {customer.orders.map(order => (
                                <div key={order.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                  
                                  {/* Order Title bar */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Order #{order.id}</span>
                                      <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>{new Date(order.created_at).toLocaleDateString()}</span>
                                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: '#475569', fontWeight: 600 }}>
                                        {order.payment_method || 'Cash on Delivery'}
                                      </span>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)' }}>₱{parseFloat(order.total_amount).toFixed(2)}</span>
                                      
                                      <div className={`badge ${getStatusClass(order.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {getStatusIcon(order.status)}
                                        {order.status.toUpperCase()}
                                      </div>

                                      <select 
                                        value={order.status} 
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', outline: 'none', fontWeight: 600 }}
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Purchased Items Grid */}
                                  <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Items purchased</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.50rem' }}>
                                      {order.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                                          <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            {item.image ? (
                                              <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                              <Package size={14} color="#cbd5e1" />
                                            )}
                                          </div>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155', lineHeight: 1.2 }}>{item.title}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                                              {item.quantity} units @ ₱{parseFloat(item.price).toFixed(2)}
                                            </div>
                                          </div>
                                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>
                                            ₱{(item.quantity * parseFloat(item.price)).toFixed(2)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Delivery information */}
                                  {(order.delivery_address || order.delivery_lat) && (
                                    <div style={{ borderTop: '1px dashed #f1f5f9', paddingTop: '0.5rem', fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 600 }}>Delivery address:</span>
                                      <span style={{ marginLeft: '0.25rem' }}>{order.delivery_address || 'Cabildo St, Intramuros, Manila'}</span>
                                      {order.delivery_lat && (
                                        <span style={{ color: '#94a3b8', marginLeft: '0.75rem', fontWeight: 500 }}>
                                          ({parseFloat(order.delivery_lat).toFixed(4)}, {parseFloat(order.delivery_lng).toFixed(4)})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;

import React, { useEffect, useState } from 'react';
import { fetchAdminProducts, fetchAllOrders } from '../services/api';
import { Package, ShoppingBag, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [products, orders] = await Promise.all([
          fetchAdminProducts(),
          fetchAllOrders(),
        ]);

        const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        const lowStock = products.filter(p => p.stock <= 10).length;

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue: revenue,
          lowStock: lowStock,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const statCards = [
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: '#10b981', bg: '#dcfce7' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#6366f1', bg: '#e0e7ff' },
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: '#a855f7', bg: '#f3e8ff' },
    { title: 'Low Stock Alert', value: stats.lowStock, icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading Dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Dashboard Overview</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Welcome back, Admin</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {statCards.map((card, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: card.bg, color: card.color, borderRadius: '1rem' }}>
              <card.icon size={28} />
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>{card.title}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Performance</h2>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '1rem' }}>
            {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
              <div key={i} style={{ flex: 1, background: 'var(--primary)', height: `${h}%`, borderRadius: '0.25rem 0.25rem 0 0', opacity: 0.8 }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ padding: '1rem', background: '#fef3c7', color: '#d97706', borderRadius: '50%', marginBottom: '1rem' }}>
            <TrendingUp size={32} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sales are up 12%</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>Compared to last week's performance</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

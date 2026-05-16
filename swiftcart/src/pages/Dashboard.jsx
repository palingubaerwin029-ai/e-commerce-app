import React, { useEffect, useState } from 'react';
import { fetchAdminProducts, fetchAllOrders } from '../services/api';
import { Package, ShoppingBag, DollarSign, TrendingUp, AlertCircle, Folder } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStock: 0,
  });
  const [categoryStats, setCategoryStats] = useState([]);
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

        // Calculate category distribution
        const catMap = products.reduce((acc, p) => {
          const cat = p.category || 'Uncategorized';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});

        const categories = Object.entries(catMap).map(([name, count]) => ({
          name,
          count,
          percentage: (count / products.length) * 100
        })).sort((a, b) => b.count - a.count);

        setCategoryStats(categories);
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
    { title: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'var(--success)', bg: '#E8F5E9' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#6366f1', bg: '#EEF2FF' },
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { title: 'Low Stock Alert', value: stats.lowStock, icon: AlertCircle, color: 'var(--danger)', bg: '#FFF5F5' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
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

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Sales Growth</h2>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flex: 1 }}>
            <div style={{ padding: '1rem', background: '#fef3c7', color: '#d97706', borderRadius: '50%', marginBottom: '1rem' }}>
              <TrendingUp size={32} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Up 12%</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>vs last week</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Folder size={20} /> Inventory by Category
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {categoryStats.map((cat, i) => (
            <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{cat.name}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{cat.count}</span>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${cat.percentage}%`, height: '100%', background: 'var(--primary)' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                {cat.percentage.toFixed(1)}% of total inventory
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


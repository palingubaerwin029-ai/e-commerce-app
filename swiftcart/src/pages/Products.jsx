import React, { useEffect, useState, useMemo } from 'react';
import { fetchAdminProducts, deleteProduct } from '../services/api';
import { Plus, Edit2, Trash2, Search, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Uncategorized'));
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                            p.category?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (p.category || 'Uncategorized') === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Group by category
    const groups = filtered.reduce((acc, p) => {
      const cat = p.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});

    return groups;
  }, [products, search, selectedCategory]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading products...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Products</h1>
          <p style={{ color: '#64748b' }}>Manage your inventory and product details</p>
        </div>
        <Link to="/products/add" className="btn btn-primary">
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: '300px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <Filter size={18} color="#94a3b8" />
            <select 
              className="input" 
              style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', cursor: 'pointer', outline: 'none' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          {Object.keys(groupedProducts).length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No products found matching your criteria.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedProducts).map(([category, items]) => (
                  <React.Fragment key={category}>
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan="5" style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: '#475569', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {category} ({items.length})
                      </td>
                    </tr>
                    {items.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '0.5rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {product.image ? <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Package size={18} color="#cbd5e1" />}
                            </div>
                            <span style={{ fontWeight: 600 }}>{product.title}</span>
                          </div>
                        </td>
                        <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(product.price).toFixed(2)}</span></td>
                        <td>{product.stock} units</td>
                        <td>
                          <span className={`badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <Link to={`/products/edit/${product.id}`} className="btn" style={{ padding: '0.4rem', color: '#64748b' }}>
                              <Edit2 size={18} />
                            </Link>
                            <button onClick={() => handleDelete(product.id, product.title)} className="btn" style={{ padding: '0.4rem', color: 'var(--danger)' }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;


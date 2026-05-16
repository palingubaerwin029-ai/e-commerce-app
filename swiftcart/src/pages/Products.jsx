import React, { useEffect, useState } from 'react';
import { fetchAdminProducts, deleteProduct } from '../services/api';
import { Plus, Edit2, Trash2, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or category..." 
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', outline: 'none' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {product.image ? <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Package size={20} color="#cbd5e1" />}
                      </div>
                      <span style={{ fontWeight: 600 }}>{product.title}</span>
                    </div>
                  </td>
                  <td><span style={{ textTransform: 'capitalize' }}>{product.category || 'Uncategorized'}</span></td>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;

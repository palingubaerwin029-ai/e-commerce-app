import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAdminProductById, createProduct, updateProduct, uploadImage, fetchCategories } from '../services/api';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    stock: '',
    description: '',
    category: '',
    image: '',
    is_new: false,
    is_popular: false
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await fetchAdminProductById(id);
      setFormData({
        title: data.title,
        price: data.price,
        stock: data.stock,
        description: data.description || '',
        category: data.category || '',
        image: data.image || '',
        is_new: !!data.is_new,
        is_popular: !!data.is_popular
      });
    } catch (err) {
      alert('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };
      if (isEdit) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }
      navigate('/products');
    } catch (err) {
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading details...</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/products')} className="btn" style={{ padding: '0.5rem', background: 'white', border: '1px solid var(--border)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
            <p style={{ color: '#64748b' }}>{isEdit ? `Editing ID: ${id}` : 'Create a new entry in your catalog'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Basic Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Product Title</label>
                <input 
                  name="title" required
                  className="input" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                  value={formData.title} onChange={handleChange}
                  placeholder="e.g., Wireless Headphones"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description</label>
                <textarea 
                  name="description" rows={5}
                  className="input" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', resize: 'none' }}
                  value={formData.description} onChange={handleChange}
                  placeholder="Describe the features and specs..."
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Pricing & Inventory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Price (₱)</label>
                <input 
                  name="price" type="number" step="0.01" required
                  className="input" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                  value={formData.price} onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Stock Units</label>
                <input 
                  name="stock" type="number" required
                  className="input" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                  value={formData.stock} onChange={handleChange}
                  placeholder="100"
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Organization</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Category</label>
                <input 
                  name="category"
                  list="categories-list"
                  className="input" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                  value={formData.category} onChange={handleChange}
                  placeholder="e.g., Electronics"
                  autoComplete="off"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_new" checked={formData.is_new} onChange={handleChange} />
                  <span style={{ fontSize: '0.875rem' }}>Mark as New</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_popular" checked={formData.is_popular} onChange={handleChange} />
                  <span style={{ fontSize: '0.875rem' }}>Mark as Popular</span>
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 700 }}>Product Media</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.image ? (
                <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={formData.image} alt="" style={{ width: '100%', display: 'block' }} />
                  <button onClick={() => setFormData({ ...formData, image: '' })} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.25rem', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
                    <X size={16} color="var(--danger)" />
                  </button>
                </div>
              ) : (
                <label style={{ height: '160px', border: '2px dashed var(--border)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <Upload color="var(--primary)" />
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{uploading ? 'Uploading...' : 'Click to upload image'}</span>
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              <input 
                name="image"
                style={{ fontSize: '0.75rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.25rem' }}
                placeholder="Or paste image URL"
                value={formData.image} onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', justifyContent: 'center' }} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {isEdit ? 'Save Changes' : 'Create Product'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;

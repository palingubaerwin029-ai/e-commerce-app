import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Set auth token for all requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('adminToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('adminToken');
  }
};

// Initialize token from localStorage
const storedToken = localStorage.getItem('adminToken');
if (storedToken) {
  setAuthToken(storedToken);
}

// Auth API
export const adminLogin = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  
  if (user.role !== 'admin') {
    throw new Error('Access denied. Admin only.');
  }
  
  setAuthToken(token);
  return response.data;
};

// Products API
export const fetchAdminProducts = async () => {
  const response = await api.get('/admin/products');
  return response.data;
};

export const fetchAdminProductById = async (id) => {
  const response = await api.get(`/admin/products/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/admin/products/${id}`, productData);
  return response.data;
};

export const updateProductStock = async (id, stock) => {
  const response = await api.put(`/admin/products/${id}/stock`, { stock });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/admin/products/${id}`);
  return response.data;
};

// Orders API
export const fetchAllOrders = async () => {
  const response = await api.get('/admin/orders');
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.put(`/admin/orders/${id}/status`, { status });
  return response.data;
};

// Image Upload
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.imageUrl;
};

export default api;

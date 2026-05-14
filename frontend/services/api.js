const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.77.191.178:5000/api';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export const apiLogin = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const apiSignup = async (name, email, password) => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Signup failed');
  return data;
};

export const fetchProducts = async (search = '', category = '') => {
  try {
    let url = `${BASE_URL}/products?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from server. Expected an array.');
    }
    return data;
  } catch (error) {
    console.error('Error fetching products API:', error);
    throw error;
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  const response = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create product');
  return data;
};

export const createOrder = async (items, total_amount) => {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ items, total_amount }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create order');
  return data;
};

export const fetchOrders = async () => {
  const response = await fetch(`${BASE_URL}/orders`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
  return data;
};

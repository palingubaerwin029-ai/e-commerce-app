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

export const apiSignup = async (name, email, password, phone) => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password, phone }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Signup failed');
  return data;
};

export const updateAvatar = async (avatarUrl) => {
  const response = await fetch(`${BASE_URL}/auth/profile/avatar`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ avatar: avatarUrl }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update avatar');
  return data;
};

export const fetchProducts = async (search = '', category = '', filter = '') => {
  try {
    let url = `${BASE_URL}/products?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (filter) url += `filter=${encodeURIComponent(filter)}`;
    
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

export const createOrder = async (items, total_amount, deliveryLocation = null, payment_method = 'Cash on Delivery') => {
  const body = { items, total_amount, payment_method };
  if (deliveryLocation) {
    body.delivery_lat = deliveryLocation.latitude;
    body.delivery_lng = deliveryLocation.longitude;
    body.delivery_address = deliveryLocation.address;
  }

  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
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

export const fetchOrderById = async (orderId) => {
  const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch order');
  return data;
};

// --- Coupon API ---

export const fetchCoupons = async () => {
  const response = await fetch(`${BASE_URL}/coupons`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch coupons');
  return data;
};

export const claimCoupon = async (couponId) => {
  const response = await fetch(`${BASE_URL}/coupons/${couponId}/claim`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to claim coupon');
  return data;
};

export const fetchMyCoupons = async () => {
  const response = await fetch(`${BASE_URL}/coupons/my`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch coupons');
  return data;
};

export const applyCoupon = async (code, total) => {
  const response = await fetch(`${BASE_URL}/coupons/apply`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ code, total }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Invalid coupon');
  return data;
};

export const markCouponUsed = async (couponId) => {
  const response = await fetch(`${BASE_URL}/coupons/use`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ couponId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed');
  return data;
};

// --- Admin API ---

export const fetchAdminProducts = async () => {
  const response = await fetch(`${BASE_URL}/admin/products`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
  return data;
};

export const updateProductStock = async (productId, stock) => {
  const response = await fetch(`${BASE_URL}/admin/products/${productId}/stock`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ stock }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update stock');
  return data;
};

export const deleteProduct = async (productId) => {
  const response = await fetch(`${BASE_URL}/admin/products/${productId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete product');
  return data;
};

export const updateProduct = async (productId, productData) => {
  const response = await fetch(`${BASE_URL}/admin/products/${productId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update product');
  return data;
};

export const fetchAdminProductById = async (productId) => {
  const response = await fetch(`${BASE_URL}/admin/products/${productId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch product');
  return data;
};

export const fetchAllOrders = async () => {
  const response = await fetch(`${BASE_URL}/admin/orders`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch all orders');
  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update order status');
  return data;
};

export const uploadImage = async (uri) => {
  const formData = new FormData();
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('image', { uri, name: filename, type });

  const headers = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  // Let fetch set the boundary for multipart/form-data
  
  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: headers,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Upload failed');
  return data.imageUrl;
};

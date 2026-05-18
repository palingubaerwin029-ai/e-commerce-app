import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.153.251.178:5000/api';

const CACHE_PREFIX = '@swiftcart_cache:';

export const getCache = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    const { data, expiry } = JSON.parse(cached);
    if (expiry && Date.now() > expiry) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch (error) {
    console.error(`[Cache Error] Failed to read key "${key}":`, error);
    return null;
  }
};

export const setCache = async (key, data, ttlMs = 5 * 60 * 1000) => {
  try {
    const expiry = ttlMs ? Date.now() + ttlMs : null;
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, expiry })
    );
  } catch (error) {
    console.error(`[Cache Error] Failed to write key "${key}":`, error);
  }
};

export const deleteCache = async (key) => {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.error(`[Cache Error] Failed to delete key "${key}":`, error);
  }
};

export const clearCachePattern = async (pattern) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) && k.includes(pattern));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[Cache Invalidation] Cleared client keys matching "${pattern}"`);
    }
  } catch (error) {
    console.error(`[Cache Error] Failed to clear pattern "${pattern}":`, error);
  }
};

export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('[Cache Invalidation] Cleared all client-side cache keys');
    }
  } catch (error) {
    console.error('[Cache Error] Failed to clear all caches:', error);
  }
};

let authToken = null;
let onInvalidTokenCallback = null;

export const registerInvalidTokenCallback = (callback) => {
  onInvalidTokenCallback = callback;
};

const nativeFetch = global.fetch;
const fetch = async (input, init) => {
  const response = await nativeFetch(input, init);
  if (response.status === 401 || response.status === 403) {
    try {
      const cloned = response.clone();
      const data = await cloned.json();
      if (data && (data.message === 'Invalid Token' || data.message === 'Access Denied: No Token Provided!')) {
        await clearAllCache(); // Invalidate cache on session expiration
        if (onInvalidTokenCallback) {
          onInvalidTokenCallback();
        }
      }
    } catch (e) {
      // Ignored
    }
  }
  return response;
};

export const setAuthToken = (token) => {
  authToken = token;
  if (!token) {
    clearAllCache(); // Invalidate cache when logging out
  }
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
  await clearAllCache(); // Invalidate cache on new successful login
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

export const fetchProducts = async (search = '', category = '', filter = '', forceRefresh = false) => {
  const cacheKey = `products_search_${search}_cat_${category}_filt_${filter}`;
  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Client Cache HIT] Products for key: ${cacheKey}`);
      return cachedData;
    }
  }

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
    await setCache(cacheKey, data); // Cache default TTL: 5 minutes
    return data;
  } catch (error) {
    console.error('Error fetching products API:', error);
    throw error;
  }
};

export const fetchProductById = async (id, forceRefresh = false) => {
  const cacheKey = `product_${id}`;
  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Client Cache HIT] Product details for key: ${cacheKey}`);
      return cachedData;
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    await setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await fetch(`${BASE_URL}/products/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
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
  await clearCachePattern('products'); // Invalidate locally cached product listings
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
  
  // Invalidate order, claimed coupon, and notification caches on successful order
  await clearCachePattern('orders');
  await clearCachePattern('my_coupons');
  await clearCachePattern('notifications');
  return data;
};

export const fetchOrders = async (forceRefresh = false) => {
  const cacheKey = 'orders';
  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log('[Client Cache HIT] Orders list');
      return cachedData;
    }
  }

  const response = await fetch(`${BASE_URL}/orders`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
  await setCache(cacheKey, data, 2 * 60 * 1000); // 2 minutes TTL for orders
  return data;
};

export const fetchOrderById = async (orderId, forceRefresh = false) => {
  const cacheKey = `order_${orderId}`;
  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Client Cache HIT] Order detail for key: ${cacheKey}`);
      return cachedData;
    }
  }

  const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch order');
  await setCache(cacheKey, data, 2 * 60 * 1000);
  return data;
};

// --- Coupon API ---

export const fetchCoupons = async (forceRefresh = false) => {
  const cacheKey = 'coupons';
  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log('[Client Cache HIT] Coupons list');
      return cachedData;
    }
  }

  const response = await fetch(`${BASE_URL}/coupons`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch coupons');
  await setCache(cacheKey, data, 5 * 60 * 1000);
  return data;
};

export const claimCoupon = async (couponId) => {
  const response = await fetch(`${BASE_URL}/coupons/${couponId}/claim`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to claim coupon');
  
  // Invalidate coupon lists and notification caches upon claiming one
  await clearCachePattern('coupons');
  await clearCachePattern('my_coupons');
  await clearCachePattern('notifications');
  return data;
};

export const fetchMyCoupons = async (forceRefresh = false) => {
  const cacheKey = 'my_coupons';
  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log('[Client Cache HIT] My Coupons');
      return cachedData;
    }
  }

  const response = await fetch(`${BASE_URL}/coupons/my`, { headers: getHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch coupons');
  await setCache(cacheKey, data, 5 * 60 * 1000);
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

// --- Notifications API ---

export const fetchNotifications = async (forceRefresh = false) => {
  const cacheKey = 'notifications';
  if (!forceRefresh) {
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log('[Client Cache HIT] Notifications list');
      return cachedData;
    }
  }

  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
  await setCache(cacheKey, data, 30 * 1000); // 30 seconds cache TTL
  return data;
};

export const markNotificationRead = async (id) => {
  const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to mark notification as read');
  await clearCachePattern('notifications');
  return data;
};

export const markAllNotificationsRead = async () => {
  const response = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to mark all notifications as read');
  await clearCachePattern('notifications');
  return data;
};

export const deleteNotification = async (id) => {
  const response = await fetch(`${BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete notification');
  await clearCachePattern('notifications');
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

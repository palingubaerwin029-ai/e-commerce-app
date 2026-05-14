import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '../services/api';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');

  const loadProducts = useCallback(async (search = searchQuery, cat = category) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(search, cat);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, category]);

  useEffect(() => {
    loadProducts(searchQuery, category);
  }, [searchQuery, category]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(searchQuery, category);
  }, [searchQuery, category, loadProducts]);

  return { 
    products, 
    loading, 
    error, 
    refreshing, 
    onRefresh, 
    retry: () => loadProducts(searchQuery, category),
    searchQuery,
    setSearchQuery,
    category,
    setCategory
  };
}

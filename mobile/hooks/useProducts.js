import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '../services/api';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState(''); // '', 'newest', 'popular'

  const loadProducts = useCallback(async (search = searchQuery, cat = category, filt = filter, force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(search, cat, filt, force);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, category, filter]);

  useEffect(() => {
    loadProducts(searchQuery, category, filter, false);
  }, [searchQuery, category, filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts(searchQuery, category, filter, true);
  }, [searchQuery, category, filter, loadProducts]);

  return { 
    products, 
    loading, 
    error, 
    refreshing, 
    onRefresh, 
    retry: () => loadProducts(searchQuery, category, filter),
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    filter,
    setFilter
  };
}

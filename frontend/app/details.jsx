import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { fetchProductById } from '../services/api';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProduct = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductById(id);
      setProduct(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#0a84ff" />
      </ThemedView>
    );
  }

  if (error || !product) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error || 'Product not found'}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadProduct}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.carouselContainer}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
        </View>
        <ThemedView style={styles.infoContainer}>
          <ThemedText style={styles.category}>{product.category}</ThemedText>
          <ThemedText type="title" style={styles.title}>{product.title}</ThemedText>
          <ThemedText style={styles.price}>${parseFloat(product.price).toFixed(2)}</ThemedText>
          <ThemedText style={styles.descriptionHeader}>Description</ThemedText>
          <ThemedText style={styles.description}>{product.description}</ThemedText>
        </ThemedView>
      </ScrollView>
      <ThemedView style={styles.bottomBar}>
        <TouchableOpacity style={styles.button} onPress={() => { addToCart(product); showToast('Added to cart!'); }}>
          <ThemedText style={styles.buttonText}>Add to Cart</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0056D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  carouselContainer: {
    height: 400,
    width: '100%',
    backgroundColor: '#F1F5F9',
  },
  carousel: {
    flex: 1,
  },
  image: {
    height: 400,
    width: 400, // assuming device width approximately, real implementation would use Dimensions.get('window').width
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4F46E5',
    width: 24,
  },
  infoContainer: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 500,
  },
  category: {
    fontSize: 14,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4F46E5',
    marginBottom: 24,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#0F172A'
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
});

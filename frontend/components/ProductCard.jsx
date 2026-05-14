import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Link } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { LinearGradient } from 'expo-linear-gradient';


export function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  return (
    <ThemedView style={styles.card}>
      <Link href={{ pathname: '/details', params: { id: product.id } }} asChild>
        <TouchableOpacity>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
          <ThemedView style={styles.infoContainer}>
            <ThemedText style={styles.title} numberOfLines={2}>
              {product.title}
            </ThemedText>
            <ThemedText style={styles.price}>${parseFloat(product.price).toFixed(2)}</ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => { addToCart(product); showToast('Added to cart!'); }}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <ThemedText style={styles.buttonText}>Add to Cart</ThemedText>
        </LinearGradient>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    margin: 6,
    width: '46%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  image: {
    height: 160,
    width: '100%',
    backgroundColor: '#F1F5F9',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
    color: '#1E293B',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 16,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

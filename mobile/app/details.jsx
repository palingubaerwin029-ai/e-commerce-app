import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { fetchProductById } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../constants/theme';
import { wp, hp, ms, fs, sw, SCREEN_WIDTH } from '../utils/responsive';
import { triggerHaptic } from '../utils/haptics';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

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

  useEffect(() => { loadProduct(); }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={ms(44)} color="#ccc" />
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProduct}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
          <SafeAreaView style={styles.topBar}>
            <TouchableOpacity style={styles.topButton} onPress={() => { triggerHaptic('selection'); router.back(); }}>
              <Ionicons name="chevron-back" size={ms(20)} color="#333" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Product Details</Text>
            <TouchableOpacity style={styles.topButton} onPress={() => triggerHaptic('light')}>
              <Ionicons name="heart-outline" size={ms(20)} color="#333" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{product.category}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={ms(14)} color="#FFC107" />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <Text style={styles.descHeader}>Product Details</Text>
          <Text style={styles.description} numberOfLines={showFullDesc ? undefined : 3}>
            {product.description}
          </Text>
          <TouchableOpacity onPress={() => { triggerHaptic('selection'); setShowFullDesc(!showFullDesc); }}>
            <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.price}>₱{parseFloat(product.price).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => { triggerHaptic('light'); addToCart(product); showToast('Added to cart!'); }}
          activeOpacity={0.8}
        >
          <Ionicons name="cart" size={ms(16)} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: wp(5), backgroundColor: '#fff' },
  errorText: { fontSize: fs(14), color: '#999', textAlign: 'center', marginTop: hp(1.5), marginBottom: hp(2.5) },
  retryButton: { backgroundColor: ACCENT, paddingHorizontal: sw(28), paddingVertical: sw(12), borderRadius: sw(24) },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: fs(14) },
  scrollContent: { paddingBottom: hp(14) },

  imageSection: {
    height: hp(45),
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: wp(60), height: wp(60) },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  topButton: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(12),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: sw(6),
    shadowOffset: { width: 0, height: sw(2) },
    elevation: 3,
  },
  topTitle: { fontSize: fs(16), fontWeight: '700', color: '#333' },

  infoSection: { padding: wp(6) },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1) },
  category: { fontSize: fs(12), color: '#999', textTransform: 'capitalize' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: sw(4) },
  ratingText: { fontSize: fs(13), fontWeight: '700', color: '#333' },
  title: { fontSize: fs(20), fontWeight: '800', color: '#1A1A2E', lineHeight: fs(28), marginBottom: hp(2.5) },
  descHeader: { fontSize: fs(15), fontWeight: '700', color: '#1A1A2E', marginBottom: hp(1) },
  description: { fontSize: fs(13), lineHeight: fs(21), color: '#777' },
  readMore: { color: ACCENT, fontWeight: '600', fontSize: fs(13), marginTop: hp(0.8) },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(2),
    paddingBottom: hp(4),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceLabel: { fontSize: fs(11), color: '#999', marginBottom: sw(2) },
  price: { fontSize: fs(22), fontWeight: '900', color: '#1A1A2E' },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT,
    paddingHorizontal: sw(24),
    paddingVertical: sw(13),
    borderRadius: sw(14),
    gap: sw(8),
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: sw(8),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 6,
  },
  addToCartText: { color: '#fff', fontSize: fs(15), fontWeight: '700' },
});

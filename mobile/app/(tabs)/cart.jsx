import React from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../../constants/theme';
import { wp, hp, ms, fs, sw } from '../../utils/responsive';

export default function CartScreen() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { showToast } = useToast();
  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <Text style={styles.headerCount}>{cartItems.length} items</Text>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={ms(50)} color="#ddd" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Start adding some products!</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.shopButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            contentContainerStyle={styles.listContent}
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemImageBox}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="contain" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.itemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => {
                        if (item.quantity <= 1) removeFromCart(item.id);
                        else if (updateQuantity) updateQuantity(item.id, item.quantity - 1);
                      }}
                    >
                      <Ionicons name="remove" size={ms(14)} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity && updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={ms(14)} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
                  <Ionicons name="trash-outline" size={ms(16)} color={ACCENT} />
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={() => router.push('/checkout')} activeOpacity={0.8}>
              <Text style={styles.checkoutText}>Checkout</Text>
              <Ionicons name="arrow-forward" size={ms(16)} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
  },
  headerTitle: { fontSize: fs(22), fontWeight: '800', color: '#1A1A2E' },
  headerCount: { fontSize: fs(13), color: '#999', fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(10) },
  emptyIcon: {
    width: sw(90),
    height: sw(90),
    borderRadius: sw(45),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  emptyTitle: { fontSize: fs(18), fontWeight: '700', color: '#333', marginBottom: hp(1) },
  emptySubtitle: { fontSize: fs(14), color: '#999', marginBottom: hp(3) },
  shopButton: { backgroundColor: ACCENT, paddingHorizontal: sw(28), paddingVertical: sw(13), borderRadius: sw(14) },
  shopButtonText: { color: '#fff', fontSize: fs(14), fontWeight: '700' },
  listContent: { paddingHorizontal: wp(5), paddingBottom: hp(18) },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: sw(16),
    padding: sw(12),
    marginBottom: hp(1.5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: sw(8),
    shadowOffset: { width: 0, height: sw(2) },
    elevation: 2,
  },
  itemImageBox: {
    width: sw(72),
    height: sw(72),
    borderRadius: sw(12),
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sw(12),
  },
  itemImage: { width: sw(52), height: sw(52) },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: fs(13), fontWeight: '600', color: '#333', marginBottom: sw(3) },
  itemPrice: { fontSize: fs(15), fontWeight: '800', color: ACCENT, marginBottom: sw(6) },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: sw(10) },
  qtyButton: {
    width: sw(26),
    height: sw(26),
    borderRadius: sw(8),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: fs(14), fontWeight: '700', color: '#333' },
  removeButton: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(10),
    backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: sw(8),
  },
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: sw(10),
    shadowOffset: { width: 0, height: sw(-4) },
    elevation: 8,
  },
  totalLabel: { fontSize: fs(12), color: '#999', marginBottom: sw(2) },
  totalPrice: { fontSize: fs(22), fontWeight: '900', color: '#1A1A2E' },
  checkoutButton: {
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
  checkoutText: { color: '#fff', fontSize: fs(15), fontWeight: '700' },
});

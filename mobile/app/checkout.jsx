import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createOrder, applyCoupon, markCouponUsed, fetchMyCoupons } from '../services/api';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../constants/theme';
import { wp, hp, ms, fs, sw } from '../utils/responsive';

export default function CheckoutScreen() {
  const { cartItems, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [myCoupons, setMyCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, total - discount);

  useEffect(() => {
    if (user) loadMyCoupons();
  }, [user]);

  const loadMyCoupons = async () => {
    try { const data = await fetchMyCoupons(); setMyCoupons(data); } catch (e) { console.error(e); }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await applyCoupon(couponCode.trim(), total);
      setAppliedCoupon(result);
      showToast(`${result.percent}% off applied! -$${result.discount.toFixed(2)}`);
    } catch (e) {
      showToast(e.message || 'Invalid coupon', 'error');
      setAppliedCoupon(null);
    } finally { setCouponLoading(false); }
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { showToast('Location permission needed', 'error'); setLocationLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setDeliveryLocation(coords);
      try {
        const [place] = await Location.reverseGeocodeAsync(coords);
        if (place) { setAddress([place.street, place.district, place.city, place.region, place.country].filter(Boolean).join(', ')); }
      } catch { setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`); }
    } catch (err) { showToast('Failed to get location', 'error'); }
    finally { setLocationLoading(false); }
  };

  const handleMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setDeliveryLocation(coords);
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place) { setAddress([place.street, place.district, place.city, place.region, place.country].filter(Boolean).join(', ')); }
    } catch { setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`); }
  };

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  const paymentMethods = [
    { id: 'Cash on Delivery', icon: 'cash-outline', label: 'Cash on Delivery' },
    { id: 'GCash', icon: 'wallet-outline', label: 'GCash' },
    { id: 'PayMaya', icon: 'card-outline', label: 'PayMaya' },
    { id: 'Credit/Debit Card', icon: 'card-outline', label: 'Credit/Debit Card' },
  ];

  const handlePlaceOrder = async () => {
    if (!user) { showToast('Please log in', 'error'); router.push('/(auth)/login'); return; }
    if (!deliveryLocation) { showToast('Please set delivery location', 'error'); return; }
    setLoading(true);
    try {
      const items = cartItems.map(item => ({ id: item.id, quantity: item.quantity, price: item.price }));
      await createOrder(items, finalTotal, { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude, address }, paymentMethod);
      if (appliedCoupon) await markCouponUsed(appliedCoupon.couponId);
      clearCart();
      showToast('Order placed!', 'success');
      router.replace('/orders');
    } catch (e) { showToast(e.message || 'Failed to place order', 'error'); }
    finally { setLoading(false); }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.emptyIcon}><Ionicons name="bag-outline" size={ms(44)} color="#ddd" /></View>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.shopButtonText}>Go Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Order Summary</Text>

        {/* Customer Info */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <Ionicons name="person-circle-outline" size={ms(20)} color="#333" />
            <Text style={styles.customerName}>{user?.name}</Text>
          </View>
          {user?.phone && (
            <View style={styles.customerRow}>
              <Ionicons name="call-outline" size={ms(16)} color="#999" />
              <Text style={styles.customerPhone}>{user.phone}</Text>
            </View>
          )}
          <View style={styles.customerRow}>
            <Ionicons name="mail-outline" size={ms(16)} color="#999" />
            <Text style={styles.customerPhone}>{user?.email}</Text>
          </View>
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.card}>
          {cartItems.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.quantity}x {item.title}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>${total.toFixed(2)}</Text>
          </View>
          {appliedCoupon && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#10B981' }]}>Discount ({appliedCoupon.percent}%)</Text>
              <Text style={[styles.totalLabel, { color: '#10B981', fontWeight: '700' }]}>-${discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Coupon Section */}
        <Text style={styles.sectionTitle}>Coupon</Text>
        <View style={styles.card}>
          <View style={styles.couponInputRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              placeholderTextColor="#bbb"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon} disabled={couponLoading}>
              {couponLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                <Text style={styles.applyText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
          {appliedCoupon && (
            <View style={styles.appliedRow}>
              <Ionicons name="checkmark-circle" size={ms(16)} color="#10B981" />
              <Text style={styles.appliedText}>{appliedCoupon.code} — {appliedCoupon.percent}% off</Text>
              <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponCode(''); }}>
                <Ionicons name="close-circle" size={ms(18)} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          {myCoupons.length > 0 && !appliedCoupon && (
            <View style={styles.myCouponsContainer}>
              <Text style={styles.myCouponsLabel}>Your coupons:</Text>
              {myCoupons.map(c => (
                <TouchableOpacity key={c.id} style={styles.myCouponChip} onPress={() => { setCouponCode(c.code); }}>
                  <Ionicons name="ticket-outline" size={ms(12)} color={ACCENT} />
                  <Text style={styles.myCouponText}>{c.code} ({c.discount_percent}%)</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.card}>
          {paymentMethods.map((method) => (
            <TouchableOpacity 
              key={method.id} 
              style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionSelected]} 
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.paymentIconContainer}>
                <Ionicons name={method.icon} size={ms(20)} color={paymentMethod === method.id ? ACCENT : '#666'} />
              </View>
              <Text style={[styles.paymentLabel, paymentMethod === method.id && styles.paymentLabelSelected]}>{method.label}</Text>
              {paymentMethod === method.id && <Ionicons name="checkmark-circle" size={ms(20)} color={ACCENT} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Delivery Location</Text>
        <View style={styles.card}>
          {!deliveryLocation ? (
            <TouchableOpacity style={styles.locationButton} onPress={getLocation} disabled={locationLoading}>
              {locationLoading ? <ActivityIndicator size="small" color={ACCENT} /> : (
                <><Ionicons name="location-outline" size={ms(20)} color={ACCENT} /><Text style={styles.locationButtonText}>Use My Current Location</Text></>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <MapView style={styles.map} initialRegion={{ ...deliveryLocation, latitudeDelta: 0.005, longitudeDelta: 0.005 }} onPress={handleMapPress}>
                <Marker coordinate={deliveryLocation} title="Delivery Location" description={address} pinColor={ACCENT} />
              </MapView>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={ms(16)} color={ACCENT} />
                <Text style={styles.addressText} numberOfLines={2}>{address || 'Loading...'}</Text>
              </View>
              <TouchableOpacity style={styles.changeLocationBtn} onPress={getLocation}>
                <Text style={styles.changeLocationText}>📍 Re-detect my location</Text>
              </TouchableOpacity>
              <Text style={styles.mapHint}>Tap the map to adjust your delivery pin</Text>
            </>
          )}
        </View>

        <TouchableOpacity style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]} onPress={handlePlaceOrder} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="checkmark-circle" size={ms(18)} color="#fff" /><Text style={styles.placeOrderText}>Place Order</Text></>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: wp(5), paddingBottom: hp(5) },
  header: { fontSize: fs(22), fontWeight: '800', color: '#1A1A2E', marginBottom: hp(2.5) },
  sectionTitle: { fontSize: fs(16), fontWeight: '700', color: '#1A1A2E', marginBottom: hp(1.5), marginTop: hp(1) },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
    marginBottom: hp(0.8),
  },
  customerName: { fontSize: fs(15), fontWeight: '700', color: '#1A1A2E' },
  customerPhone: { fontSize: fs(13), color: '#666' },
  card: {
    backgroundColor: '#fff', borderRadius: sw(16), padding: sw(18), marginBottom: hp(2.5),
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: sw(10), shadowOffset: { width: 0, height: sw(4) }, elevation: 2,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1.5) },
  itemName: { flex: 1, fontSize: fs(13), marginRight: sw(10), color: '#333' },
  itemPrice: { fontSize: fs(13), fontWeight: '600', color: '#333' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: hp(2) },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(0.5) },
  totalLabel: { fontSize: fs(14), fontWeight: '600', color: '#1A1A2E' },
  subtotalValue: { fontSize: fs(14), fontWeight: '600', color: '#666' },
  totalValue: { fontSize: fs(20), fontWeight: '900', color: ACCENT },

  // Coupon
  couponInputRow: { flexDirection: 'row', alignItems: 'center', gap: sw(10) },
  couponInput: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: sw(12),
    paddingHorizontal: sw(14), paddingVertical: sw(10),
    fontSize: fs(14), fontWeight: '600', color: '#333', letterSpacing: 1,
  },
  applyButton: {
    backgroundColor: ACCENT, paddingHorizontal: sw(18), paddingVertical: sw(10),
    borderRadius: sw(12),
  },
  applyText: { color: '#fff', fontSize: fs(13), fontWeight: '700' },
  appliedRow: {
    flexDirection: 'row', alignItems: 'center', gap: sw(8),
    marginTop: hp(1.2), backgroundColor: '#F0FDF4',
    paddingHorizontal: sw(12), paddingVertical: sw(8), borderRadius: sw(10),
  },
  appliedText: { flex: 1, fontSize: fs(13), fontWeight: '600', color: '#10B981' },
  myCouponsContainer: { marginTop: hp(1.5) },
  myCouponsLabel: { fontSize: fs(11), color: '#999', marginBottom: hp(0.8) },
  myCouponChip: {
    flexDirection: 'row', alignItems: 'center', gap: sw(6),
    backgroundColor: '#FFF5F5', borderRadius: sw(8),
    paddingHorizontal: sw(12), paddingVertical: sw(7), marginBottom: sw(6),
    borderWidth: 1, borderColor: '#FFEBEE',
  },
  myCouponText: { fontSize: fs(12), fontWeight: '600', color: ACCENT },
  placeOrderBtn: {
    flexDirection: 'row', backgroundColor: ACCENT, paddingVertical: hp(2), borderRadius: sw(16),
    alignItems: 'center', justifyContent: 'center', gap: sw(8), marginTop: hp(1),
    shadowColor: ACCENT, shadowOpacity: 0.3, shadowRadius: sw(8), shadowOffset: { width: 0, height: sw(4) }, elevation: 6,
  },
  placeOrderText: { color: '#fff', fontSize: fs(16), fontWeight: '800' },
  emptyIcon: { width: sw(72), height: sw(72), borderRadius: sw(36), backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: hp(2) },
  emptyText: { fontSize: fs(15), color: '#999', marginBottom: hp(2.5) },
  shopButton: { backgroundColor: ACCENT, paddingHorizontal: sw(28), paddingVertical: sw(13), borderRadius: sw(14) },
  shopButtonText: { color: '#fff', fontSize: fs(14), fontWeight: '700' },
  locationButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp(2),
    borderRadius: sw(12), borderWidth: 1.5, borderColor: ACCENT, borderStyle: 'dashed',
  },
  locationButtonText: { color: ACCENT, fontSize: fs(14), fontWeight: '600', marginLeft: sw(8) },
  map: { width: '100%', height: hp(24), borderRadius: sw(12), marginBottom: hp(1.5) },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: hp(1) },
  addressText: { fontSize: fs(13), marginLeft: sw(6), flex: 1, lineHeight: fs(20), color: '#333' },
  changeLocationBtn: { alignItems: 'center', paddingVertical: hp(1) },
  changeLocationText: { color: ACCENT, fontSize: fs(12), fontWeight: '500' },
  mapHint: { fontSize: fs(11), textAlign: 'center', marginTop: hp(0.5), color: '#999' },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: hp(1.5),
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  paymentOptionSelected: { borderBottomColor: 'transparent' },
  paymentIconContainer: { width: sw(40), height: sw(40), borderRadius: sw(10), backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: sw(12) },
  paymentLabel: { flex: 1, fontSize: fs(14), color: '#333', fontWeight: '500' },
  paymentLabelSelected: { color: ACCENT, fontWeight: '700' },
});

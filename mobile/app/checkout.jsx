import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Linking } from 'react-native';
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
import { triggerHaptic } from '../utils/haptics';
import { sendLocalNotification } from '../utils/notifications';
import Constants from 'expo-constants';

const checkMapApiKey = () => {
  if (Platform.OS === 'ios') return true;
  const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  return !!(apiKey && apiKey !== 'YOUR_ANDROID_GOOGLE_MAPS_API_KEY' && !apiKey.startsWith('YOUR_'));
};

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
      triggerHaptic('success');
      showToast(`${result.percent}% off applied! -₱${result.discount.toFixed(2)}`);
    } catch (e) {
      triggerHaptic('warning');
      showToast(e.message || 'Invalid coupon', 'error');
      setAppliedCoupon(null);
    } finally { setCouponLoading(false); }
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { triggerHaptic('warning'); showToast('Location permission needed', 'error'); setLocationLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setDeliveryLocation(coords);
      triggerHaptic('success');
      try {
        const [place] = await Location.reverseGeocodeAsync(coords);
        if (place) { setAddress([place.street, place.district, place.city, place.region, place.country].filter(Boolean).join(', ')); }
      } catch { setAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`); }
    } catch (err) { triggerHaptic('error'); showToast('Failed to get location', 'error'); }
    finally { setLocationLoading(false); }
  };

  const handleMapPress = async (e) => {
    const coords = e.nativeEvent.coordinate;
    setDeliveryLocation(coords);
    triggerHaptic('selection');
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

  // Mock Gateways States
  const [activePaymentModal, setActivePaymentModal] = useState(null); // 'GCash' | 'PayMaya' | 'Credit/Debit Card' | null
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // GCash
  const [gcashPhone, setGcashPhone] = useState('');
  const [gcashMpin, setGcashMpin] = useState('');
  const [gcashStep, setGcashStep] = useState(1); // 1: Phone, 2: MPIN

  // PayMaya
  const [mayaPhone, setMayaPhone] = useState('');
  const [mayaPassword, setMayaPassword] = useState('');

  // Credit Card
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatCardExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const simulatePayment = async (onSuccess) => {
    setPaymentProcessing(true);
    triggerHaptic('selection');
    // Simulate payment transaction network gateway latency
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPaymentProcessing(false);
    onSuccess();
  };

  const handleGCashPay = () => {
    if (!gcashPhone.trim() || gcashPhone.length < 10) {
      triggerHaptic('warning');
      showToast('Please enter your 10-digit GCash mobile number', 'error');
      return;
    }
    if (gcashStep === 1) {
      setGcashStep(2);
      triggerHaptic('selection');
      return;
    }
    if (!gcashMpin.trim() || gcashMpin.length < 4) {
      triggerHaptic('warning');
      showToast('Please enter your 4-digit MPIN', 'error');
      return;
    }

    simulatePayment(() => {
      handlePlaceOrder();
    });
  };

  const handlePayMayaPay = () => {
    if (!mayaPhone.trim() || mayaPhone.length < 10) {
      triggerHaptic('warning');
      showToast('Please enter your PayMaya mobile number', 'error');
      return;
    }
    if (!mayaPassword.trim()) {
      triggerHaptic('warning');
      showToast('Please enter your password', 'error');
      return;
    }

    simulatePayment(() => {
      handlePlaceOrder();
    });
  };

  const handleCardPay = () => {
    if (!cardName.trim()) {
      triggerHaptic('warning');
      showToast('Please enter the cardholder name', 'error');
      return;
    }
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 16) {
      triggerHaptic('warning');
      showToast('Please enter your 16-digit card number', 'error');
      return;
    }
    if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
      triggerHaptic('warning');
      showToast('Please enter expiry MM/YY', 'error');
      return;
    }
    if (!cardCvv.trim() || cardCvv.length < 3) {
      triggerHaptic('warning');
      showToast('Please enter your CVV code', 'error');
      return;
    }

    simulatePayment(() => {
      handlePlaceOrder();
    });
  };

  const handleProceed = () => {
    if (!user) { triggerHaptic('warning'); showToast('Please log in', 'error'); router.push('/(auth)/login'); return; }
    if (!deliveryLocation) { triggerHaptic('warning'); showToast('Please set delivery location', 'error'); return; }
    
    if (paymentMethod === 'Cash on Delivery') {
      handlePlaceOrder();
    } else {
      setGcashStep(1);
      setGcashPhone('');
      setGcashMpin('');
      setMayaPhone('');
      setMayaPassword('');
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setActivePaymentModal(paymentMethod);
      triggerHaptic('selection');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) { triggerHaptic('warning'); showToast('Please log in', 'error'); router.push('/(auth)/login'); return; }
    if (!deliveryLocation) { triggerHaptic('warning'); showToast('Please set delivery location', 'error'); return; }
    setLoading(true);
    try {
      const items = cartItems.map(item => ({ id: item.id, quantity: item.quantity, price: item.price }));
      await createOrder(items, finalTotal, { latitude: deliveryLocation.latitude, longitude: deliveryLocation.longitude, address }, paymentMethod);
      if (appliedCoupon) await markCouponUsed(appliedCoupon.couponId);
      clearCart();
      triggerHaptic('success');
      showToast('Order placed successfully!', 'success');
      sendLocalNotification(
        'Order Confirmed! 🛒📦',
        `Thank you for shopping at SwiftCart! Your order for ₱${finalTotal.toFixed(2)} has been placed via ${paymentMethod} and is being prepared for delivery.`
      );
      
      // Close active payment portal
      setActivePaymentModal(null);
      
      router.replace('/orders');
    } catch (e) { triggerHaptic('error'); showToast(e.message || 'Failed to place order', 'error'); }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
              <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>₱{total.toFixed(2)}</Text>
          </View>
          {appliedCoupon && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#10B981' }]}>Discount ({appliedCoupon.percent}%)</Text>
              <Text style={[styles.totalLabel, { color: '#10B981', fontWeight: '700' }]}>-₱{discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{finalTotal.toFixed(2)}</Text>
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
              onPress={() => { triggerHaptic('selection'); setPaymentMethod(method.id); }}
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
              {checkMapApiKey() ? (
                <MapView style={styles.map} initialRegion={{ ...deliveryLocation, latitudeDelta: 0.005, longitudeDelta: 0.005 }} onPress={handleMapPress}>
                  <Marker coordinate={deliveryLocation} title="Delivery Location" description={address} pinColor={ACCENT} />
                </MapView>
              ) : (
                <View style={[styles.map, styles.mapFallbackContainer]}>
                  <Ionicons name="map-outline" size={ms(36)} color="#999" style={{ marginBottom: hp(0.5) }} />
                  <Text style={styles.mapFallbackText}>Interactive Map Unavailable</Text>
                  <Text style={styles.mapFallbackDesc}>
                    Google Maps API Key not set. You can manually enter your address details below.
                  </Text>
                  <TouchableOpacity
                    style={styles.mapFallbackButton}
                    onPress={() => {
                      triggerHaptic('light');
                      const lat = deliveryLocation.latitude;
                      const lng = deliveryLocation.longitude;
                      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                      const latLng = `${lat},${lng}`;
                      const url = Platform.select({
                        ios: `${scheme}Delivery@${latLng}`,
                        android: `${scheme}${latLng}(Delivery)`
                      });
                      Linking.openURL(url);
                    }}
                  >
                    <Ionicons name="open-outline" size={ms(14)} color="#fff" />
                    <Text style={styles.mapFallbackButtonText}>Check coordinates in Map App</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.addressInputContainer}>
                <Ionicons name="location" size={ms(16)} color={ACCENT} style={{ marginTop: hp(1.2) }} />
                <TextInput
                  style={styles.addressTextInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter detailed delivery address"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={2}
                />
              </View>
              <TouchableOpacity style={styles.changeLocationBtn} onPress={getLocation}>
                <Text style={styles.changeLocationText}>📍 Re-detect my location</Text>
              </TouchableOpacity>
              {checkMapApiKey() && <Text style={styles.mapHint}>Tap the map to adjust your delivery pin</Text>}
            </>
          )}
        </View>

        <TouchableOpacity style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]} onPress={handleProceed} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="checkmark-circle" size={ms(18)} color="#fff" /><Text style={styles.placeOrderText}>Place Order</Text></>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* GCash Payment Portal Modal */}
      <Modal
        visible={activePaymentModal === 'GCash'}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setActivePaymentModal(null)}
      >
        <SafeAreaView style={styles.gcashContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.gcashHeader}>
              <TouchableOpacity onPress={() => setActivePaymentModal(null)}>
                <Ionicons name="arrow-back" size={ms(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.gcashHeaderTitle}>GCash Portal</Text>
              <View style={{ width: 22 }} />
            </View>

            {paymentProcessing ? (
              <View style={styles.paymentProcessingContainer}>
                <ActivityIndicator size="large" color="#005BEA" />
                <Text style={styles.processingTitle}>Authorizing Transaction...</Text>
                <Text style={styles.processingSubtitle}>Please do not close this window.</Text>
              </View>
            ) : (
              <View style={styles.gcashBody}>
                <View style={styles.gcashMerchantCard}>
                  <Text style={styles.gcashMerchantLabel}>Merchant</Text>
                  <Text style={styles.gcashMerchantName}>SwiftCart Inc.</Text>
                  <View style={styles.gcashAmountDivider} />
                  <Text style={styles.gcashAmountLabel}>Amount Due</Text>
                  <Text style={styles.gcashAmountValue}>₱{finalTotal.toFixed(2)}</Text>
                </View>

                {gcashStep === 1 ? (
                  <View style={styles.gcashFormCard}>
                    <Text style={styles.gcashFormTitle}>Pay with GCash</Text>
                    <Text style={styles.gcashFormSubtitle}>Enter your GCash mobile number to proceed</Text>
                    
                    <View style={styles.gcashInputRow}>
                      <Text style={styles.gcashInputPrefix}>+63</Text>
                      <TextInput
                        style={styles.gcashPhoneInput}
                        placeholder="9XXXXXXXXX"
                        placeholderTextColor="#bbb"
                        keyboardType="numeric"
                        maxLength={10}
                        value={gcashPhone}
                        onChangeText={setGcashPhone}
                      />
                    </View>

                    <TouchableOpacity style={styles.gcashNextBtn} onPress={handleGCashPay}>
                      <Text style={styles.gcashBtnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.gcashFormCard}>
                    <Text style={styles.gcashFormTitle}>Enter 4-Digit MPIN</Text>
                    <Text style={styles.gcashFormSubtitle}>Verify your identity to authorize payment</Text>
                    
                    <TextInput
                      style={styles.gcashMpinInput}
                      placeholder="••••"
                      placeholderTextColor="#bbb"
                      keyboardType="numeric"
                      secureTextEntry={true}
                      maxLength={4}
                      value={gcashMpin}
                      onChangeText={setGcashMpin}
                      textAlign="center"
                    />

                    <TouchableOpacity style={[styles.gcashNextBtn, { backgroundColor: '#005BEA' }]} onPress={handleGCashPay}>
                      <Text style={styles.gcashBtnText}>Confirm & Pay ₱{(finalTotal * 56).toFixed(2)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gcashBackStepBtn} onPress={() => setGcashStep(1)}>
                      <Text style={styles.gcashBackStepText}>Change Number</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* PayMaya Payment Portal Modal */}
      <Modal
        visible={activePaymentModal === 'PayMaya'}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setActivePaymentModal(null)}
      >
        <SafeAreaView style={styles.mayaContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.mayaHeader}>
              <TouchableOpacity onPress={() => setActivePaymentModal(null)}>
                <Ionicons name="arrow-back" size={ms(22)} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.mayaHeaderTitle}>PayMaya Portal</Text>
              <View style={{ width: 22 }} />
            </View>

            {paymentProcessing ? (
              <View style={styles.paymentProcessingContainer}>
                <ActivityIndicator size="large" color="#00c300" />
                <Text style={styles.processingTitle}>Verifying Secure Token...</Text>
                <Text style={styles.processingSubtitle}>Processing your payment gateway request.</Text>
              </View>
            ) : (
              <View style={styles.mayaBody}>
                <View style={styles.mayaMerchantCard}>
                  <Text style={styles.mayaMerchantLabel}>Merchant</Text>
                  <Text style={styles.mayaMerchantName}>SwiftCart Inc.</Text>
                  <View style={styles.mayaAmountDivider} />
                  <Text style={styles.mayaAmountLabel}>Total Payment</Text>
                  <Text style={styles.mayaAmountValue}>₱{finalTotal.toFixed(2)}</Text>
                </View>

                <View style={styles.mayaFormCard}>
                  <Text style={styles.mayaFormTitle}>Log in to PayMaya</Text>
                  <Text style={styles.mayaFormSubtitle}>Enter your registered mobile number</Text>

                  <TextInput
                    style={styles.mayaInput}
                    placeholder="Mobile number"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={11}
                    value={mayaPhone}
                    onChangeText={setMayaPhone}
                  />

                  <TextInput
                    style={styles.mayaInput}
                    placeholder="Password"
                    placeholderTextColor="#bbb"
                    secureTextEntry={true}
                    value={mayaPassword}
                    onChangeText={setMayaPassword}
                  />

                  <TouchableOpacity style={styles.mayaPayBtn} onPress={handlePayMayaPay}>
                    <Text style={styles.mayaBtnText}>Pay Securely</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Credit/Debit Card Payment Modal */}
      <Modal
        visible={activePaymentModal === 'Credit/Debit Card'}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setActivePaymentModal(null)}
      >
        <SafeAreaView style={styles.cardContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.cardHeader}>
              <TouchableOpacity onPress={() => setActivePaymentModal(null)}>
                <Ionicons name="close" size={ms(24)} color="#1A1A2E" />
              </TouchableOpacity>
              <Text style={styles.cardHeaderTitle}>Credit/Debit Card</Text>
              <View style={{ width: 24 }} />
            </View>

            {paymentProcessing ? (
              <View style={styles.paymentProcessingContainer}>
                <ActivityIndicator size="large" color={ACCENT} />
                <Text style={styles.processingTitle}>Authorizing Charge...</Text>
                <Text style={styles.processingSubtitle}>Contacting card issuer network.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.cardScroll} showsVerticalScrollIndicator={false}>
                {/* Dynamic Credit Card Template Preview */}
                <View style={styles.cardTemplate}>
                  <Ionicons name="card" size={ms(40)} color="#fff" style={styles.cardTemplateIcon} />
                  <Text style={styles.cardTemplateNumber}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </Text>
                  <View style={styles.cardTemplateRow}>
                    <View>
                      <Text style={styles.cardTemplateLabel}>CARDHOLDER</Text>
                      <Text style={styles.cardTemplateName}>
                        {cardName.toUpperCase() || 'YOUR NAME'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cardTemplateLabel}>EXPIRES</Text>
                      <Text style={styles.cardTemplateExpiry}>
                        {cardExpiry || 'MM/YY'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardForm}>
                  <Text style={styles.cardFormTitle}>Payment Information</Text>

                  <Text style={styles.cardFormLabel}>Cardholder Name</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="John Doe"
                    placeholderTextColor="#bbb"
                    value={cardName}
                    onChangeText={setCardName}
                    autoCapitalize="words"
                  />

                  <Text style={styles.cardFormLabel}>Card Number</Text>
                  <TextInput
                    style={styles.cardFormInput}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                  />

                  <View style={styles.cardFormRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardFormLabel}>Expiry Date</Text>
                      <TextInput
                        style={styles.cardFormInput}
                        placeholder="MM/YY"
                        placeholderTextColor="#bbb"
                        keyboardType="numeric"
                        maxLength={5}
                        value={cardExpiry}
                        onChangeText={(t) => setCardExpiry(formatCardExpiry(t))}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: sw(12) }}>
                      <Text style={styles.cardFormLabel}>CVV</Text>
                      <TextInput
                        style={styles.cardFormInput}
                        placeholder="123"
                        placeholderTextColor="#bbb"
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry={true}
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.cardSubmitBtn} onPress={handleCardPay}>
                    <Text style={styles.cardSubmitText}>Pay ₱{finalTotal.toFixed(2)}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1),
    backgroundColor: '#F5F5F5',
    borderRadius: sw(12),
    paddingHorizontal: sw(12),
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  addressTextInput: {
    flex: 1,
    fontSize: fs(13),
    marginLeft: sw(6),
    color: '#333',
    minHeight: hp(6),
    textAlignVertical: 'top',
    paddingVertical: hp(0.8),
  },
  mapFallbackContainer: {
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sw(15),
  },
  mapFallbackText: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#333',
  },
  mapFallbackDesc: {
    fontSize: fs(10),
    color: '#888',
    textAlign: 'center',
    marginTop: hp(0.5),
    marginBottom: hp(1.5),
    paddingHorizontal: sw(15),
  },
  mapFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(5),
    backgroundColor: ACCENT,
    paddingHorizontal: sw(12),
    paddingVertical: sw(6),
    borderRadius: sw(8),
  },
  mapFallbackButtonText: {
    color: '#fff',
    fontSize: fs(11),
    fontWeight: '700',
  },
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

  // GCash Portal Modal Styles
  gcashContainer: { flex: 1, backgroundColor: '#005BEA' },
  gcashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  gcashHeaderTitle: { color: '#fff', fontSize: fs(18), fontWeight: '800' },
  gcashBody: { flex: 1, padding: wp(5), backgroundColor: '#F4F6F9', justifyContent: 'center' },
  gcashMerchantCard: {
    backgroundColor: '#fff',
    borderRadius: sw(16),
    padding: sw(20),
    alignItems: 'center',
    marginBottom: hp(2.5),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: sw(10),
    elevation: 2,
  },
  gcashMerchantLabel: { fontSize: fs(11), color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  gcashMerchantName: { fontSize: fs(20), fontWeight: '900', color: '#1A1A2E', marginTop: hp(0.5) },
  gcashAmountDivider: { height: 1, backgroundColor: '#EEE', width: '100%', marginVertical: hp(1.5) },
  gcashAmountLabel: { fontSize: fs(11), color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  gcashAmountValue: { fontSize: fs(26), fontWeight: '900', color: '#005BEA', marginTop: hp(0.5) },
  gcashAmountUSD: { fontSize: fs(12), color: '#666', marginTop: hp(0.2) },
  gcashFormCard: {
    backgroundColor: '#fff',
    borderRadius: sw(16),
    padding: sw(20),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: sw(10),
    elevation: 2,
  },
  gcashFormTitle: { fontSize: fs(16), fontWeight: '800', color: '#1A1A2E' },
  gcashFormSubtitle: { fontSize: fs(12), color: '#666', marginTop: hp(0.5), marginBottom: hp(2) },
  gcashInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: sw(12),
    paddingHorizontal: sw(14),
    paddingVertical: sw(12),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  gcashInputPrefix: { fontSize: fs(15), fontWeight: '700', color: '#333', marginRight: sw(8) },
  gcashPhoneInput: { flex: 1, fontSize: fs(15), fontWeight: '600', color: '#333' },
  gcashNextBtn: {
    backgroundColor: '#005BEA',
    borderRadius: sw(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2.5),
  },
  gcashBtnText: { color: '#fff', fontSize: fs(14), fontWeight: '800' },
  gcashMpinInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: sw(12),
    paddingVertical: sw(12),
    fontSize: fs(24),
    fontWeight: '800',
    color: '#333',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  gcashBackStepBtn: { alignItems: 'center', marginTop: hp(1.8) },
  gcashBackStepText: { color: '#005BEA', fontSize: fs(13), fontWeight: '600' },

  // PayMaya Styles
  mayaContainer: { flex: 1, backgroundColor: '#0D0E15' },
  mayaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  mayaHeaderTitle: { color: '#fff', fontSize: fs(18), fontWeight: '800' },
  mayaBody: { flex: 1, padding: wp(5), backgroundColor: '#181924', justifyContent: 'center' },
  mayaMerchantCard: {
    backgroundColor: '#1E2030',
    borderRadius: sw(16),
    padding: sw(20),
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  mayaMerchantLabel: { fontSize: fs(11), color: '#8F94B5', textTransform: 'uppercase' },
  mayaMerchantName: { fontSize: fs(20), fontWeight: '900', color: '#fff', marginTop: hp(0.5) },
  mayaAmountDivider: { height: 1, backgroundColor: '#2E314C', width: '100%', marginVertical: hp(1.5) },
  mayaAmountLabel: { fontSize: fs(11), color: '#8F94B5', textTransform: 'uppercase' },
  mayaAmountValue: { fontSize: fs(26), fontWeight: '900', color: '#00c300', marginTop: hp(0.5) },
  mayaAmountUSD: { fontSize: fs(12), color: '#8F94B5', marginTop: hp(0.2) },
  mayaFormCard: {
    backgroundColor: '#1E2030',
    borderRadius: sw(16),
    padding: sw(20),
  },
  mayaFormTitle: { fontSize: fs(16), fontWeight: '800', color: '#fff' },
  mayaFormSubtitle: { fontSize: fs(12), color: '#8F94B5', marginTop: hp(0.5), marginBottom: hp(2) },
  mayaInput: {
    backgroundColor: '#141521',
    borderRadius: sw(12),
    paddingHorizontal: sw(14),
    paddingVertical: sw(12),
    color: '#fff',
    fontSize: fs(14),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#2E314C',
  },
  mayaPayBtn: {
    backgroundColor: '#00c300',
    borderRadius: sw(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  mayaBtnText: { color: '#fff', fontSize: fs(14), fontWeight: '800' },

  // Credit Card Styles
  cardContainer: { flex: 1, backgroundColor: '#FAFAFA' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  cardHeaderTitle: { fontSize: fs(18), fontWeight: '800', color: '#1A1A2E' },
  cardScroll: { padding: wp(5), alignItems: 'center' },
  cardTemplate: {
    width: '100%',
    height: hp(23),
    borderRadius: sw(20),
    backgroundColor: '#2b2b2b',
    padding: sw(22),
    justifyContent: 'space-between',
    marginBottom: hp(3),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: sw(12),
    elevation: 5,
  },
  cardTemplateIcon: { alignSelf: 'flex-end' },
  cardTemplateNumber: { color: '#fff', fontSize: fs(19), fontWeight: '700', letterSpacing: 2 },
  cardTemplateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardTemplateLabel: { color: '#888', fontSize: fs(9), fontWeight: '600', marginBottom: hp(0.3) },
  cardTemplateName: { color: '#fff', fontSize: fs(13), fontWeight: '700' },
  cardTemplateExpiry: { color: '#fff', fontSize: fs(13), fontWeight: '700' },
  cardForm: { width: '100%', backgroundColor: '#fff', borderRadius: sw(16), padding: sw(20), borderWidth: 1, borderColor: '#F0F0F0' },
  cardFormTitle: { fontSize: fs(16), fontWeight: '800', color: '#1A1A2E', marginBottom: hp(2) },
  cardFormLabel: { fontSize: fs(11), fontWeight: '700', color: '#666', marginBottom: hp(0.6), textTransform: 'uppercase', letterSpacing: 0.5 },
  cardFormInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: sw(12),
    paddingHorizontal: sw(14),
    paddingVertical: sw(10),
    fontSize: fs(14),
    color: '#333',
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  cardFormRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardSubmitBtn: {
    backgroundColor: ACCENT,
    borderRadius: sw(12),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  cardSubmitText: { color: '#fff', fontSize: fs(14), fontWeight: '800' },

  // Simulated Processing
  paymentProcessingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: wp(10) },
  processingTitle: { fontSize: fs(18), fontWeight: '800', color: '#1A1A2E', marginTop: hp(2.5) },
  processingSubtitle: { fontSize: fs(13), color: '#999', marginTop: hp(0.8), textAlign: 'center' },
});

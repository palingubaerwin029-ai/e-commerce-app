import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createOrder } from '../services/api';
import Button from '../components/ui/Button';
import { useThemeColor } from '../hooks/use-theme-color';

export default function CheckoutScreen() {
  const { cartItems, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');

  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      showToast('Please log in to place an order', 'error');
      router.push('/(auth)/login');
      return;
    }
    
    setLoading(true);
    try {
      const items = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      await createOrder(items, total);
      clearCart();
      showToast('Order placed successfully!', 'success');
      router.replace('/orders');
    } catch (e) {
      showToast(e.message || 'Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.emptyText, { color: textColor }]}>Your cart is empty.</Text>
        <Button title="Go Shopping" onPress={() => router.replace('/(tabs)')} style={styles.btn} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.header, { color: textColor }]}>Order Summary</Text>
        
        <View style={[styles.card, { backgroundColor: cardColor || (backgroundColor === '#000' ? '#1c1c1e' : '#fff') }]}>
          {cartItems.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                {item.quantity}x {item.title}
              </Text>
              <Text style={[styles.itemPrice, { color: textColor }]}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: textColor }]}>Total</Text>
            <Text style={[styles.totalValue, { color: textColor }]}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <Button 
          title="Place Order" 
          onPress={handlePlaceOrder} 
          loading={loading}
          style={styles.placeOrderBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: { flex: 1, fontSize: 16, marginRight: 10 },
  itemPrice: { fontSize: 16, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#4a90e2' },
  placeOrderBtn: { marginTop: 10 },
  emptyText: { fontSize: 18, marginBottom: 20 },
  btn: { width: 200 }
});

import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import * as Location from 'expo-location';
import { router } from 'expo-router';

import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function CartScreen() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { showToast } = useToast();
  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = `${geocode[0].street || ''} ${geocode[0].city || ''}, ${geocode[0].region || ''}`;
        setDeliveryAddress(address.trim());
        showToast('Delivery address updated!');
      }
    } catch (error) {
      console.error(error);
      showToast('Could not fetch location');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Your Cart</ThemedText>
      {cartItems.length === 0 ? (
        <ThemedText style={styles.emptyText}>Your cart is empty</ThemedText>
      ) : (
        <>
          <ThemedView style={styles.locationContainer}>
            {locationLoading ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : deliveryAddress ? (
              <ThemedText style={styles.locationText}>📍 {deliveryAddress}</ThemedText>
            ) : (
              <TouchableOpacity onPress={fetchLocation} style={styles.locationBtn}>
                <ThemedText style={styles.locationLink}>📍 Set Delivery Location</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>

          <FlatList
            contentContainerStyle={styles.listContent}
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ThemedView style={styles.itemCard}>
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
                <ThemedView style={styles.itemInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.title}</ThemedText>
                  <ThemedText style={styles.price}>${parseFloat(item.price).toFixed(2)}</ThemedText>
                  <ThemedText>Qty: {item.quantity}</ThemedText>
                </ThemedView>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
                  <ThemedText style={styles.removeText}>Remove</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          />
          <ThemedView style={styles.bottomBar}>
            <ThemedView style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalPrice}>${total.toFixed(2)}</ThemedText>
            </ThemedView>
            <TouchableOpacity style={styles.checkoutButtonContainer} onPress={() => router.push('/checkout')}>
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.checkoutButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ThemedText style={styles.checkoutText}>Proceed to Checkout</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#F8FAFC',
  },
  header: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  image: {
    height: 80,
    width: 80,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  itemInfo: {
    flex: 1,
  },
  price: {
    fontWeight: '800',
    color: '#4F46E5',
    fontSize: 18,
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  removeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  locationContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
  },
  locationBtn: {
    alignItems: 'flex-start',
  },
  locationLink: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 15,
  },
  locationText: {
    color: '#3730A3',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  checkoutButtonContainer: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  checkoutButton: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
});

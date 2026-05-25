import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Linking,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
import { useToast } from '../context/ToastContext';
import { triggerHaptic } from '../utils/haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchOrderById } from '../services/api';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../constants/theme';
import { wp, hp, ms, fs, sw } from '../utils/responsive';
import Constants from 'expo-constants';
import LeafletMap from '../components/LeafletMap';

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: 'receipt-outline', desc: 'Your order has been received' },
  { key: 'processing', label: 'Processing', icon: 'cog-outline', desc: 'Your order is being prepared' },
  { key: 'shipped', label: 'Shipped', icon: 'airplane-outline', desc: 'Your order is on the way' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline', desc: 'Your order has been delivered' },
];

const STATUS_COLORS = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

const checkMapApiKey = () => {
  if (Platform.OS === 'ios') return true;
  const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  return !!(apiKey && apiKey !== 'YOUR_ANDROID_GOOGLE_MAPS_API_KEY' && !apiKey.startsWith('YOUR_'));
};

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courierCoords, setCourierCoords] = useState(null);

  const orderRef = React.useRef(order);
  
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  useEffect(() => {
    loadOrder();

    const interval = setInterval(() => {
      const currentOrder = orderRef.current;
      if (currentOrder && ['delivered', 'cancelled'].includes(currentOrder.status)) {
        clearInterval(interval);
        return;
      }
      loadOrder(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!order) return;
    const destLat = parseFloat(order.delivery_lat || 14.5916);
    const destLng = parseFloat(order.delivery_lng || 120.9734);

    // Initial courier offset slightly northeast
    let curLat = destLat + 0.0035;
    let curLng = destLng + 0.0035;
    setCourierCoords({ latitude: curLat, longitude: curLng });

    if (['processing', 'shipped'].includes(order.status)) {
      const interval = setInterval(() => {
        setCourierCoords(prev => {
          if (!prev) return prev;
          const diffLat = destLat - prev.latitude;
          const diffLng = destLng - prev.longitude;

          // Interpolate 15% closer to destination
          const newLat = prev.latitude + diffLat * 0.15;
          const newLng = prev.longitude + diffLng * 0.15;

          // If extremely close, simulate fine hover adjustments
          if (Math.abs(diffLat) < 0.0001 && Math.abs(diffLng) < 0.0001) {
            return {
              latitude: destLat + (Math.random() - 0.5) * 0.0002,
              longitude: destLng + (Math.random() - 0.5) * 0.0002
            };
          }
          return { latitude: newLat, longitude: newLng };
        });
      }, 3500);

      return () => clearInterval(interval);
    } else if (order.status === 'delivered') {
      setCourierCoords({ latitude: destLat, longitude: destLng });
    }
  }, [order]);

  const loadOrder = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchOrderById(id, true);
      const currentOrder = orderRef.current;
      if (currentOrder && currentOrder.status !== data.status) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        triggerHaptic('success');
        showToast(`Order status updated to ${data.status.toUpperCase()}!`, 'success');
      }
      setOrder(data);
    } catch (e) {
      console.error('Load order error:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === 'cancelled') return -1;
    const idx = STEPS.findIndex((s) => s.key === order.status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="alert-circle-outline" size={ms(48)} color="#ddd" />
        </View>
        <Text style={styles.emptyTitle}>Order not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentStep = getCurrentStepIndex();
  const isCancelled = order.status === 'cancelled';
  const deliveryLat = parseFloat(order.delivery_lat || 14.5916);
  const deliveryLng = parseFloat(order.delivery_lng || 120.9734);
  const hasLocation = true; // Always display map for premium tracking experience!
  const statusColor = STATUS_COLORS[order.status] || '#888';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={ms(20)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: sw(38) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Header Card */}
        <View style={styles.card}>
          <View style={styles.orderHeaderRow}>
            <View>
              <Text style={styles.orderId}>Order #{order.id}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Ionicons name={isCancelled ? 'close-circle' : 'ellipse'} size={ms(8)} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tracking Timeline */}
        <Text style={styles.sectionTitle}>Tracking Status</Text>
        <View style={styles.card}>
          {isCancelled ? (
            <View style={styles.cancelledContainer}>
              <View style={styles.cancelledIcon}>
                <Ionicons name="close-circle" size={ms(40)} color="#EF4444" />
              </View>
              <Text style={styles.cancelledText}>Order Cancelled</Text>
              <Text style={styles.cancelledDesc}>This order has been cancelled</Text>
            </View>
          ) : (
            STEPS.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const isLast = index === STEPS.length - 1;
              const dotColor = isCompleted ? STATUS_COLORS[step.key] : '#E5E7EB';

              return (
                <View key={step.key} style={styles.stepRow}>
                  {/* Vertical line + dot */}
                  <View style={styles.stepIndicatorColumn}>
                    <View
                      style={[
                        styles.stepDot,
                        { backgroundColor: dotColor },
                        isCurrent && styles.stepDotActive,
                      ]}
                    >
                      {isCompleted && (
                        <Ionicons
                          name={index < currentStep ? 'checkmark' : step.icon}
                          size={isCurrent ? ms(14) : ms(10)}
                          color="#fff"
                        />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepLine,
                          {
                            backgroundColor:
                              index < currentStep ? STATUS_COLORS[STEPS[index + 1].key] : '#F0F0F0',
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Step label */}
                  <View style={[styles.stepContent, !isLast && { paddingBottom: hp(2.5) }]}>
                    <Text
                      style={[
                        styles.stepLabel,
                        { color: isCompleted ? '#1A1A2E' : '#BDBDBD' },
                        isCurrent && styles.stepLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.stepDescription}>{step.desc}</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Delivery Map */}
        {hasLocation && (
          <>
            <Text style={styles.sectionTitle}>Delivery Location</Text>
            <View style={styles.mapCard}>
              {checkMapApiKey() ? (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: deliveryLat,
                    longitude: deliveryLng,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                  }}
                >
                  {/* Customer Location */}
                  <Marker
                    coordinate={{
                      latitude: deliveryLat,
                      longitude: deliveryLng,
                    }}
                    title="Delivery Location"
                    description={order.delivery_address || 'Home'}
                    pinColor="#10B981"
                  />

                  {/* Courier Location */}
                  {courierCoords && (
                    <Marker
                      coordinate={courierCoords}
                      title="SwiftRider (Courier)"
                      description="Kuya Brandon is delivering your package!"
                    >
                      <View style={styles.courierPin}>
                        <Ionicons name="bicycle" size={ms(16)} color="#fff" />
                      </View>
                    </Marker>
                  )}

                  {/* Route dashed Polyline */}
                  {courierCoords && (
                    <Polyline
                      coordinates={[
                        courierCoords,
                        { latitude: deliveryLat, longitude: deliveryLng }
                      ]}
                      strokeWidth={sw(3)}
                      strokeColor={ACCENT}
                      lineDashPattern={[5, 5]}
                    />
                  )}
                </MapView>
              ) : (
                <LeafletMap
                  latitude={deliveryLat}
                  longitude={deliveryLng}
                  markerTitle="Delivery Location"
                  markerDescription={order.delivery_address || 'Home'}
                  courierLatitude={courierCoords?.latitude}
                  courierLongitude={courierCoords?.longitude}
                  courierTitle="SwiftRider (Courier)"
                  style={styles.map}
                />
              )}
              <View style={styles.addressRow}>
                <View style={styles.addressIcon}>
                  <Ionicons name="location" size={ms(14)} color={ACCENT} />
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {order.delivery_address || 'Cabildo St, Intramuros, Manila'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Courier Info Card */}
        {['processing', 'shipped', 'delivered'].includes(order.status) && (
          <>
            <Text style={styles.sectionTitle}>Your SwiftRider</Text>
            <View style={styles.card}>
              <View style={styles.courierRow}>
                <View style={styles.courierAvatar}>
                  <Ionicons name="person" size={ms(20)} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courierName}>Kuya Brandon</Text>
                  <Text style={styles.courierVehicle}>Yamaha Aerox 155 • Plate: MV-9281</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={ms(10)} color="#FFC107" />
                    <Text style={styles.ratingText}>4.9 (248 deliveries)</Text>
                  </View>
                </View>
                <View style={styles.courierActions}>
                  <TouchableOpacity 
                    style={styles.courierActionBtn}
                    onPress={() => { triggerHaptic('light'); Linking.openURL('tel:+639123456789'); }}
                  >
                    <Ionicons name="call" size={ms(16)} color={ACCENT} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.courierActionBtn}
                    onPress={() => { triggerHaptic('light'); showToast('Chat option coming soon!'); }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={ms(16)} color={ACCENT} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Order Items */}
        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.card}>
          {order.items?.map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <View style={styles.itemQtyBadge}>
                <Text style={styles.itemQtyText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemPrice}>₱{parseFloat(item.price).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{parseFloat(order.total_amount).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(12),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1A1A2E',
  },

  scrollContent: {
    padding: wp(5),
    paddingBottom: hp(5),
  },

  // Empty / Error
  emptyIcon: {
    width: sw(90),
    height: sw(90),
    borderRadius: sw(45),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp(2),
  },
  retryButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: sw(28),
    paddingVertical: sw(12),
    borderRadius: sw(14),
  },
  retryText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },

  // Section
  sectionTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: hp(1.5),
    marginTop: hp(1),
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: sw(18),
    padding: sw(18),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: sw(12),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 2,
  },

  // Order Header
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1A1A2E',
  },
  orderDate: {
    fontSize: fs(12),
    color: '#999',
    marginTop: sw(3),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(10),
    paddingVertical: sw(5),
    borderRadius: sw(8),
    gap: sw(5),
  },
  statusText: {
    fontSize: fs(11),
    fontWeight: '700',
  },

  // Timeline
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: hp(3),
  },
  cancelledIcon: {
    width: sw(70),
    height: sw(70),
    borderRadius: sw(35),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  cancelledText: {
    color: '#EF4444',
    fontSize: fs(16),
    fontWeight: '800',
  },
  cancelledDesc: {
    color: '#999',
    fontSize: fs(13),
    marginTop: sw(4),
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    width: sw(32),
    marginRight: sw(14),
  },
  stepDot: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(17),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: sw(6),
    shadowOffset: { width: 0, height: sw(2) },
    elevation: 4,
  },
  stepLine: {
    width: sw(3),
    flex: 1,
    minHeight: hp(2.5),
    borderRadius: sw(2),
  },
  stepContent: {
    flex: 1,
    paddingTop: sw(4),
  },
  stepLabel: {
    fontSize: fs(14),
    fontWeight: '500',
  },
  stepLabelActive: {
    fontWeight: '800',
    fontSize: fs(15),
  },
  stepDescription: {
    fontSize: fs(12),
    color: '#999',
    marginTop: sw(3),
  },

  // Map
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: sw(18),
    overflow: 'hidden',
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: sw(12),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 2,
  },
  map: {
    width: '100%',
    height: hp(24),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sw(16),
  },
  addressIcon: {
    width: sw(30),
    height: sw(30),
    borderRadius: sw(10),
    backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sw(10),
  },
  addressText: {
    fontSize: fs(13),
    flex: 1,
    lineHeight: fs(20),
    color: '#333',
    fontWeight: '500',
  },

  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  itemQtyBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
    borderRadius: sw(6),
    marginRight: sw(10),
  },
  itemQtyText: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#666',
  },
  itemName: {
    flex: 1,
    marginRight: sw(10),
    fontSize: fs(13),
    color: '#333',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#1A1A2E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: hp(1.5),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#1A1A2E',
  },
  totalValue: {
    fontSize: fs(20),
    fontWeight: '900',
    color: ACCENT,
  },

  // Courier Pin Style
  courierPin: {
    backgroundColor: ACCENT,
    padding: sw(6),
    borderRadius: sw(20),
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: sw(4),
    elevation: 4,
  },

  // Courier Info Card Styles
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(12),
  },
  courierAvatar: {
    width: sw(44),
    height: sw(44),
    borderRadius: sw(22),
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courierName: {
    fontSize: fs(14),
    fontWeight: '800',
    color: '#1A1A2E',
  },
  courierVehicle: {
    fontSize: fs(11),
    color: '#666',
    marginTop: hp(0.2),
  },
  courierActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(8),
  },
  courierActionBtn: {
    width: sw(36),
    height: sw(36),
    borderRadius: sw(18),
    backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
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
});

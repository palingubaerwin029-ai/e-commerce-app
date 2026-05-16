import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { fetchOrders } from '../services/api';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../constants/theme';
import { wp, hp, ms, fs, sw } from '../utils/responsive';

const STATUS_COLORS = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

const STATUS_ICONS = {
  pending: 'time-outline',
  processing: 'cog-outline',
  shipped: 'airplane-outline',
  delivered: 'checkmark-circle-outline',
  cancelled: 'close-circle-outline',
};

export default function OrdersScreen() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={ms(20)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.orderCount}>
          <Text style={styles.orderCountText}>{orders.length}</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={ms(52)} color="#ddd" />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] || '#888';
          const statusIcon = STATUS_ICONS[item.status] || 'help-circle-outline';

          return (
            <View style={styles.card}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderId}>Order #{item.id}</Text>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <Ionicons name={statusIcon} size={ms(12)} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Order Items */}
              {item.items && item.items.map((orderItem, index) => (
                <View key={orderItem.id || index} style={styles.itemRow}>
                  <View style={styles.itemQtyBadge}>
                    <Text style={styles.itemQtyText}>{orderItem.quantity}x</Text>
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>{orderItem.title}</Text>
                  <Text style={styles.itemPrice}>${parseFloat(orderItem.price).toFixed(2)}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Footer */}
              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>${parseFloat(item.total_amount).toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => router.push({ pathname: '/track-order', params: { id: item.id } })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate-outline" size={ms(14)} color="#fff" />
                  <Text style={styles.trackButtonText}>Track</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
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
  orderCount: {
    backgroundColor: ACCENT,
    width: sw(30),
    height: sw(30),
    borderRadius: sw(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCountText: {
    color: '#fff',
    fontSize: fs(12),
    fontWeight: '800',
  },

  // List
  list: {
    padding: wp(5),
    paddingBottom: hp(5),
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: hp(12),
  },
  emptyIconWrap: {
    width: sw(100),
    height: sw(100),
    borderRadius: sw(50),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp(1),
  },
  emptySubtitle: {
    fontSize: fs(13),
    color: '#999',
    marginBottom: hp(3),
  },
  shopButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: sw(28),
    paddingVertical: sw(13),
    borderRadius: sw(14),
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowRadius: sw(8),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 4,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderHeaderLeft: {},
  orderId: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#1A1A2E',
  },
  date: {
    color: '#999',
    fontSize: fs(11),
    marginTop: sw(3),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sw(10),
    paddingVertical: sw(5),
    borderRadius: sw(8),
    gap: sw(4),
  },
  statusText: {
    fontSize: fs(11),
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: hp(1.5),
  },

  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
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

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fs(11),
    color: '#999',
    marginBottom: sw(2),
  },
  totalValue: {
    fontSize: fs(18),
    fontWeight: '900',
    color: ACCENT,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT,
    paddingHorizontal: sw(18),
    paddingVertical: sw(10),
    borderRadius: sw(12),
    gap: sw(6),
    shadowColor: ACCENT,
    shadowOpacity: 0.25,
    shadowRadius: sw(6),
    shadowOffset: { width: 0, height: sw(3) },
    elevation: 4,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: fs(13),
    fontWeight: '700',
  },
});

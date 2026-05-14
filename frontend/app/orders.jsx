import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { fetchOrders } from '../services/api';
import { useThemeColor } from '../hooks/use-theme-color';

export default function OrdersScreen() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const actualCardColor = cardColor || (backgroundColor === '#000' ? '#1c1c1e' : '#fff');

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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: textColor }]}>You have no past orders.</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: actualCardColor }]}>
            <View style={styles.orderHeader}>
              <Text style={[styles.orderId, { color: textColor }]}>Order #{item.id}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.divider} />
            {item.items.map(orderItem => (
              <View key={orderItem.id} style={styles.itemRow}>
                <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                  {orderItem.quantity}x {orderItem.title}
                </Text>
                <Text style={[styles.itemPrice, { color: textColor }]}>
                  ${orderItem.price}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: textColor }]}>Total</Text>
              <Text style={styles.totalValue}>${item.total_amount}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  date: { color: '#888' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { flex: 1, marginRight: 10, fontSize: 14 },
  itemPrice: { fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#4a90e2' },
});

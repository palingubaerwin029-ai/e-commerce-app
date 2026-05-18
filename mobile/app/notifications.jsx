import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../services/api';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../constants/theme';
import { wp, hp, ms, fs, sw } from '../utils/responsive';
import { triggerHaptic } from '../utils/haptics';
import { useToast } from '../context/ToastContext';

const TYPE_CONFIGS = {
  order_status: {
    bg: '#E8F5E9',
    iconColor: '#2E7D32',
    icon: 'cube-outline',
  },
  promotion: {
    bg: '#FFF3E0',
    iconColor: '#EF6C00',
    icon: 'gift-outline',
  },
  general: {
    bg: '#E8EAF6',
    iconColor: '#283593',
    icon: 'notifications-outline',
  },
};

export default function NotificationsScreen() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      return () => StatusBar.setBarStyle('light-content');
    }, [])
  );

  const loadNotifications = async (showRefresher = false) => {
    if (showRefresher) setRefreshing(true);
    try {
      const data = await fetchNotifications(true); // force refresh
      setNotifications(data);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
      showToast('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return; // already read
    try {
      triggerHaptic('light');
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadItems = notifications.some(n => !n.is_read);
    if (!unreadItems) {
      showToast('All caught up! ✨');
      return;
    }
    try {
      triggerHaptic('success');
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
      showToast('All notifications marked as read');
    } catch (e) {
      console.error('Failed to mark all read:', e);
      showToast('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      triggerHaptic('warning');
      await deleteNotification(id);
      setNotifications(prev => prev.filter(item => item.id !== id));
      showToast('Notification cleared');
    } catch (e) {
      console.error('Failed to delete notification:', e);
      showToast('Failed to clear notification');
    }
  };

  const onRefresh = () => {
    loadNotifications(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={ms(20)} color="#333" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
              </View>
            )}
          </View>
        </View>
        
        {notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton} 
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-open-outline" size={ms(16)} color={ACCENT} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} colors={[ACCENT]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={ms(52)} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>All quiet here</Text>
            <Text style={styles.emptySubtitle}>You'll receive notifications about order status, delivery, and promotions.</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.shopButtonText}>Explore Store</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const config = TYPE_CONFIGS[item.type] || TYPE_CONFIGS.general;
          
          return (
            <TouchableOpacity
              style={[
                styles.card,
                !item.is_read && styles.unreadCard,
              ]}
              onPress={() => handleMarkAsRead(item.id, item.is_read)}
              activeOpacity={0.9}
            >
              {/* Contextual Icon */}
              <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={ms(20)} color={config.iconColor} />
              </View>

              {/* Notification Content */}
              <View style={styles.contentContainer}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.title, !item.is_read && styles.unreadText]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  
                  {/* Read status indicator */}
                  {!item.is_read && <View style={styles.readDot} />}
                </View>
                
                <Text style={styles.body}>{item.body}</Text>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={ms(14)} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(10),
  },
  backButton: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(12),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(6),
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1A1A2E',
  },
  unreadBadge: {
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: sw(8),
    paddingVertical: sw(2),
    borderRadius: sw(10),
  },
  unreadBadgeText: {
    color: ACCENT,
    fontSize: fs(10),
    fontWeight: '700',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
  },
  markAllText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: ACCENT,
  },

  // List
  list: {
    padding: wp(4),
    paddingBottom: hp(5),
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: hp(10),
    paddingHorizontal: wp(8),
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
    textAlign: 'center',
    lineHeight: fs(18),
    marginBottom: hp(3.5),
  },
  shopButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: sw(28),
    paddingVertical: sw(13),
    borderRadius: sw(14),
    shadowColor: ACCENT,
    shadowOpacity: 0.2,
    shadowRadius: sw(8),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 3,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: sw(16),
    padding: sw(14),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: sw(8),
    shadowOffset: { width: 0, height: sw(2) },
    elevation: 1,
  },
  unreadCard: {
    borderColor: ACCENT_LIGHT,
    backgroundColor: '#FFFDFD',
  },
  iconContainer: {
    width: sw(42),
    height: sw(42),
    borderRadius: sw(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sw(12),
  },
  contentContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  title: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#666',
    flex: 1,
    marginRight: sw(8),
  },
  unreadText: {
    color: '#1A1A2E',
    fontWeight: '800',
  },
  readDot: {
    width: sw(8),
    height: sw(8),
    borderRadius: sw(4),
    backgroundColor: ACCENT,
  },
  body: {
    fontSize: fs(13),
    color: '#666',
    lineHeight: fs(18),
    marginBottom: hp(0.8),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: fs(10),
    color: '#999',
  },
  deleteButton: {
    padding: sw(4),
  },
});

import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  StatusBar,
  Modal,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../../constants/theme';
import { wp, hp, ms, fs, sw, SCREEN_WIDTH, isSmallDevice } from '../../utils/responsive';
import { fetchCoupons, claimCoupon, fetchNotifications, fetchCategories } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { triggerHaptic } from '../../utils/haptics';
import { sendLocalNotification } from '../../utils/notifications';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import LeafletMap from '../../components/LeafletMap';


const CARD_GAP = sw(12);
const CARD_WIDTH = (SCREEN_WIDTH - sw(48)) / 2;

const getCategoryIcon = (category) => {
  const normalized = category.toLowerCase().trim();
  if (normalized.includes("men")) return "shirt-outline";
  if (normalized.includes("women") || normalized.includes("woman")) return "woman-outline";
  if (normalized.includes("electronics") || normalized.includes("tech") || normalized.includes("laptop")) return "laptop-outline";
  if (normalized.includes("jewel") || normalized.includes("ring")) return "diamond-outline";
  if (normalized.includes("accessories") || normalized.includes("extra") || normalized.includes("watch")) return "watch-outline";
  if (normalized.includes("shoes") || normalized.includes("footwear") || normalized.includes("walk")) return "walk-outline";
  if (normalized.includes("appliance") || normalized.includes("home") || normalized.includes("kitchen")) return "home-outline";
  return "cube-outline"; // default dynamic category fallback icon
};

const DEFAULT_CATEGORIES = [
  { key: '', label: 'All', icon: 'grid-outline' },
  { key: "men's clothing", label: 'Men', icon: 'shirt-outline' },
  { key: "women's clothing", label: 'Women', icon: 'woman-outline' },
  { key: 'electronics', label: 'Tech', icon: 'laptop-outline' },
  { key: 'jewelery', label: 'Jewelry', icon: 'diamond-outline' },
  { key: 'accessories', label: 'Extras', icon: 'watch-outline' },
  { key: 'shoes', label: 'Shoes', icon: 'walk-outline' },
];

const FILTER_TABS = ['All', 'Newest', 'Popular'];

const checkMapApiKey = () => {
  if (Platform.OS === 'ios') return true;
  const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  return !!(apiKey && apiKey !== 'YOUR_ANDROID_GOOGLE_MAPS_API_KEY' && !apiKey.startsWith('YOUR_'));
};

export default function HomeScreen() {
  const { 
    products, loading, error, refreshing, onRefresh, retry, 
    searchQuery, setSearchQuery, category, setCategory,
    filter, setFilter 
  } = useProducts();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('All');
  const [coupons, setCoupons] = useState([]);
  const { user } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isStoreLocationModalVisible, setIsStoreLocationModalVisible] = useState(false);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);

  const loadCategories = async () => {
    try {
      const dynamicCategories = await fetchCategories();
      const mapped = [
        { key: '', label: 'All', icon: 'grid-outline' }
      ];
      const seen = new Set();
      dynamicCategories.forEach(cat => {
        const normalized = cat.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          let label = cat;
          if (normalized === "men's clothing") label = "Men";
          else if (normalized === "women's clothing") label = "Women";
          else if (normalized === "jewelery") label = "Jewelry";
          else label = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();

          mapped.push({
            key: cat,
            label: label,
            icon: getCategoryIcon(cat)
          });
        }
      });
      setCategories(mapped);
    } catch (e) {
      console.error('Failed to load categories dynamically:', e);
    }
  };

  const handleRefresh = async () => {
    triggerHaptic('light');
    if (user) {
      loadCoupons();
      loadUnreadCount();
    }
    loadCategories();
    onRefresh();
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await fetchNotifications(true);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error('Failed to load notifications unread count:', e);
    }
  };

  const BANNER_COLORS = [
    { bg: '#FFEBEE', accent: ACCENT, badge: ACCENT, label: 'Limited time' },
    { bg: '#FFF3E0', accent: '#FF9800', badge: '#FF9800', label: 'Hot deal' },
    { bg: '#E8F5E9', accent: '#4CAF50', badge: '#4CAF50', label: 'Exclusive' },
  ];

  useEffect(() => {
    if (user) loadCoupons();
    loadCategories();
  }, [user]);

  const loadCoupons = async () => {
    try {
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (e) { console.error(e); }
  };

  const handleClaim = async (couponId) => {
    try {
      const coupon = coupons.find(c => c.id === couponId);
      await claimCoupon(couponId);
      triggerHaptic('success');
      showToast('Coupon claimed! 🎉');
      if (coupon) {
        sendLocalNotification(
          'Coupon Claimed Successfully! 🎟️',
          `Code "${coupon.code}" has been saved to your profile. Apply it at checkout to save ${coupon.discount_percent}% off your order!`
        );
      }
      loadCoupons();
    } catch (e) {
      triggerHaptic('error');
      showToast(e.message || 'Failed to claim');
    }
  };

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
        {item.is_new ? (
          <View style={[styles.badge, styles.newBadge]}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        ) : item.is_popular ? (
          <View style={[styles.badge, styles.popularBadge]}>
            <Ionicons name="star" size={ms(8)} color="#fff" />
            <Text style={styles.badgeText}>HOT</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => { triggerHaptic('light'); addToCart(item); showToast('Added to cart!'); }}
        >
          <Ionicons name="heart-outline" size={ms(16)} color={ACCENT} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.productPrice}>₱{parseFloat(item.price).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      loadUnreadCount();
      return () => StatusBar.setBarStyle('dark-content');
    }, [user])
  );

  return (
    <View style={styles.container}>
      {/* Red Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => { triggerHaptic('selection'); setIsStoreLocationModalVisible(true); }}
            activeOpacity={0.7}
          >
            <Text style={styles.headerLocation}>Store Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={ms(14)} color="#fff" />
              <Text style={styles.locationText} numberOfLines={1}>SwiftStore</Text>
              <Ionicons name="chevron-down" size={ms(12)} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notifButton}
            onPress={() => { triggerHaptic('selection'); router.push('/notifications'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={ms(20)} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={ms(18)} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.filterIcon}
            onPress={() => { triggerHaptic('selection'); setIsCategoryModalVisible(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={ms(16)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductCard}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ACCENT} />
        }
        ListHeaderComponent={
          <>
            {/* Promo Banners */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>#SpecialForYou</Text>
              <TouchableOpacity onPress={() => { triggerHaptic('selection'); setIsCouponModalVisible(true); }}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
              {coupons.map((coupon, idx) => {
                const theme = BANNER_COLORS[idx % BANNER_COLORS.length];
                return (
                  <View key={coupon.id} style={[styles.bannerCard, { backgroundColor: theme.bg }]}>
                    <View style={styles.bannerContent}>
                      <View style={[styles.limitedBadge, { backgroundColor: theme.badge }]}>
                        <Text style={styles.limitedText}>{theme.label}</Text>
                      </View>
                      <Text style={styles.bannerTitle}>{coupon.code}</Text>
                      <Text style={styles.bannerDiscount}>Save up to</Text>
                      <Text style={[styles.bannerPercent, { color: theme.accent }]}>
                        {coupon.discount_percent}<Text style={styles.bannerPercentSign}>%</Text>
                      </Text>
                      {coupon.min_order > 0 && (
                        <Text style={styles.bannerMinOrder}>Min. order ₱{coupon.min_order}</Text>
                      )}
                      {coupon.claimed ? (
                        <View style={[styles.claimButton, { backgroundColor: '#E0E0E0' }]}>
                          <Ionicons name="checkmark-circle" size={ms(14)} color="#666" />
                          <Text style={[styles.claimText, { color: '#666' }]}>Claimed</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.claimButton, { backgroundColor: theme.accent }]}
                          onPress={() => handleClaim(coupon.id)}
                        >
                          <Ionicons name="gift-outline" size={ms(14)} color="#fff" />
                          <Text style={styles.claimText}>Claim</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
              {coupons.length === 0 && (
                <View style={[styles.bannerCard, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#999', fontSize: fs(13) }}>
                    {user ? 'No active coupons available' : 'Login to see offers'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Categories */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category</Text>
              <TouchableOpacity onPress={() => { triggerHaptic('selection'); setIsCategoryModalVisible(true); }}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.key + cat.label}
                  style={styles.categoryItem}
                  onPress={() => { triggerHaptic('selection'); setCategory(cat.key); }}
                >
                  <View style={[
                    styles.categoryIconBox,
                    category === cat.key && styles.categoryIconBoxActive,
                  ]}>
                    <Ionicons name={cat.icon} size={ms(22)} color={category === cat.key ? '#fff' : '#666'} />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    category === cat.key && styles.categoryLabelActive,
                  ]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filter Tabs */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Flash Sale</Text>
              <View style={styles.filterTabs}>
                {FILTER_TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setActiveFilter(tab);
                      if (tab === 'All') setFilter('');
                      else if (tab === 'Newest') setFilter('newest');
                      else if (tab === 'Popular') setFilter('popular');
                    }}
                  >
                    <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          loading && !refreshing ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={ACCENT} /></View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="cloud-offline-outline" size={ms(44)} color="#ccc" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retry}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>No products found.</Text>
          )
        }
      />

      {/* Category Selection Modal Sheet */}
      <Modal
        visible={isCategoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsCategoryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* Modal Drag Handle indicator */}
            <View style={styles.modalDragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Categories</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setIsCategoryModalVisible(false)}
              >
                <Ionicons name="close" size={ms(20)} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Categories Grid List */}
            <FlatList
              data={categories}
              keyExtractor={(item) => item.key + item.label}
              numColumns={3}
              contentContainerStyle={styles.modalGridContent}
              columnWrapperStyle={styles.modalGridRow}
              renderItem={({ item: cat }) => {
                const isActive = category === cat.key;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalCategoryCard,
                      isActive && styles.modalCategoryCardActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('success');
                      setCategory(cat.key);
                      setIsCategoryModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.modalCategoryIconContainer,
                      { backgroundColor: isActive ? ACCENT : ACCENT_LIGHT }
                    ]}>
                      <Ionicons name={cat.icon} size={ms(24)} color={isActive ? '#fff' : ACCENT} />
                    </View>
                    <Text 
                      style={[
                        styles.modalCategoryLabel,
                        isActive && styles.modalCategoryLabelActive
                      ]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Coupon Selection Modal Sheet */}
      <Modal
        visible={isCouponModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCouponModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsCouponModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* Modal Drag Handle indicator */}
            <View style={styles.modalDragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Special Offers & Coupons</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setIsCouponModalVisible(false)}
              >
                <Ionicons name="close" size={ms(20)} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Coupons List */}
            <FlatList
              data={coupons}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.couponModalListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyCouponsModalContainer}>
                  <Ionicons name="ticket-outline" size={ms(44)} color="#ccc" />
                  <Text style={styles.emptyCouponsModalText}>No coupon offers available right now.</Text>
                </View>
              }
              renderItem={({ item: coupon, index }) => {
                const theme = BANNER_COLORS[index % BANNER_COLORS.length];
                return (
                  <View style={[styles.couponModalCard, { backgroundColor: theme.bg }]}>
                    <View style={styles.couponModalCardLeft}>
                      <View style={[styles.couponModalBadge, { backgroundColor: theme.badge }]}>
                        <Text style={styles.couponModalBadgeText}>{theme.label}</Text>
                      </View>
                      <Text style={styles.couponModalCode}>{coupon.code}</Text>
                      <Text style={styles.couponModalDiscount}>
                        Save {coupon.discount_percent}% off your purchase
                      </Text>
                      {coupon.min_order > 0 && (
                        <Text style={styles.couponModalMinOrder}>
                          Min. spend: ₱{coupon.min_order}
                        </Text>
                      )}
                    </View>

                    <View style={styles.couponModalCardRight}>
                      {coupon.claimed ? (
                        <View style={[styles.couponModalClaimBtn, { backgroundColor: '#E0E0E0' }]}>
                          <Ionicons name="checkmark-circle" size={ms(14)} color="#666" />
                          <Text style={[styles.couponModalClaimText, { color: '#666' }]}>Saved</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.couponModalClaimBtn, { backgroundColor: theme.accent }]}
                          onPress={() => { handleClaim(coupon.id); }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="gift-outline" size={ms(14)} color="#fff" />
                          <Text style={styles.couponModalClaimText}>Claim</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* SwiftStore Pinpoint Location Modal */}
      <Modal
        visible={isStoreLocationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsStoreLocationModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsStoreLocationModalVisible(false)}
        >
          <View style={[styles.modalContent, { paddingBottom: 0 }]}>
            {/* Modal Drag Handle indicator */}
            <View style={styles.modalDragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SwiftStore Location</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setIsStoreLocationModalVisible(false)}
              >
                <Ionicons name="close" size={ms(20)} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Store Map */}
            <View style={styles.storeMapContainer}>
              {checkMapApiKey() ? (
                <MapView
                  style={styles.storeMap}
                  initialRegion={{
                    latitude: 14.5916,
                    longitude: 120.9734,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: 14.5916, longitude: 120.9734 }}
                    title="SwiftStore"
                    description="Cabildo St, Intramuros, Manila"
                    pinColor={ACCENT}
                  />
                </MapView>
              ) : (
                <LeafletMap
                  latitude={14.5916}
                  longitude={120.9734}
                  markerTitle="SwiftStore"
                  markerDescription="Cabildo St, Intramuros, Manila"
                  style={styles.storeMap}
                />
              )}
            </View>

            {/* Store Details Card */}
            <View style={styles.storeDetailsCard}>
              <View style={styles.storeDetailsRow}>
                <Ionicons name="location-sharp" size={ms(18)} color={ACCENT} style={styles.storeDetailsIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeDetailsLabel}>Address</Text>
                  <Text style={styles.storeDetailsText}>
                    Cabildo St, Intramuros, Manila, 1002 Metro Manila, Philippines
                  </Text>
                </View>
              </View>

              <View style={styles.storeDetailsRow}>
                <Ionicons name="time" size={ms(18)} color={ACCENT} style={styles.storeDetailsIcon} />
                <View>
                  <Text style={styles.storeDetailsLabel}>Opening Hours</Text>
                  <Text style={styles.storeDetailsText}>Open Daily: 9:00 AM - 9:00 PM</Text>
                </View>
              </View>

              <View style={styles.storeDetailsRow}>
                <Ionicons name="call" size={ms(18)} color={ACCENT} style={styles.storeDetailsIcon} />
                <View>
                  <Text style={styles.storeDetailsLabel}>Contact & Email</Text>
                  <Text style={styles.storeDetailsText}>+63 912 345 6789  |  support@swiftstore.com</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.directionsBtn}
                onPress={() => {
                  triggerHaptic('success');
                  const url = Platform.select({
                    ios: 'maps:0,0?q=SwiftStore@14.5916,120.9734',
                    android: 'geo:0,0?q=14.5916,120.9734(SwiftStore)'
                  });
                  Linking.openURL(url);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-circle" size={ms(18)} color="#fff" />
                <Text style={styles.directionsBtnText}>Get Directions on Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  header: {
    backgroundColor: ACCENT,
    paddingTop: hp(6.5),
    paddingBottom: hp(2.2),
    paddingHorizontal: wp(5),
    borderBottomLeftRadius: sw(24),
    borderBottomRightRadius: sw(24),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.8),
  },
  headerLocation: { color: 'rgba(255,255,255,0.7)', fontSize: fs(11), marginBottom: hp(0.4) },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: sw(4) },
  locationText: { color: '#fff', fontSize: fs(14), fontWeight: '600', maxWidth: wp(60) },
  notifButton: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(12),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: sw(14),
    paddingHorizontal: sw(14),
    paddingVertical: hp(1.2),
  },
  searchInput: { flex: 1, fontSize: fs(14), marginLeft: sw(10), color: '#333' },
  filterIcon: {
    width: sw(30),
    height: sw(30),
    borderRadius: sw(10),
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(2.2),
    marginBottom: hp(1.4),
  },
  sectionTitle: { fontSize: fs(16), fontWeight: '800', color: '#1A1A2E' },
  seeAll: { fontSize: fs(13), color: ACCENT, fontWeight: '600' },

  // Banner
  bannerScroll: { marginBottom: hp(0.5), marginHorizontal: sw(-4) },
  bannerCard: {
    width: wp(70),
    backgroundColor: ACCENT_LIGHT,
    borderRadius: sw(16),
    padding: sw(18),
    marginRight: sw(12),
    marginLeft: sw(4),
  },
  bannerContent: {},
  limitedBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: sw(10),
    paddingVertical: sw(4),
    borderRadius: sw(6),
    alignSelf: 'flex-start',
    marginBottom: hp(1),
  },
  limitedText: { color: '#fff', fontSize: fs(10), fontWeight: '700' },
  bannerTitle: { fontSize: fs(14), fontWeight: '700', color: '#1A1A2E', marginBottom: sw(2) },
  bannerDiscount: { fontSize: fs(12), color: '#666' },
  bannerPercent: { fontSize: fs(40), fontWeight: '900', color: ACCENT, lineHeight: fs(48) },
  bannerPercentSign: { fontSize: fs(20) },
  bannerMinOrder: { fontSize: fs(10), color: '#999', marginTop: sw(2) },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(5),
    backgroundColor: ACCENT,
    paddingHorizontal: sw(18),
    paddingVertical: sw(7),
    borderRadius: sw(18),
    alignSelf: 'flex-start',
    marginTop: hp(0.8),
  },
  claimText: { color: '#fff', fontSize: fs(12), fontWeight: '700' },

  // Category
  categoryScroll: { marginBottom: hp(0.5) },
  categoryItem: { alignItems: 'center', marginRight: sw(18) },
  categoryIconBox: {
    width: sw(52),
    height: sw(52),
    borderRadius: sw(16),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sw(6),
  },
  categoryIconBoxActive: { backgroundColor: ACCENT },
  categoryLabel: { fontSize: fs(11), color: '#666', fontWeight: '500' },
  categoryLabelActive: { color: ACCENT, fontWeight: '700' },

  // Filter Tabs
  filterTabs: { flexDirection: 'row', gap: sw(8) },
  filterTab: {
    paddingHorizontal: sw(14),
    paddingVertical: sw(6),
    borderRadius: sw(16),
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: { backgroundColor: ACCENT },
  filterTabText: { fontSize: fs(11), color: '#666', fontWeight: '600' },
  filterTabTextActive: { color: '#fff' },

  // Product List
  listContent: { paddingHorizontal: wp(4), paddingBottom: hp(5) },
  columnWrapper: { justifyContent: 'space-between', marginBottom: hp(1.5) },

  // Product Card
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: sw(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: sw(10),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 2,
  },
  productImageContainer: {
    height: CARD_WIDTH,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sw(14),
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: sw(8),
    left: sw(8),
    paddingHorizontal: sw(6),
    paddingVertical: sw(2),
    borderRadius: sw(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(2),
  },
  newBadge: { backgroundColor: '#10B981' },
  popularBadge: { backgroundColor: '#EF4444' },
  badgeText: { color: '#fff', fontSize: fs(8), fontWeight: '900' },
  heartButton: {
    position: 'absolute',
    top: sw(8),
    right: sw(8),
    width: sw(30),
    height: sw(30),
    borderRadius: sw(15),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: sw(4),
    shadowOffset: { width: 0, height: sw(2) },
    elevation: 3,
  },
  productInfo: { padding: sw(10) },
  productTitle: { fontSize: fs(12), fontWeight: '600', color: '#333', marginBottom: sw(3) },
  productPrice: { fontSize: fs(14), fontWeight: '800', color: ACCENT },

  // States
  centered: { paddingVertical: hp(8), alignItems: 'center' },
  errorContainer: { alignItems: 'center', paddingVertical: hp(5) },
  errorText: { fontSize: fs(13), color: '#999', marginTop: hp(1.5), marginBottom: hp(2), textAlign: 'center' },
  retryButton: { backgroundColor: ACCENT, paddingHorizontal: sw(24), paddingVertical: sw(10), borderRadius: sw(20) },
  retryText: { color: '#fff', fontWeight: '700', fontSize: fs(13) },
  emptyText: { textAlign: 'center', marginTop: hp(5), color: '#999', fontSize: fs(14) },
  badgeCount: {
    position: 'absolute',
    top: sw(-2),
    right: sw(-2),
    backgroundColor: '#EF4444',
    borderRadius: sw(9),
    width: sw(18),
    height: sw(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: sw(1.5),
    borderColor: ACCENT,
  },
  badgeCountText: {
    color: '#fff',
    fontSize: fs(9),
    fontWeight: '900',
    lineHeight: fs(11),
  },

  // Category Selection Modal Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: sw(24),
    borderTopRightRadius: sw(24),
    paddingBottom: hp(4),
    maxHeight: hp(65),
    minHeight: hp(35),
  },
  modalDragHandle: {
    width: sw(40),
    height: sw(5),
    borderRadius: sw(2.5),
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: hp(1.2),
    marginBottom: hp(0.8),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1A1A2E',
  },
  modalCloseButton: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(17),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGridContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  modalGridRow: {
    justifyContent: 'flex-start',
    gap: sw(12),
  },
  modalCategoryCard: {
    width: (SCREEN_WIDTH - sw(32) - sw(24)) / 3, // evenly spaced grid columns
    backgroundColor: '#FAF9F9',
    borderRadius: sw(18),
    paddingVertical: hp(1.8),
    paddingHorizontal: sw(8),
    alignItems: 'center',
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: '#F5F2F2',
  },
  modalCategoryCardActive: {
    borderColor: ACCENT_LIGHT,
    backgroundColor: '#FFFDFD',
  },
  modalCategoryIconContainer: {
    width: sw(50),
    height: sw(50),
    borderRadius: sw(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  modalCategoryLabel: {
    fontSize: fs(11),
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  modalCategoryLabelActive: {
    fontWeight: '800',
    color: ACCENT,
  },

  // Coupon Selection Modal Sheet
  couponModalListContent: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  emptyCouponsModalContainer: {
    alignItems: 'center',
    paddingVertical: hp(6),
  },
  emptyCouponsModalText: {
    fontSize: fs(13),
    color: '#999',
    marginTop: hp(1),
  },
  couponModalCard: {
    flexDirection: 'row',
    borderRadius: sw(16),
    padding: sw(16),
    marginBottom: hp(1.5),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponModalCardLeft: {
    flex: 1,
    marginRight: sw(10),
  },
  couponModalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: sw(8),
    paddingVertical: sw(2),
    borderRadius: sw(6),
    marginBottom: hp(0.5),
  },
  couponModalBadgeText: {
    color: '#fff',
    fontSize: fs(9),
    fontWeight: '800',
  },
  couponModalCode: {
    fontSize: fs(18),
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: hp(0.3),
  },
  couponModalDiscount: {
    fontSize: fs(12),
    color: '#444',
    fontWeight: '600',
    marginBottom: hp(0.2),
  },
  couponModalMinOrder: {
    fontSize: fs(10),
    color: '#666',
  },
  couponModalCardRight: {
    justifyContent: 'center',
  },
  couponModalClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    paddingHorizontal: sw(14),
    paddingVertical: sw(8),
    borderRadius: sw(10),
  },
  couponModalClaimText: {
    color: '#fff',
    fontSize: fs(12),
    fontWeight: '800',
  },

  // Store Location Modal Styles
  storeMapContainer: {
    height: hp(25),
    width: '100%',
    overflow: 'hidden',
  },
  storeMap: {
    width: '100%',
    height: '100%',
  },
  storeDetailsCard: {
    padding: sw(20),
    paddingBottom: hp(4),
  },
  storeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.8),
  },
  storeDetailsIcon: {
    marginRight: sw(12),
    marginTop: hp(0.2),
  },
  storeDetailsLabel: {
    fontSize: fs(10),
    color: '#999',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp(0.2),
  },
  storeDetailsText: {
    fontSize: fs(13),
    color: '#333',
    fontWeight: '600',
    lineHeight: fs(18),
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(6),
    backgroundColor: ACCENT,
    borderRadius: sw(12),
    paddingVertical: hp(1.8),
    marginTop: hp(1),
    shadowColor: ACCENT,
    shadowOpacity: 0.2,
    shadowRadius: sw(8),
    elevation: 3,
  },
  directionsBtnText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '800',
  },
  mapFallbackContainer: {
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sw(15),
    borderRadius: sw(12),
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
    paddingHorizontal: sw(10),
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

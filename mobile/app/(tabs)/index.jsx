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
} from 'react-native';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../../constants/theme';
import { wp, hp, ms, fs, sw, SCREEN_WIDTH, isSmallDevice } from '../../utils/responsive';
import { fetchCoupons, claimCoupon } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const CARD_GAP = sw(12);
const CARD_WIDTH = (SCREEN_WIDTH - sw(48)) / 2;

const CATEGORIES = [
  { key: '', label: 'All', icon: 'grid-outline' },
  { key: "men's clothing", label: 'Men', icon: 'shirt-outline' },
  { key: "women's clothing", label: 'Women', icon: 'woman-outline' },
  { key: 'electronics', label: 'Tech', icon: 'laptop-outline' },
  { key: 'jewelery', label: 'Jewelry', icon: 'diamond-outline' },
  { key: 'accessories', label: 'Extras', icon: 'watch-outline' },
  { key: 'shoes', label: 'Shoes', icon: 'walk-outline' },
];

const FILTER_TABS = ['All', 'Newest', 'Popular'];

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

  const BANNER_COLORS = [
    { bg: '#FFEBEE', accent: ACCENT, badge: ACCENT, label: 'Limited time' },
    { bg: '#FFF3E0', accent: '#FF9800', badge: '#FF9800', label: 'Hot deal' },
    { bg: '#E8F5E9', accent: '#4CAF50', badge: '#4CAF50', label: 'Exclusive' },
  ];

  useEffect(() => {
    if (user) loadCoupons();
  }, [user]);

  const loadCoupons = async () => {
    try {
      const data = await fetchCoupons();
      setCoupons(data);
    } catch (e) { console.error(e); }
  };

  const handleClaim = async (couponId) => {
    try {
      await claimCoupon(couponId);
      showToast('Coupon claimed! 🎉');
      loadCoupons();
    } catch (e) {
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
          onPress={() => { addToCart(item); showToast('Added to cart!'); }}
        >
          <Ionicons name="heart-outline" size={ms(16)} color={ACCENT} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Red Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLocation}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={ms(14)} color="#fff" />
              <Text style={styles.locationText}>SwiftCart Store</Text>
              <Ionicons name="chevron-down" size={ms(12)} color="#fff" />
            </View>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={ms(20)} color="#fff" />
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
          <TouchableOpacity style={styles.filterIcon}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        ListHeaderComponent={
          <>
            {/* Promo Banners */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>#SpecialForYou</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
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
                        <Text style={styles.bannerMinOrder}>Min. order ${coupon.min_order}</Text>
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
                  <Text style={{ color: '#999', fontSize: fs(13) }}>Login to see offers</Text>
                </View>
              )}
            </ScrollView>

            {/* Categories */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category</Text>
              <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key + cat.label}
                  style={styles.categoryItem}
                  onPress={() => setCategory(cat.key)}
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
  locationText: { color: '#fff', fontSize: fs(14), fontWeight: '600' },
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
});

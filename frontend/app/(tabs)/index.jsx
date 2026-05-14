import React from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, View, ScrollView } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { ProductCard } from '../../components/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { LinearGradient } from 'expo-linear-gradient';
import Input from '../../components/ui/Input';


const CATEGORIES = ['All', 'men\'s clothing', 'women\'s clothing', 'jewelery', 'electronics'];

export default function HomeScreen() {
  const { products, loading, error, refreshing, onRefresh, retry, searchQuery, setSearchQuery, category, setCategory } = useProducts();

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.headerContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ThemedText style={styles.subtitle}>Welcome back</ThemedText>
        <ThemedText type="title" style={styles.title}>Discover</ThemedText>
        
        <View style={styles.searchContainer}>
          <Input 
            placeholder="Search products..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryChip, (category === cat || (cat === 'All' && !category)) && styles.activeCategory]}
              onPress={() => setCategory(cat === 'All' ? '' : cat)}
            >
              <ThemedText style={[styles.categoryText, (category === cat || (cat === 'All' && !category)) && styles.activeCategoryText]}>
                {cat === 'All' ? cat : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
      
      {loading && !refreshing ? (
        <ThemedView style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </ThemedView>
      ) : error || !Array.isArray(products) ? (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {error || 'Failed to load products.'}
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProductCard product={item} />}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
          ListEmptyComponent={<ThemedText style={styles.emptyText}>No products found.</ThemedText>}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 4,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 0,
    borderRadius: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 5,
  },
  activeCategory: {
    backgroundColor: '#fff',
  },
  categoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#4F46E5',
  },
  list: {
    paddingBottom: 40,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
  }
});

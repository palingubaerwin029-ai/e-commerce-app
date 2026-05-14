import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { createProduct } from '../services/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title || !price) {
      showToast('Title and price are required!');
      return;
    }

    setLoading(true);
    try {
      await createProduct({ title, price: parseFloat(price), description, category, image });
      showToast('Product created successfully!');
      router.back();
    } catch (error) {
      console.error('Create product error:', error);
      showToast(`Failed to create product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Add New Product</ThemedText>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input
          label="Product Title"
          placeholder="Enter product title"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Price ($)"
          placeholder="0.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Input
          label="Description"
          placeholder="Enter product description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <Input
          label="Category"
          placeholder="e.g., electronics, clothing"
          value={category}
          onChangeText={setCategory}
        />
        <Input
          label="Image URL"
          placeholder="https://example.com/image.jpg"
          value={image}
          onChangeText={setImage}
        />

        <Button
          title="Create Product"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 16,
  },
  submitButton: {
    marginTop: 24,
  },
});

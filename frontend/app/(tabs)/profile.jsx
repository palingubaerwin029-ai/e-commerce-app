import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { router } from 'expo-router';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const textColor = isDark ? '#fff' : '#000';
  const cardColor = isDark ? '#1e1e1e' : '#fff';
  const bgColor = isDark ? '#121212' : '#f5f5f5';

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.loginText, { color: textColor }]}>Please log in to view your profile.</Text>
        <Button title="Log In" onPress={() => router.push('/(auth)/login')} style={styles.loginBtn} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <Text style={[styles.name, { color: textColor }]}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={[styles.menu, { backgroundColor: cardColor }]}>
          <Button 
            title="My Orders" 
            variant="secondary" 
            onPress={() => router.push('/orders')} 
            />
          <Button 
            title="Admin Panel" 
            variant="secondary" 
            onPress={() => router.push('/admin')} 
            style={styles.menuItem}
          />
          <Button 
            title="Log Out" 
            variant="secondary" 
            onPress={logout} 
            textStyle={{ color: '#ff4444' }}
            style={[styles.menuItem, { borderColor: '#ff4444' }]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#888',
  },
  menu: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  menuItem: {
    marginVertical: 8,
  },
  loginText: {
    fontSize: 18,
    marginBottom: 20,
  },
  loginBtn: {
    width: 200,
  }
});

import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../../constants/theme';
import { wp, hp, ms, fs, sw } from '../../utils/responsive';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, updateAvatar } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useState } from 'react';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission to access gallery was denied!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const imageUrl = await uploadImage(result.assets[0].uri);
        await updateAvatar(imageUrl);
        await updateUser({ avatar: imageUrl });
        showToast('Profile photo updated!');
      } catch (err) {
        showToast(`Update failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  const isAdmin = user?.role === 'admin';

  const menuItems = useMemo(() => {
    const items = [];
    if (!isAdmin) {
      items.push({ title: 'My Orders', icon: 'receipt-outline', route: '/orders' });
    }
    return items;
  }, [user]);

  if (!user) return null; // Fallback for transition frames

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={uploading}>
              <View style={styles.avatar}>
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={ms(12)} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={ms(12)} color="#999" />
                <Text style={styles.phoneText}>{user.phone}</Text>
              </View>
            )}
            {user.role === 'admin' && (
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={ms(12)} color="#6366F1" />
                <Text style={styles.roleText}>Admin</Text>
              </View>
            )}
          </View>

          {menuItems.length > 0 && (
            <View style={styles.menuCard}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.title}
                  style={[styles.menuRow, index > 0 && styles.menuRowBorder]}
                  onPress={() => router.push(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={ms(18)} color={ACCENT} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={ms(16)} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={ms(18)} color={ACCENT} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { flex: 1 },
  scrollContent: { padding: wp(5), paddingTop: hp(2) },
  logoutContainer: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    paddingTop: hp(1),
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(10) },
  emptyIcon: {
    width: sw(90),
    height: sw(90),
    borderRadius: sw(45),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  emptyTitle: { fontSize: fs(18), fontWeight: '700', color: '#333', marginBottom: hp(1) },
  emptySubtitle: { fontSize: fs(14), color: '#999', marginBottom: hp(3) },
  loginButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: sw(36),
    paddingVertical: sw(13),
    borderRadius: sw(14),
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: sw(8),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 6,
  },
  loginButtonText: { color: '#fff', fontSize: fs(15), fontWeight: '700' },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: sw(20),
    padding: sw(24),
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: sw(12),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 2,
  },
  avatar: {
    width: sw(80),
    height: sw(80),
    borderRadius: sw(24),
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: sw(24),
  },
  editBadge: {
    position: 'absolute',
    bottom: -sw(4),
    right: -sw(4),
    backgroundColor: '#6366F1',
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: { color: '#fff', fontSize: fs(28), fontWeight: '800' },
  name: { fontSize: fs(20), fontWeight: '800', color: '#1A1A2E', marginBottom: sw(4) },
  email: { fontSize: fs(13), color: '#999' },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(5),
    marginTop: sw(4),
  },
  phoneText: { fontSize: fs(12), color: '#999' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: sw(12),
    paddingVertical: sw(5),
    borderRadius: sw(10),
    marginTop: hp(1.2),
    gap: sw(5),
  },
  roleText: { fontSize: fs(11), fontWeight: '700', color: '#6366F1' },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: sw(20),
    padding: sw(4),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: sw(12),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 2,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(2), paddingHorizontal: sw(16) },
  menuRowBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  menuIcon: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(12),
    backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sw(14),
  },
  menuTitle: { flex: 1, fontSize: fs(14), fontWeight: '600', color: '#333' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: sw(16),
    paddingVertical: hp(2),
    gap: sw(8),
    borderWidth: 1,
    borderColor: ACCENT_LIGHT,
  },
  logoutText: { color: ACCENT, fontSize: fs(14), fontWeight: '700' },
});

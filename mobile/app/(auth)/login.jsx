import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput, Image } from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../../constants/theme';
import { wp, hp, ms, fs, sw } from '../../utils/responsive';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useContext(AuthContext);
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) { showToast('Please enter both email and password', 'error'); return; }
    try {
      await login(email, password);
      showToast('Logged in successfully!', 'success');
      router.replace('/(tabs)');
    } catch (e) { showToast(e.message || 'Login failed', 'error'); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: 'transparent' }]}>
            <Image source={require('../../assets/logo.png')} style={{ width: sw(120), height: sw(120) }} resizeMode="contain" />
          </View>
          <Text style={styles.heroTitle}>Welcome{'\n'}Back</Text>
          <Text style={styles.heroSubtitle}>Sign in to continue your shopping experience</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={ms(18)} color="#999" />
              <TextInput style={styles.textInput} placeholder="Enter your email" placeholderTextColor="#bbb"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={ms(18)} color="#999" />
              <TextInput style={styles.textInput} placeholder="Enter your password" placeholderTextColor="#bbb"
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={ms(18)} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={[styles.loginButton, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.loginButtonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: wp(6), justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: hp(5) },
  iconCircle: {
    width: sw(80),
    height: sw(80),
    borderRadius: sw(24),
    backgroundColor: ACCENT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  heroTitle: { fontSize: fs(30), fontWeight: '900', color: '#1A1A2E', textAlign: 'center', lineHeight: fs(38), marginBottom: hp(1) },
  heroSubtitle: { fontSize: fs(14), color: '#999', textAlign: 'center' },
  form: { width: '100%' },
  inputGroup: { marginBottom: hp(2.5) },
  label: { fontSize: fs(13), fontWeight: '600', color: '#333', marginBottom: hp(1) },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: sw(14),
    paddingHorizontal: sw(16),
    paddingVertical: hp(1.7),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  textInput: { flex: 1, fontSize: fs(14), color: '#333', marginLeft: sw(12) },
  loginButton: {
    backgroundColor: ACCENT,
    paddingVertical: hp(2),
    borderRadius: sw(16),
    alignItems: 'center',
    marginTop: hp(1.5),
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: sw(8),
    shadowOffset: { width: 0, height: sw(4) },
    elevation: 6,
  },
  loginButtonText: { color: '#fff', fontSize: fs(16), fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: hp(4) },
  footerText: { color: '#666', fontSize: fs(14) },
  footerLink: { color: ACCENT, fontWeight: '700', fontSize: fs(14) },
});

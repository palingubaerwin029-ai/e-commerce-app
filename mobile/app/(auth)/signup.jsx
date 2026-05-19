import React, { useState, useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT, ACCENT_LIGHT } from '../../constants/theme';
import { wp, hp, ms, fs, sw } from '../../utils/responsive';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loading } = useContext(AuthContext);
  const { showToast } = useToast();

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) { showToast('Please fill in all fields', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    try {
      await signup(name, email, password, phone);
      showToast('Account created successfully!', 'success');
      router.replace('/(tabs)');
    } catch (e) { showToast(e.message || 'Signup failed', 'error'); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-add" size={ms(40)} color={ACCENT} />
          </View>
          <Text style={styles.heroTitle}>Create{'\n'}Account</Text>
          <Text style={styles.heroSubtitle}>Join SwiftCart and start shopping</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={ms(18)} color="#999" />
              <TextInput style={styles.textInput} placeholder="Enter your name" placeholderTextColor="#bbb"
                value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={ms(18)} color="#999" />
              <TextInput style={styles.textInput} placeholder="Enter your email" placeholderTextColor="#bbb"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={ms(18)} color="#999" />
              <TextInput style={styles.textInput} placeholder="Enter your phone number" placeholderTextColor="#bbb"
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={ms(18)} color="#999" />
              <TextInput style={styles.textInput} placeholder="Create a password" placeholderTextColor="#bbb"
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={ms(18)} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={[styles.signupButton, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.signupButtonText}>{loading ? 'Creating...' : "Let's Get Started"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: wp(6), justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: hp(4) },
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
  required: { color: '#EF4444', fontWeight: '700' },
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
  signupButton: {
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
  signupButtonText: { color: '#fff', fontSize: fs(16), fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: hp(4) },
  footerText: { color: '#666', fontSize: fs(14) },
  footerLink: { color: ACCENT, fontWeight: '700', fontSize: fs(14) },
});

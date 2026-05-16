import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT } from '../../constants/theme';
import { sw, fs, hp } from '../../utils/responsive';
import { AuthContext } from '../../context/AuthContext';

export default function TabLayout() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isAdmin ? '#6366F1' : ACCENT,
        tabBarInactiveTintColor: '#BDBDBD',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: hp(9),
          paddingBottom: hp(1.5),
          paddingTop: hp(1),
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: sw(12),
          shadowOffset: { width: 0, height: sw(-4) },
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: fs(10),
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={sw(22)} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <Ionicons name="cart-outline" size={sw(22)} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={sw(22)} color={color} />,
        }}
      />
    </Tabs>
  );
}

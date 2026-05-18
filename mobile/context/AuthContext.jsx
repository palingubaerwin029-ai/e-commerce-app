import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiLogin, apiSignup, setAuthToken, registerInvalidTokenCallback } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for token on startup
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        if (token && userData) {
          setAuthToken(token);
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error('Failed to restore token', e);
      }
      setLoading(false);
    };

    bootstrapAsync();

    // Register callback for invalid token auto-logout
    registerInvalidTokenCallback(() => {
      logout();
    });
  }, [logout]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(email, password);
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      setAuthToken(data.token);
      setUser(data.user);
    } catch (e) {
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, phone) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiSignup(name, email, password, phone);
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      setAuthToken(data.token);
      setUser(data.user);
    } catch (e) {
      setError(e.message || 'Signup failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setAuthToken(null);
      setUser(null);
    } catch (e) {
      console.error('Failed to clear token', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = async (updates) => {
    const updatedUser = { ...user, ...updates };
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useContext, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, Animated, Text } from 'react-native';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toastMessage, setToastMessage] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  }, [opacity]);

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity }]} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

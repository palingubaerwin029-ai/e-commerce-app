import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { useThemeColor } from '../../hooks/use-theme-color';

export default function Input({ label, error, style, ...props }) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  
  // Hardcode a subtle dark border if in dark mode or soft border in light mode
  const currentBorderColor = borderColor || '#ccc';

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { color: textColor, borderColor: currentBorderColor, backgroundColor: backgroundColor }
        ]}
        placeholderTextColor="#888"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
});

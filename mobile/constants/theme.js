import { Platform } from 'react-native';

// SwiftCart coral-red theme matching the reference design
const tintColorLight = '#F44336';
const tintColorDark = '#FF6B6B';

export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#F0F0F0',
    subtle: '#F8F8F8',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1E1E1E',
    border: '#2C2C2C',
    subtle: '#1A1A1A',
  },
};

export const ACCENT = '#F44336';
export const ACCENT_LIGHT = '#FFEBEE';
export const ACCENT_DARK = '#D32F2F';

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

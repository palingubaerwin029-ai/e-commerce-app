import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 14 / standard 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Scale based on screen width
export const wp = (widthPercent) => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * widthPercent) / 100);
};

// Scale based on screen height
export const hp = (heightPercent) => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * heightPercent) / 100);
};

// Scale a pixel value relative to base width
export const sw = (size) => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size);
};

// Scale a pixel value relative to base height
export const sh = (size) => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / BASE_HEIGHT) * size);
};

// Moderate scale — less aggressive scaling for fonts/padding
export const ms = (size, factor = 0.5) => {
  return PixelRatio.roundToNearestPixel(size + (sw(size) - size) * factor);
};

// Font scale
export const fs = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Check if small screen (iPhone SE, etc.)
export const isSmallDevice = SCREEN_WIDTH < 375;

// Check if large device (tablets, etc.)
export const isLargeDevice = SCREEN_WIDTH >= 768;

// Get number of columns based on screen width
export const getColumns = (minCardWidth = 160) => {
  return Math.floor(SCREEN_WIDTH / sw(minCardWidth));
};

// Screen dimensions
export { SCREEN_WIDTH, SCREEN_HEIGHT };

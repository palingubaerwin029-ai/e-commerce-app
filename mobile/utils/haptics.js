import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Triggers haptic feedback based on the interaction type.
 * Automatically checks for platform support to avoid crashes on unsupported environments.
 */
export const triggerHaptic = async (type = 'selection') => {
  if (Platform.OS === 'web') return;
  
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
      default:
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    console.log('[Haptics Utility Error]', error);
  }
};

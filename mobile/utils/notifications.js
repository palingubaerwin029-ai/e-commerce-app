import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Detect if we are running in the standard Expo Go client app
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure notification behavior for when the app is active in the foreground
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.log('[Notifications Utility] Failed to set handler:', err.message);
  }
}

/**
 * Requests device permissions to send notifications to the user.
 * Also configures native channels (especially important for sound/vibe on Android).
 */
export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === 'web') return null;
  
  if (isExpoGo) {
    console.log('[Notifications Utility] SDK 54: Bypassing native registration in Expo Go to prevent terminal errors. Use a development build (expo run:android) to enable full device notifications.');
    return 'granted'; // Return mocked 'granted' status to prevent user blocks inside Expo Go
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications Utility] Local notifications permission not granted!');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F44336',
      });
    }

    return finalStatus;
  } catch (error) {
    console.error('[Notifications Utility Registration Error]', error);
    return null;
  }
};

/**
 * Triggers an immediate local push notification to the device.
 * @param {string} title - The notification title
 * @param {string} body - The notification message body
 * @param {object} data - Optional payload dictionary
 */
export const sendLocalNotification = async (title, body, data = {}) => {
  if (Platform.OS === 'web') return;

  if (isExpoGo) {
    console.log(`[Local Notification (Expo Go Mock)] 🔔 ${title} - ${body}`);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // trigger immediately
    });
  } catch (error) {
    console.error('[Notifications Utility Send Error]', error);
  }
};

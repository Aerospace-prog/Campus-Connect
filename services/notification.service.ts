import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { Event, User } from '../types/models';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * NotificationService - Handles push notification operations
 */
export class NotificationService {
  private static notificationListener: Notifications.EventSubscription | null = null;
  private static responseListener: Notifications.EventSubscription | null = null;


  private static isRunningInExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  /**
   * Register for push notifications and get the push token
   * Note: Push notifications are not supported in Expo Go since SDK 53.
   * Use a development build for full push notification support.
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Skip push notification registration in Expo Go
      if (this.isRunningInExpoGo()) {
        console.log('Push notifications are not supported in Expo Go. Use a development build.');
        return null;
      }

      // Check if we're on a physical device
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If permission denied, return null
      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Get projectId from Constants or environment variable
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId ?? 
        process.env.EXPO_PUBLIC_PROJECT_ID;

      if (!projectId) {
        console.log('No projectId found. Push notifications require EAS project configuration.');
        return null;
      }

      // Get the push token
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      return tokenData.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }


  /**
   * Store push token in user's Firestore document
   */
  static async storePushToken(userId: string, pushToken: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken,
      });
    } catch (error) {
      console.error('Error storing push token:', error);
      throw new Error('Failed to store push token');
    }
  }

  /**
   * Send notification to all users who RSVP'd for an event
   */
  static async sendToEvent(
    eventId: string,
    title: string,
    message: string
  ): Promise<{ success: boolean; sentCount: number; failedCount: number; noTokenCount?: number; errors?: string[] }> {
    try {
      // Get the event to find RSVP'd users
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      const event = eventSnap.data() as Event;
      const rsvpUserIds = event.rsvps || [];

      if (rsvpUserIds.length === 0) {
        return { success: true, sentCount: 0, failedCount: 0 };
      }

      // Get push tokens for all RSVP'd users
      const pushTokens: string[] = [];
      let usersWithoutTokens = 0;
      
      // Firestore 'in' queries are limited to 30 items, so we batch
      const batchSize = 30;
      for (let i = 0; i < rsvpUserIds.length; i += batchSize) {
        const batch = rsvpUserIds.slice(i, i + batchSize);
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', 'in', batch)
        );
        const usersSnap = await getDocs(usersQuery);
        
        usersSnap.docs.forEach((doc) => {
          const userData = doc.data() as User;
          if (userData.pushToken) {
            console.log(`User ${userData.uid} has token: ${userData.pushToken.substring(0, 30)}...`);
            pushTokens.push(userData.pushToken);
          } else {
            usersWithoutTokens++;
            console.log(`User ${userData.uid} has no push token registered`);
          }
        });
      }

      // Track users not found in database
      const foundUserCount = pushTokens.length + usersWithoutTokens;
      const notFoundCount = rsvpUserIds.length - foundUserCount;
      if (notFoundCount > 0) {
        console.warn(`${notFoundCount} RSVP'd users not found in database`);
      }

      if (pushTokens.length === 0) {
        return { 
          success: true, 
          sentCount: 0, 
          failedCount: 0,
          noTokenCount: usersWithoutTokens + notFoundCount,
          errors: usersWithoutTokens > 0 ? ['Some users have not enabled push notifications'] : undefined
        };
      }

      console.log(`Sending notifications to ${pushTokens.length} tokens (${usersWithoutTokens} users without tokens)`);

      // Send notifications using Expo Push API
      const results = await this.sendPushNotifications(pushTokens, title, message, { eventId });

      return {
        ...results,
        noTokenCount: usersWithoutTokens + notFoundCount
      };
    } catch (error) {
      console.error('Error sending notifications to event:', error);
      throw new Error('Failed to send notifications');
    }
  }

  /**
   * Send notification to a specific user
   */
  static async sendToUser(
    userId: string,
    title: string,
    message: string,
    data?: { eventId?: string }
  ): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const user = userSnap.data() as User;

      if (!user.pushToken) {
        console.log('User does not have a push token');
        return false;
      }

      const results = await this.sendPushNotifications([user.pushToken], title, message, data);
      return results.sentCount > 0;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }


  /**
   * Send push notifications via Expo Push API
   */
  private static async sendPushNotifications(
    pushTokens: string[],
    title: string,
    body: string,
    data?: { eventId?: string }
  ): Promise<{ success: boolean; sentCount: number; failedCount: number; errors?: string[] }> {
    // Filter out invalid tokens before sending
    const validTokens = pushTokens.filter(token => {
      // Expo push tokens should start with 'ExponentPushToken[' or be a valid format
      const isValid = token && (
        token.startsWith('ExponentPushToken[') || 
        token.startsWith('ExpoPushToken[')
      );
      if (!isValid) {
        console.warn('Invalid push token format:', token?.substring(0, 20) + '...');
      }
      return isValid;
    });

    if (validTokens.length === 0) {
      console.log('No valid push tokens to send to');
      return { 
        success: true, 
        sentCount: 0, 
        failedCount: pushTokens.length,
        errors: ['No valid push tokens found. Users may need to re-register for notifications.']
      };
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data: data || {},
      priority: 'high' as const,
    }));

    try {
      // Send to Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Expo Push API response:', JSON.stringify(result, null, 2));

      // Count successes and failures with detailed error tracking
      let sentCount = 0;
      let failedCount = pushTokens.length - validTokens.length; // Start with invalid tokens
      const errors: string[] = [];

      if (result.data) {
        result.data.forEach((item: { status: string; message?: string; details?: { error?: string } }, index: number) => {
          if (item.status === 'ok') {
            sentCount++;
          } else {
            failedCount++;
            const errorMsg = item.details?.error || item.message || 'Unknown error';
            console.error(`Push notification failed for token ${index}:`, errorMsg);
            errors.push(errorMsg);
            
            // Log specific error types for debugging
            if (item.details?.error === 'DeviceNotRegistered') {
              console.warn('Device not registered - token may be stale and should be removed');
            } else if (item.details?.error === 'InvalidCredentials') {
              console.error('Invalid credentials - check Expo project configuration');
            }
          }
        });
      }

      return { success: true, sentCount, failedCount, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return { 
        success: false, 
        sentCount: 0, 
        failedCount: pushTokens.length,
        errors: [error instanceof Error ? error.message : 'Network error']
      };
    }
  }

  /**
   * Set up notification listeners for foreground notifications and tap handling
   * Requirements: 6.3, 6.4
   */
  static setupNotificationListeners(): () => void {
    // Listener for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listener for when user taps on a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        this.handleNotificationTap(response);
      }
    );

    // Return cleanup function
    return () => {
      if (this.notificationListener) {
        this.notificationListener.remove();
        this.notificationListener = null;
      }
      if (this.responseListener) {
        this.responseListener.remove();
        this.responseListener = null;
      }
    };
  }

  /**
   * Handle notification received in foreground
   * Requirements: 6.3
   */
  private static handleNotificationReceived(
    notification: Notifications.Notification
  ): void {
    const data = notification.request.content.data;
    console.log('Foreground notification data:', data);
    // Notification will be displayed automatically due to setNotificationHandler config
  }

  /**
   * Handle notification tap - deep link to event detail
   * Requirements: 6.4
   */
  private static handleNotificationTap(
    response: Notifications.NotificationResponse
  ): void {
    const data = response.notification.request.content.data;
    
    if (data?.eventId) {
      // Navigate to event detail screen
      router.push(`/event/${data.eventId}` as any);
    }
  }

  /**
   * Get the count of RSVP'd users for an event (for UI display)
   */
  static async getRSVPCountForEvent(eventId: string): Promise<number> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        return 0;
      }

      const event = eventSnap.data() as Event;
      return event.rsvps?.length || 0;
    } catch (error) {
      console.error('Error getting RSVP count:', error);
      return 0;
    }
  }

  /**
   * Schedule a local notification (for testing or reminders)
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: { eventId?: string },
    triggerSeconds: number = 1
  ): Promise<string> {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });

    return identifier;
  }
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { OfflineBanner } from '@/components/offline-banner';
import { AuthProvider, useAuth } from '@/contexts/auth.context';
import { EventsProvider } from '@/contexts/events.context';
import { NetworkProvider } from '@/contexts/network.context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NotificationService } from '@/services/notification.service';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Set up notification listeners on mount
  useEffect(() => {
    const cleanup = NotificationService.setupNotificationListeners();
    return cleanup;
  }, []);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    const registerPushNotifications = async () => {
      if (user?.uid) {
        try {
          const pushToken = await NotificationService.registerForPushNotifications();
          if (pushToken) {
            await NotificationService.storePushToken(user.uid, pushToken);
            console.log('Push token registered:', pushToken);
          }
        } catch (error) {
          // Handle permission denial gracefully - don't block app usage
          console.log('Push notification registration skipped:', error);
        }
      }
    };

    registerPushNotifications();
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login' as any);
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="event/[id]" 
            options={{ 
              presentation: 'modal', 
              title: 'Event Details',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="create-event" 
            options={{ 
              presentation: 'modal', 
              title: 'Create Event',
              headerShown: true,
              headerStyle: { backgroundColor: '#6366f1' },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen 
            name="edit-event" 
            options={{ 
              presentation: 'modal', 
              title: 'Edit Event',
              headerShown: true,
              headerStyle: { backgroundColor: '#6366f1' },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen 
            name="send-notification" 
            options={{ 
              presentation: 'modal', 
              title: 'Send Notification',
              headerShown: true,
              headerStyle: { backgroundColor: '#6366f1' },
              headerTintColor: '#fff',
            }} 
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <EventsProvider>
          <RootLayoutNav />
        </EventsProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}

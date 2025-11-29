import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth.context';
import { EventsProvider } from '@/contexts/events.context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <EventsProvider>
        <RootLayoutNav />
      </EventsProvider>
    </AuthProvider>
  );
}

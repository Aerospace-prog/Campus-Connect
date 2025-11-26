import { useRole } from '@/hooks/use-role';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';


export default function AdminLayout() {
  const { isAdmin, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if user is admin, redirect if not (Requirements 8.1)
    if (!isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [isAdmin, loading, router]);

  // Show loading indicator while checking role
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Don't render admin screens if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Admin Dashboard',
          headerLeft: () => null,
        }} 
      />
      <Stack.Screen 
        name="create-event" 
        options={{ title: 'Create Event' }} 
      />
      <Stack.Screen 
        name="scanner" 
        options={{ title: 'Scan QR Code' }} 
      />
      <Stack.Screen 
        name="send-notification" 
        options={{ title: 'Send Notification' }} 
      />
    </Stack>
  );
}

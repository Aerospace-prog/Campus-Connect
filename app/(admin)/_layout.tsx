import { useAuth } from '@/contexts/auth.context';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';


export default function AdminLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if user is admin, redirect if not
    if (!user || user.role !== 'admin') {
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, router]);

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

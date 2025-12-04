import { Stack } from 'expo-router';

import { ErrorBoundary } from '@/components/error-boundary';

export default function AuthLayout() {
  return (
    <ErrorBoundary screenName="AuthLayout">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </ErrorBoundary>
  );
}

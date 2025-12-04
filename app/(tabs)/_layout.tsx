import { Tabs } from 'expo-router';
import React from 'react';

import { ErrorBoundary } from '@/components/error-boundary';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useRole } from '@/hooks/use-role';

export default function TabLayout() {
  const { colors } = useTheme();
  const { isAdmin, isStudent } = useRole();

  return (
    <ErrorBoundary screenName="TabLayout">
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: true,
        tabBarButton: HapticTab,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}>
      {/* Events tab - visible to all users */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      
      {/* My Events tab - visible only to students  */}
      <Tabs.Screen
        name="my-events"
        options={{
          title: 'My Events',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
          href: isStudent ? '/my-events' : null,
        }}
      />
      
      {/* Manage tab - visible only to admins  */}
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.grid.2x2" color={color} />,
          href: isAdmin ? '/manage' : null,
        }}
      />
      
      {/* Scanner tab - visible only to admins  */}
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode" color={color} />,
          href: isAdmin ? '/scanner' : null,
        }}
      />
      
      {/* Profile tab - visible to all users  */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    
    </Tabs>
    </ErrorBoundary>
  );
}

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { ErrorBoundary } from '@/components/error-boundary';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useRole } from '@/hooks/use-role';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { isAdmin, isStudent } = useRole();

  return (
    <ErrorBoundary screenName="TabLayout">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabIconDefault,
          headerShown: true,
          tabBarButton: HapticTab,
          headerStyle: {
            backgroundColor: colors.surface,
            ...Platform.select({
              ios: {
                shadowColor: colors.border,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              },
              android: {
                elevation: 4,
              },
            }),
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
            letterSpacing: -0.3,
          },
          headerTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: isDark ? colors.border : 'transparent',
            borderTopWidth: isDark ? StyleSheet.hairlineWidth : 0,
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
              },
              android: {
                elevation: 8,
              },
            }),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: -2,
          },
        }}
      >
        {/* Events tab - visible to all users */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 26 : 24}
                name="calendar"
                color={color}
              />
            ),
          }}
        />

        {/* My Events tab - visible only to students  */}
        <Tabs.Screen
          name="my-events"
          options={{
            title: 'My Events',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 26 : 24}
                name="star.fill"
                color={color}
              />
            ),
            href: isStudent ? '/my-events' : null,
          }}
        />

        {/* Manage tab - visible only to admins  */}
        <Tabs.Screen
          name="manage"
          options={{
            title: 'Manage',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 26 : 24}
                name="square.grid.2x2"
                color={color}
              />
            ),
            href: isAdmin ? '/manage' : null,
          }}
        />

        {/* Scanner tab - visible only to admins  */}
        <Tabs.Screen
          name="scanner"
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 26 : 24}
                name="qrcode"
                color={color}
              />
            ),
            href: isAdmin ? '/scanner' : null,
          }}
        />

        {/* Profile tab - visible to all users  */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 26 : 24}
                name="person.fill"
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}

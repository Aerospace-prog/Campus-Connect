/**
 * Haptic Tab Component
 * 
 * Tab bar button with haptic feedback for both iOS and Android.
 * Requirements: 10.4, 10.5
 */

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Add haptic feedback on both iOS and Android
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (Platform.OS === 'android') {
          // Android also supports haptic feedback through expo-haptics
          Haptics.selectionAsync();
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

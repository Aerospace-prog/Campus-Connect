/**
 * Loading Overlay Component
 * 
 * Full-screen loading overlay for async operations.
 */

import { useTheme } from '@/contexts/theme.context';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Loading message to display */
  message?: string;
  /** Whether to use a transparent background */
  transparent?: boolean;
}

export function LoadingOverlay({
  visible,
  message = 'Loading...',
  transparent = true,
}: LoadingOverlayProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: colors.surface },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

/**
 * Inline loading indicator for use within components
 */
interface LoadingIndicatorProps {
  /** Size of the indicator */
  size?: 'small' | 'large';
  /** Loading message */
  message?: string;
  /** Center the indicator */
  centered?: boolean;
}

export function LoadingIndicator({
  size = 'large',
  message,
  centered = true,
}: LoadingIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.indicator, centered && styles.indicatorCentered]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.indicatorMessage, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  indicator: {
    padding: 16,
    alignItems: 'center',
  },
  indicatorCentered: {
    flex: 1,
    justifyContent: 'center',
  },
  indicatorMessage: {
    marginTop: 12,
    fontSize: 14,
  },
});

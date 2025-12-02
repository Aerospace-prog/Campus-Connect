import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isOnline, useNetworkStatus } from '../hooks/use-network-status';

/**
 * OfflineBanner - Displays a banner when the device is offline
 *
 * This component monitors network connectivity and shows a warning
 * banner below the status bar when the device loses internet connection.
 * Uses a transparent Modal to ensure it appears above all other content
 * including navigation headers on all screens.
 */
export function OfflineBanner(): React.ReactElement | null {
  const networkStatus = useNetworkStatus();
  const online = isOnline(networkStatus);
  const insets = useSafeAreaInsets();

  // Don't render anything if online
  if (online) {
    return null;
  }

  // Position below status bar
  const topPosition = insets.top + 4;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <View style={styles.modalContainer} pointerEvents="box-none">
        <View style={[styles.banner, { top: topPosition }]} pointerEvents="none">
          <Text style={styles.text}>⚠️ You're offline</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    alignItems: 'center',
  },
  banner: {
    position: 'absolute',
    backgroundColor: '#fbbf24',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  text: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});

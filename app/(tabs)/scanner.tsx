import { StyleSheet, Text, View } from 'react-native';

/**
 * ScannerTab - QR code scanning interface for check-ins
 * Requirements: 5.1, 5.2, 5.5, 8.7
 * 
 * Note: Full implementation will be completed in task 13.2
 * This is a placeholder to establish the tab structure
 */
export default function ScannerTab() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>📷</Text>
        <Text style={styles.placeholderTitle}>QR Code Scanner</Text>
        <Text style={styles.placeholderText}>
          Scanner functionality will be implemented in task 13.2
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

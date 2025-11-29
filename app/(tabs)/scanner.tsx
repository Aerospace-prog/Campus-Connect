import { useRole } from '@/hooks/use-role';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

/**
 * ScannerTab - QR code scanning interface for check-ins
 * 
 * Note: Full implementation will be completed in task 13.2
 * This is a placeholder to establish the tab structure
 */
export default function ScannerTab() {
  const router = useRouter();
  const { isAdmin, loading: roleLoading } = useRole();

  // Fallback guard: redirect non-admins who attempt direct URL access (Requirements 8.3, 8.4)
  useEffect(() => {
    if (roleLoading) return;
    
    if (!isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [isAdmin, roleLoading, router]);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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

import { useAuth } from '@/contexts/auth.context';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>
        Welcome, {user?.name || 'Admin'}! Manage events and attendees.
      </Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/create-event' as any)}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionButtonText}>Create Event</Text>
          <Text style={styles.actionDescription}>Create a new campus event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/my-events' as any)}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionButtonText}>My Events</Text>
          <Text style={styles.actionDescription}>View and edit your events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/scanner' as any)}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionButtonText}>Scan QR Codes</Text>
          <Text style={styles.actionDescription}>Check in attendees</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push('/(tabs)' as any)}
        >
          <Text style={styles.actionIcon}>🏠</Text>
          <Text style={styles.actionButtonText}>Browse Events</Text>
          <Text style={styles.actionDescription}>View all campus events</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#4f46e5',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});

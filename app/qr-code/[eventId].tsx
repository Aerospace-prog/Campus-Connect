import { QRCodeDisplay } from '@/components/qr-code-display';
import { useAuth } from '@/hooks/use-auth';
import { useEvents } from '@/hooks/use-events';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/**
 * QR Code Screen - Displays QR code for event check-in
 * Only accessible for events the user has RSVP'd to
 * Works offline using cached data
 */
export default function QRCodeScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const { myEvents, isUserRSVPd } = useEvents();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    // Validate user is authenticated
    if (!user) {
      Alert.alert('Error', 'You must be logged in to view QR codes');
      router.back();
      return;
    }

    // Validate eventId exists
    if (!eventId) {
      Alert.alert('Error', 'Invalid event ID');
      router.back();
      return;
    }

    // Check if user has RSVP'd for this event
    if (!isUserRSVPd(eventId)) {
      Alert.alert(
        'RSVP Required',
        'You must RSVP for this event before generating a QR code',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }

    // Find the event in myEvents (works offline with cached data)
    const foundEvent = myEvents.find((e) => e.id === eventId);
    
    if (!foundEvent) {
      Alert.alert('Error', 'Event not found');
      router.back();
      return;
    }

    setEvent(foundEvent);
    setLoading(false);
  }, [eventId, user, myEvents, isUserRSVPd, router]);

  const handleClose = () => {
    router.back();
  };

  if (loading || !event || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Generating QR code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Check-in</Text>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.content}>
        <QRCodeDisplay
          userId={user.uid}
          eventId={event.id}
          eventTitle={event.title}
          size={250}
        />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>
              {event.date.toDate().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.detailText}>
              {event.date.toDate().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{event.location}</Text>
          </View>
        </View>

        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            ✓ Works offline
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  detailsContainer: {
    marginTop: 32,
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  detailText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  offlineIndicator: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '500',
  },
});

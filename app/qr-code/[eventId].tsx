import { QRCodeDisplay } from '@/components/qr-code-display';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useAuth } from '@/hooks/use-auth';
import { useEvents } from '@/hooks/use-events';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  const { colors, theme } = useTheme();
  const { myEvents, isUserRSVPd } = useEvents();

  // Create themed styles
  const themedStyles = useMemo(() => ({
    container: { ...styles.container, backgroundColor: colors.backgroundSecondary },
    loadingContainer: { ...styles.loadingContainer, backgroundColor: colors.backgroundSecondary },
    loadingText: { ...styles.loadingText, color: colors.textSecondary },
    header: { 
      ...styles.header, 
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...styles.headerTitle, color: colors.text },
    detailsContainer: { 
      ...styles.detailsContainer, 
      backgroundColor: colors.surface,
      ...theme.shadows.md,
    },
    detailText: { ...styles.detailText, color: colors.text },
    offlineIndicator: { ...styles.offlineIndicator, backgroundColor: colors.successLight },
    offlineText: { ...styles.offlineText, color: colors.success },
  }), [colors, theme]);
  
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
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.loadingText}>Generating QR code...</Text>
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={themedStyles.headerTitle}>Event Check-in</Text>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.content}>
        <QRCodeDisplay
          userId={user.uid}
          eventId={event.id}
          eventTitle={event.title}
          size={250}
        />

        <View style={themedStyles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <IconSymbol name="calendar" size={16} color={colors.textSecondary} />
            </View>
            <Text style={themedStyles.detailText}>
              {event.date.toDate().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <IconSymbol name="clock.fill" size={16} color={colors.textSecondary} />
            </View>
            <Text style={themedStyles.detailText}>
              {event.date.toDate().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <IconSymbol name="location.fill" size={16} color={colors.textSecondary} />
            </View>
            <Text style={themedStyles.detailText}>{event.location}</Text>
          </View>
        </View>

        <View style={themedStyles.offlineIndicator}>
          <View style={styles.offlineContent}>
            <IconSymbol name="checkmark" size={14} color={colors.success} />
            <Text style={themedStyles.offlineText}>Works offline</Text>
          </View>
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
  detailIconContainer: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 13,
    color: '#065f46',
    fontWeight: '500',
    marginLeft: 6,
  },
});

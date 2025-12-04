import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useAuth } from '@/hooks/use-auth';
import { useEvents } from '@/hooks/use-events';
import { Event } from '@/types/models';
import { useLocalSearchParams } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const { getEventById, rsvpForEvent, cancelRSVP, isUserRSVPd } = useEvents();

  // Create themed styles
  const themedStyles = useMemo(() => ({
    container: { ...styles.container, backgroundColor: colors.backgroundSecondary },
    loadingContainer: { ...styles.loadingContainer, backgroundColor: colors.backgroundSecondary },
    loadingText: { ...styles.loadingText, color: colors.textSecondary },
    errorContainer: { ...styles.errorContainer, backgroundColor: colors.backgroundSecondary },
    errorTitle: { ...styles.errorTitle, color: colors.text },
    errorText: { ...styles.errorText, color: colors.textSecondary },
    titleSection: { 
      ...styles.titleSection, 
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    title: { ...styles.title, color: colors.text },
    section: { ...styles.section, backgroundColor: colors.surface },
    sectionTitle: { ...styles.sectionTitle, color: colors.text },
    iconContainer: { ...styles.iconContainer, backgroundColor: colors.primaryLight },
    infoLabel: { ...styles.infoLabel, color: colors.textSecondary },
    infoValue: { ...styles.infoValue, color: colors.text },
    description: { ...styles.description, color: colors.textSecondary },
    statBox: { ...styles.statBox, backgroundColor: colors.backgroundTertiary },
    statValue: { ...styles.statValue, color: colors.primary },
    statLabel: { ...styles.statLabel, color: colors.textSecondary },
    rsvpButtonInactive: { backgroundColor: colors.primary },
    rsvpButtonActive: { backgroundColor: colors.error },
    organizerBadge: {
      ...styles.organizerBadge,
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
    },
  }), [colors, theme]);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Event ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const eventData = await getEventById(id);
        setEvent(eventData);
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, getEventById]);

  const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  const formatTime = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };


  const isRSVPd = id ? isUserRSVPd(id) : false;
  
  // Checking if current user is the event creator (organizers shouldn't RSVP to their own events)
  const isEventCreator = user && event && event.createdBy === user.uid;

  const handleRSVPPress = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to RSVP for events.');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Event ID is missing.');
      return;
    }

    try {
      setRsvpLoading(true);
      
      if (isRSVPd) {
        await cancelRSVP(id);
        Alert.alert('RSVP Cancelled', 'You have cancelled your RSVP for this event.');
      } else {
        await rsvpForEvent(id);
        Alert.alert('RSVP Confirmed', 'You have successfully RSVP\'d for this event!');
      }

      // Refresh event data to show updated RSVP count
      const updatedEvent = await getEventById(id);
      setEvent(updatedEvent);
    } catch (err: any) {
      console.error('Error handling RSVP:', err);
      Alert.alert('Error', err.message || 'Failed to update RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

 
  if (error || !event) {
    return (
      <View style={themedStyles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={64} color={colors.warning} />
        </View>
        <Text style={themedStyles.errorTitle}>Unable to Load Event</Text>
        <Text style={themedStyles.errorText}>
          {error || 'Event not found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={themedStyles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={themedStyles.titleSection}>
          <Text style={themedStyles.title}>{event.title}</Text>
        </View>

        <View style={themedStyles.section}>
          <View style={styles.infoRow}>
            <View style={themedStyles.iconContainer}>
              <IconSymbol name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={themedStyles.infoLabel}>Date</Text>
              <Text style={themedStyles.infoValue}>{formatDate(event.date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={themedStyles.iconContainer}>
              <IconSymbol name="clock.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={themedStyles.infoLabel}>Time</Text>
              <Text style={themedStyles.infoValue}>{formatTime(event.date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={themedStyles.iconContainer}>
              <IconSymbol name="location.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={themedStyles.infoLabel}>Location</Text>
              <Text style={themedStyles.infoValue}>{event.location}</Text>
            </View>
          </View>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>About This Event</Text>
          <Text style={themedStyles.description}>{event.description}</Text>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Attendance</Text>
          <View style={styles.statsContainer}>
            <View style={themedStyles.statBox}>
              <Text style={themedStyles.statValue}>{event.rsvps.length}</Text>
              <Text style={themedStyles.statLabel}>
                {event.rsvps.length === 1 ? 'RSVP' : 'RSVPs'}
              </Text>
            </View>
            <View style={themedStyles.statBox}>
              <Text style={themedStyles.statValue}>{event.checkedIn.length}</Text>
              <Text style={themedStyles.statLabel}>Checked In</Text>
            </View>
          </View>
        </View>

        {/* Hide RSVP button for event creators - they're the organizer, not an attendee */}
        {!isEventCreator && (
          <View style={themedStyles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.rsvpButton,
                isRSVPd ? themedStyles.rsvpButtonActive : themedStyles.rsvpButtonInactive,
                pressed && styles.rsvpButtonPressed,
                rsvpLoading && styles.rsvpButtonDisabled,
              ]}
              onPress={handleRSVPPress}
              disabled={rsvpLoading}
            >
              {rsvpLoading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <View style={styles.rsvpButtonIconContainer}>
                    <IconSymbol 
                      name={isRSVPd ? 'checkmark' : 'calendar'} 
                      size={20} 
                      color={colors.onPrimary} 
                    />
                  </View>
                  <Text style={[styles.rsvpButtonText, { color: colors.onPrimary }]}>
                    {isRSVPd ? 'Cancel RSVP' : 'RSVP for Event'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
        
        {/* Show organizer badge for event creators */}
        {isEventCreator && (
          <View style={themedStyles.section}>
            <View style={themedStyles.organizerBadge}>
              <View style={styles.organizerIconContainer}>
                <IconSymbol name="crown.fill" size={20} color="#92400e" />
              </View>
              <Text style={styles.organizerText}>You are organizing this event</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingBottom: 32,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f9fafb',
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  titleSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 36,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
  },
  rsvpButtonInactive: {
    backgroundColor: '#2563eb',
  },
  rsvpButtonActive: {
    backgroundColor: '#dc2626',
  },
  rsvpButtonPressed: {
    opacity: 0.8,
  },
  rsvpButtonDisabled: {
    opacity: 0.6,
  },
  rsvpButtonIconContainer: {
    marginRight: 8,
  },
  rsvpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  organizerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  organizerIconContainer: {
    marginRight: 8,
  },
  organizerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
});

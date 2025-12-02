import { Event } from '@/types/models';
import { isEventPast } from '@/utils/event.utils';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface EventCardProps {
  event: Event;
  onPress: () => void;
  showPastIndicator?: boolean;
  showAttendanceSummary?: boolean;
}


export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onPress,
  showPastIndicator = false,
  showAttendanceSummary = false,
}) => {
  const isPast = isEventPast(event.date);
  
  const formatDateTime = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} • ${timeStr}`;
  };

  const getAttendanceSummary = (): string => {
    const attended = event.checkedIn.length;
    const rsvps = event.rsvps.length;
    return `${attended}/${rsvps} attended`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        showPastIndicator && isPast && styles.cardPast,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.content,
        showPastIndicator && isPast && styles.contentPast,
      ]}>
        <View style={styles.titleRow}>
          <Text 
            style={[
              styles.title,
              showPastIndicator && isPast && styles.titlePast,
            ]} 
            numberOfLines={2}
          >
            {event.title}
          </Text>
          {showPastIndicator && isPast && (
            <View style={styles.pastBadge}>
              <Text style={styles.pastBadgeText}>Ended</Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.icon}>📅</Text>
            <Text style={[
              styles.detailText,
              showPastIndicator && isPast && styles.detailTextPast,
            ]}>
              {formatDateTime(event.date)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.icon}>📍</Text>
            <Text 
              style={[
                styles.detailText,
                showPastIndicator && isPast && styles.detailTextPast,
              ]} 
              numberOfLines={1}
            >
              {event.location}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {showPastIndicator && isPast && showAttendanceSummary ? (
            <View style={styles.attendanceBadge}>
              <Text style={styles.attendanceText}>
                {getAttendanceSummary()}
              </Text>
            </View>
          ) : (
            <View style={styles.rsvpBadge}>
              <Text style={styles.rsvpText}>
                {event.rsvps.length} {event.rsvps.length === 1 ? 'RSVP' : 'RSVPs'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPast: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    opacity: 0.8,
  },
  content: {
    padding: 16,
  },
  contentPast: {
    opacity: 0.9,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 24,
    flex: 1,
    marginRight: 8,
  },
  titlePast: {
    color: '#6b7280',
  },
  pastBadge: {
    backgroundColor: '#9ca3af',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pastBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  detailTextPast: {
    color: '#9ca3af',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rsvpBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  attendanceBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});

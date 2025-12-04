import { useTheme } from '@/contexts/theme.context';
import { Event } from '@/types/models';
import { isEventPast } from '@/utils/event.utils';
import { Timestamp } from 'firebase/firestore';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';


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
  const { colors, theme } = useTheme();
  const isPast = isEventPast(event.date);

  // Create themed styles
  const themedStyles = useMemo(() => ({
    card: {
      ...styles.card,
      backgroundColor: colors.cardBackground,
      ...theme.shadows.md,
    },
    cardPast: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      opacity: 0.8,
    },
    title: {
      ...styles.title,
      color: colors.text,
    },
    titlePast: {
      color: colors.textSecondary,
    },
    detailText: {
      ...styles.detailText,
      color: colors.textSecondary,
    },
    detailTextPast: {
      color: colors.textTertiary,
    },
    rsvpBadge: {
      ...styles.rsvpBadge,
      backgroundColor: colors.primaryLight,
    },
    rsvpText: {
      ...styles.rsvpText,
      color: colors.primary,
    },
    attendanceBadge: {
      ...styles.attendanceBadge,
      backgroundColor: colors.backgroundTertiary,
    },
    attendanceText: {
      ...styles.attendanceText,
      color: colors.textSecondary,
    },
    pastBadge: {
      ...styles.pastBadge,
      backgroundColor: colors.textTertiary,
    },
  }), [colors, theme]);
  
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
        themedStyles.card,
        showPastIndicator && isPast && themedStyles.cardPast,
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
              themedStyles.title,
              showPastIndicator && isPast && themedStyles.titlePast,
            ]} 
            numberOfLines={2}
          >
            {event.title}
          </Text>
          {showPastIndicator && isPast && (
            <View style={themedStyles.pastBadge}>
              <Text style={styles.pastBadgeText}>Ended</Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <IconSymbol 
                name="calendar" 
                size={16} 
                color={showPastIndicator && isPast ? colors.textTertiary : colors.textSecondary} 
              />
            </View>
            <Text style={[
              themedStyles.detailText,
              showPastIndicator && isPast && themedStyles.detailTextPast,
            ]}>
              {formatDateTime(event.date)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <IconSymbol 
                name="location.fill" 
                size={16} 
                color={showPastIndicator && isPast ? colors.textTertiary : colors.textSecondary} 
              />
            </View>
            <Text 
              style={[
                themedStyles.detailText,
                showPastIndicator && isPast && themedStyles.detailTextPast,
              ]} 
              numberOfLines={1}
            >
              {event.location}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {showPastIndicator && isPast && showAttendanceSummary ? (
            <View style={themedStyles.attendanceBadge}>
              <Text style={themedStyles.attendanceText}>
                {getAttendanceSummary()}
              </Text>
            </View>
          ) : (
            <View style={themedStyles.rsvpBadge}>
              <Text style={themedStyles.rsvpText}>
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
  iconContainer: {
    width: 20,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
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

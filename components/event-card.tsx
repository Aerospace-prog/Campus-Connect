import { useTheme } from '@/contexts/theme.context';
import { Event } from '@/types/models';
import { isEventPast } from '@/utils/event.utils';
import * as Haptics from 'expo-haptics';
import { Timestamp } from 'firebase/firestore';
import React, { useCallback, useMemo, useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Create themed styles
  const themedStyles = useMemo(
    () => ({
      card: {
        ...styles.card,
        backgroundColor: colors.cardBackground,
        ...theme.shadows.md,
      },
      cardPast: {
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
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
      iconContainer: {
        ...styles.iconContainer,
        backgroundColor: colors.backgroundTertiary,
      },
    }),
    [colors, theme]
  );

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

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          themedStyles.card,
          showPastIndicator && isPast && themedStyles.cardPast,
          {
            transform: [{ scale: scaleAnim }],
            opacity: showPastIndicator && isPast ? 0.85 : 1,
          },
        ]}
      >
        <View
          style={[styles.content, showPastIndicator && isPast && styles.contentPast]}
        >
          {/* Accent bar */}
          <View
            style={[
              styles.accentBar,
              {
                backgroundColor:
                  showPastIndicator && isPast
                    ? colors.textTertiary
                    : colors.primary,
              },
            ]}
          />

          <View style={styles.mainContent}>
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
                <View
                  style={[
                    themedStyles.iconContainer,
                    showPastIndicator && isPast && { opacity: 0.7 },
                  ]}
                >
                  <IconSymbol
                    name="calendar"
                    size={14}
                    color={
                      showPastIndicator && isPast
                        ? colors.textTertiary
                        : colors.primary
                    }
                  />
                </View>
                <Text
                  style={[
                    themedStyles.detailText,
                    showPastIndicator && isPast && themedStyles.detailTextPast,
                  ]}
                >
                  {formatDateTime(event.date)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View
                  style={[
                    themedStyles.iconContainer,
                    showPastIndicator && isPast && { opacity: 0.7 },
                  ]}
                >
                  <IconSymbol
                    name="location.fill"
                    size={14}
                    color={
                      showPastIndicator && isPast
                        ? colors.textTertiary
                        : colors.secondary
                    }
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
                  <IconSymbol
                    name="person.2.fill"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={themedStyles.attendanceText}>
                    {getAttendanceSummary()}
                  </Text>
                </View>
              ) : (
                <View style={themedStyles.rsvpBadge}>
                  <IconSymbol
                    name="person.fill"
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={themedStyles.rsvpText}>
                    {event.rsvps.length} {event.rsvps.length === 1 ? 'RSVP' : 'RSVPs'}
                  </Text>
                </View>
              )}

              <View style={styles.arrowContainer}>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
  },
  contentPast: {
    opacity: 0.9,
  },
  accentBar: {
    width: 4,
    backgroundColor: '#6366f1',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 22,
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  pastBadge: {
    backgroundColor: '#9ca3af',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pastBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    marginBottom: 14,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  rsvpText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  attendanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  attendanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

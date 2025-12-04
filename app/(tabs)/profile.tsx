import { AnimatedCounter, FadeInView } from '@/components/animated-components';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth.context';
import { useEvents } from '@/contexts/events.context';
import { useTheme } from '@/contexts/theme.context';
import { useRole } from '@/hooks/use-role';
import { EventService } from '@/services/event.service';
import { Event } from '@/types/models';
import { isEventPast } from '@/utils/event.utils';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  gradientColors: [string, string];
  delay?: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradientColors,
  delay = 0,
}: StatCardProps) {
  const { colors, theme } = useTheme();

  return (
    <FadeInView delay={delay} direction="up" distance={15}>
      <View style={[styles.statCard, { backgroundColor: colors.cardBackground }, theme.shadows.sm]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statIconContainer}
        >
          <IconSymbol name={icon as any} size={20} color="#fff" />
        </LinearGradient>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </FadeInView>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isAdmin, isStudent, loading: roleLoading } = useRole();
  const { events, myEvents } = useEvents();
  const { colors, theme, isDark } = useTheme();
  const [adminEvents, setAdminEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const signOutScale = useRef(new Animated.Value(1)).current;
  const notificationScale = useRef(new Animated.Value(1)).current;
  const refreshNotifScale = useRef(new Animated.Value(1)).current;

  const themedStyles = useMemo(
    () => ({
      container: { ...styles.container, backgroundColor: colors.backgroundSecondary },
      loadingContainer: { ...styles.loadingContainer, backgroundColor: colors.backgroundSecondary },
      userName: { ...styles.userName, color: '#fff' },
      userEmail: { ...styles.userEmail, color: 'rgba(255,255,255,0.8)' },
      sectionTitle: { ...styles.sectionTitle, color: colors.text },
      statsLoadingText: { ...styles.statsLoadingText, color: colors.textSecondary },
      appInfoText: { ...styles.appInfoText, color: colors.textTertiary },
    }),
    [colors]
  );

  useFocusEffect(
    useCallback(() => {
      if (isAdmin && user) {
        fetchAdminData();
      }
    }, [isAdmin, user])
  );

  const fetchAdminData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const createdEvents = await EventService.getEventsByCreator(user.uid);
      setAdminEvents(createdEvents);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isAdmin && user) {
      await fetchAdminData();
    }
    setRefreshing(false);
  }, [isAdmin, user]);

  const studentStats = useMemo(() => {
    if (!isStudent) return null;

    const rsvpCount = myEvents.length;
    const upcomingEvents = myEvents.filter((e) => !isEventPast(e.date)).length;
    const eventsAttended = events.filter(
      (e) => user && e.checkedIn.includes(user.uid)
    ).length;

    return { rsvpCount, upcomingEvents, eventsAttended };
  }, [isStudent, myEvents, events, user]);

  const adminStats = useMemo(() => {
    if (!isAdmin) return null;

    const eventsCreated = adminEvents.length;
    const upcomingEvents = adminEvents.filter((e) => !isEventPast(e.date)).length;
    const totalRsvps = adminEvents.reduce((sum, e) => sum + e.rsvps.length, 0);
    const totalCheckIns = adminEvents.reduce((sum, e) => sum + e.checkedIn.length, 0);

    const pastEventsWithRsvps = adminEvents.filter(
      (e) => isEventPast(e.date) && e.rsvps.length > 0
    );
    const attendanceRate =
      pastEventsWithRsvps.length > 0
        ? Math.round(
            (pastEventsWithRsvps.reduce((sum, e) => sum + e.checkedIn.length, 0) /
              pastEventsWithRsvps.reduce((sum, e) => sum + e.rsvps.length, 0)) *
              100
          )
        : 0;

    return { eventsCreated, upcomingEvents, totalRsvps, totalCheckIns, attendanceRate };
  }, [isAdmin, adminEvents]);

  const handleSignOut = async () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSendNotification = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/send-notification' as any);
  };

  const handleRefreshNotifications = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to refresh notifications');
      return;
    }

    try {
      const pushToken = await NotificationService.registerForPushNotifications();
      
      if (pushToken) {
        await NotificationService.storePushToken(user.uid, pushToken);
        console.log('Push token refreshed:', pushToken);
        Alert.alert(
          'Success', 
          'Push notifications enabled! You will now receive event notifications.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Notifications Unavailable',
          'Push notifications could not be enabled. This may be because:\n\n' +
          '• You denied notification permissions\n' +
          '• You are using Expo Go (use a development build instead)\n' +
          '• The app is not properly configured for push notifications',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error refreshing push token:', error);
      Alert.alert('Error', 'Failed to refresh notifications. Please try again.');
    }
  };

  const animateButton = (anim: Animated.Value, pressed: boolean) => {
    Animated.spring(anim, {
      toValue: pressed ? 0.97 : 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  if (roleLoading) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={themedStyles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <LinearGradient
        colors={
          isAdmin
            ? isDark
              ? ['#047857', '#10b981']
              : ['#10b981', '#34d399']
            : isDark
            ? ['#4338ca', '#6366f1']
            : ['#6366f1', '#8b5cf6']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeader}
      >
        <View style={styles.headerDecoration}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
        </View>

        <FadeInView delay={100} direction="up">
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={200} direction="up">
          <Text style={themedStyles.userName}>{user?.name || 'User'}</Text>
        </FadeInView>

        <FadeInView delay={250} direction="up">
          <Text style={themedStyles.userEmail}>{user?.email || ''}</Text>
        </FadeInView>

        <FadeInView delay={300} direction="up">
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: 'rgba(255,255,255,0.2)' },
            ]}
          >
            <IconSymbol
              name={isAdmin ? 'star.fill' : 'person.fill'}
              size={14}
              color="#fff"
            />
            <Text style={styles.roleBadgeText}>
              {isAdmin ? 'Event Organizer' : 'Student'}
            </Text>
          </View>
        </FadeInView>
      </LinearGradient>

      {/* Statistics Section */}
      <View style={styles.statsSection}>
        <Text style={themedStyles.sectionTitle}>
          {isAdmin ? 'Your Event Statistics' : 'Your Activity'}
        </Text>

        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={themedStyles.statsLoadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {isStudent && studentStats && (
              <>
                <StatCard
                  title="Events RSVP'd"
                  value={studentStats.rsvpCount}
                  subtitle="Total RSVPs"
                  icon="ticket.fill"
                  gradientColors={['#6366f1', '#8b5cf6']}
                  delay={100}
                />
                <StatCard
                  title="Upcoming"
                  value={studentStats.upcomingEvents}
                  subtitle="On your calendar"
                  icon="calendar"
                  gradientColors={['#10b981', '#34d399']}
                  delay={150}
                />
                <StatCard
                  title="Attended"
                  value={studentStats.eventsAttended}
                  subtitle="Checked in"
                  icon="checkmark.circle.fill"
                  gradientColors={['#f59e0b', '#fbbf24']}
                  delay={200}
                />
              </>
            )}

            {isAdmin && adminStats && (
              <>
                <StatCard
                  title="Events Created"
                  value={adminStats.eventsCreated}
                  subtitle={`${adminStats.upcomingEvents} upcoming`}
                  icon="square.grid.2x2"
                  gradientColors={['#6366f1', '#8b5cf6']}
                  delay={100}
                />
                <StatCard
                  title="Total RSVPs"
                  value={adminStats.totalRsvps}
                  subtitle="Across all events"
                  icon="person.2.fill"
                  gradientColors={['#10b981', '#34d399']}
                  delay={150}
                />
                <StatCard
                  title="Check-ins"
                  value={adminStats.totalCheckIns}
                  subtitle="Attendees verified"
                  icon="checkmark.circle.fill"
                  gradientColors={['#f59e0b', '#fbbf24']}
                  delay={200}
                />
                <StatCard
                  title="Attendance"
                  value={`${adminStats.attendanceRate}%`}
                  subtitle="For past events"
                  icon="chart.bar.fill"
                  gradientColors={['#8b5cf6', '#ec4899']}
                  delay={250}
                />
              </>
            )}
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <Text style={themedStyles.sectionTitle}>Actions</Text>

        {isAdmin && (
          <FadeInView delay={300} direction="up">
            <Pressable
              onPressIn={() => animateButton(notificationScale, true)}
              onPressOut={() => animateButton(notificationScale, false)}
              onPress={handleSendNotification}
            >
              <Animated.View style={{ transform: [{ scale: notificationScale }] }}>
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.actionButton, theme.shadows.md]}
                >
                  <IconSymbol name="bell.fill" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Send Notification</Text>
                  <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </FadeInView>
        )}

        <FadeInView delay={350} direction="up">
          <Pressable
            onPressIn={() => animateButton(refreshNotifScale, true)}
            onPressOut={() => animateButton(refreshNotifScale, false)}
            onPress={handleRefreshNotifications}
          >
            <Animated.View style={{ transform: [{ scale: refreshNotifScale }] }}>
              <View
                style={[
                  styles.refreshNotifButton,
                  { backgroundColor: colors.cardBackground },
                  theme.shadows.sm,
                ]}
              >
                <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
                <Text style={[styles.refreshNotifButtonText, { color: colors.text }]}>
                  Refresh Notifications
                </Text>
                <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
              </View>
            </Animated.View>
          </Pressable>
        </FadeInView>

        <FadeInView delay={400} direction="up">
          <Pressable
            onPressIn={() => animateButton(signOutScale, true)}
            onPressOut={() => animateButton(signOutScale, false)}
            onPress={handleSignOut}
          >
            <Animated.View style={{ transform: [{ scale: signOutScale }] }}>
              <View
                style={[
                  styles.signOutButton,
                  { backgroundColor: colors.errorLight },
                  theme.shadows.sm,
                ]}
              >
                <IconSymbol name="arrow.right.square" size={20} color={colors.error} />
                <Text style={[styles.signOutButtonText, { color: colors.error }]}>
                  Sign Out
                </Text>
              </View>
            </Animated.View>
          </Pressable>
        </FadeInView>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={themedStyles.appInfoText}>CampusConnect v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -80,
    right: -60,
  },
  decorCircle2: {
    width: 120,
    height: 120,
    bottom: -40,
    left: -30,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  statsLoadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshNotifButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  refreshNotifButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

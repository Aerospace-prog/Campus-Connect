import { useAuth } from '@/contexts/auth.context';
import { useEvents } from '@/contexts/events.context';
import { useRole } from '@/hooks/use-role';
import { EventService } from '@/services/event.service';
import { Event } from '@/types/models';
import { isEventPast } from '@/utils/event.utils';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

/**
 * Statistics card component for displaying profile stats
 */
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, color = '#6366f1' }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

/**
 * ProfileScreen - Displays user profile with role-specific statistics
 * Requirements: 1.2, 8.2
 */
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isAdmin, isStudent, loading: roleLoading } = useRole();
  const { events, myEvents } = useEvents();
  const [adminEvents, setAdminEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch admin-specific data when screen comes into focus
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

  // Student statistics
  const studentStats = useMemo(() => {
    if (!isStudent) return null;

    const rsvpCount = myEvents.length;
    const upcomingEvents = myEvents.filter(e => !isEventPast(e.date)).length;
    
    // Count events where user has checked in
    const eventsAttended = events.filter(
      e => user && e.checkedIn.includes(user.uid)
    ).length;

    return {
      rsvpCount,
      upcomingEvents,
      eventsAttended,
    };
  }, [isStudent, myEvents, events, user]);

  // Admin statistics
  const adminStats = useMemo(() => {
    if (!isAdmin) return null;

    const eventsCreated = adminEvents.length;
    const upcomingEvents = adminEvents.filter(e => !isEventPast(e.date)).length;
    const pastEvents = adminEvents.filter(e => isEventPast(e.date)).length;
    
    // Total RSVPs across all admin's events
    const totalRsvps = adminEvents.reduce((sum, e) => sum + e.rsvps.length, 0);
    
    // Total check-ins across all admin's events
    const totalCheckIns = adminEvents.reduce((sum, e) => sum + e.checkedIn.length, 0);
    
    // Calculate attendance rate for past events
    const pastEventsWithRsvps = adminEvents.filter(
      e => isEventPast(e.date) && e.rsvps.length > 0
    );
    const attendanceRate = pastEventsWithRsvps.length > 0
      ? Math.round(
          (pastEventsWithRsvps.reduce((sum, e) => sum + e.checkedIn.length, 0) /
           pastEventsWithRsvps.reduce((sum, e) => sum + e.rsvps.length, 0)) * 100
        )
      : 0;

    return {
      eventsCreated,
      upcomingEvents,
      pastEvents,
      totalRsvps,
      totalCheckIns,
      attendanceRate,
    };
  }, [isAdmin, adminEvents]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSendNotification = () => {
    router.push('/send-notification' as any);
  };

  // Show loading while checking role
  if (roleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6366f1"
          colors={['#6366f1']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        
        {/* Admin badge - only shown for admin users (Requirements 8.2, 8.5) */}
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Event Organizer</Text>
          </View>
        )}
        
        {/* Student badge */}
        {isStudent && (
          <View style={styles.studentBadge}>
            <Text style={styles.studentBadgeText}>Student</Text>
          </View>
        )}
      </View>

      {/* Statistics Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>
          {isAdmin ? 'Your Event Statistics' : 'Your Activity'}
        </Text>
        
        {loading ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.statsLoadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {/* Student Statistics */}
            {isStudent && studentStats && (
              <>
                <StatCard
                  title="Events RSVP'd"
                  value={studentStats.rsvpCount}
                  subtitle="Total RSVPs"
                  color="#6366f1"
                />
                <StatCard
                  title="Upcoming Events"
                  value={studentStats.upcomingEvents}
                  subtitle="On your calendar"
                  color="#10b981"
                />
                <StatCard
                  title="Events Attended"
                  value={studentStats.eventsAttended}
                  subtitle="Checked in"
                  color="#f59e0b"
                />
              </>
            )}

            {/* Admin Statistics */}
            {isAdmin && adminStats && (
              <>
                <StatCard
                  title="Events Created"
                  value={adminStats.eventsCreated}
                  subtitle={`${adminStats.upcomingEvents} upcoming`}
                  color="#6366f1"
                />
                <StatCard
                  title="Total RSVPs"
                  value={adminStats.totalRsvps}
                  subtitle="Across all events"
                  color="#10b981"
                />
                <StatCard
                  title="Total Check-ins"
                  value={adminStats.totalCheckIns}
                  subtitle="Attendees verified"
                  color="#f59e0b"
                />
                <StatCard
                  title="Attendance Rate"
                  value={`${adminStats.attendanceRate}%`}
                  subtitle="For past events"
                  color="#8b5cf6"
                />
              </>
            )}
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        {/* Send Notification button - only for admins (Requirements 6.1, 6.2) */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleSendNotification}
          >
            <Text style={styles.notificationButtonText}>Send Notification</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>CampusConnect v1.0</Text>
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
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  adminBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  studentBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  studentBadgeText: {
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
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
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  notificationButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  signOutButtonText: {
    color: '#fff',
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

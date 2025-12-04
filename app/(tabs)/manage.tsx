import { EventCard } from '@/components/event-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { useRole } from '@/hooks/use-role';
import { EventService } from '@/services/event.service';
import { Event } from '@/types/models';
import {
  EventFilter,
  filterEventsByStatus,
  isEventPast,
  sortEventsByStatus
} from '@/utils/event.utils';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * ManageTab - Admin event management hub
 */
export default function ManageTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const { isAdmin, loading: roleLoading } = useRole();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<EventFilter>('all');

  // Create themed styles
  const themedStyles = useMemo(() => ({
    container: { ...styles.container, backgroundColor: colors.backgroundSecondary },
    header: { 
      ...styles.header, 
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerTitle: { ...styles.headerTitle, color: colors.text },
    headerSubtitle: { ...styles.headerSubtitle, color: colors.textSecondary },
    filterContainer: {
      ...styles.filterContainer,
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    filterButton: { ...styles.filterButton, backgroundColor: colors.backgroundTertiary },
    filterButtonActive: { backgroundColor: colors.primary },
    filterText: { ...styles.filterText, color: colors.textSecondary },
    filterTextActive: { color: colors.onPrimary },
    cardActions: { ...styles.cardActions, backgroundColor: colors.backgroundTertiary },
    cardActionsPast: { backgroundColor: colors.border },
    statsText: { ...styles.statsText, color: colors.textSecondary },
    statsTextPast: { ...styles.statsTextPast, color: colors.textTertiary },
    loadingContainer: { ...styles.loadingContainer, backgroundColor: colors.backgroundSecondary },
    loadingText: { ...styles.loadingText, color: colors.textSecondary },
    emptyTitle: { ...styles.emptyTitle, color: colors.text },
    emptyText: { ...styles.emptyText, color: colors.textSecondary },
    createButton: { ...styles.createButton, backgroundColor: colors.primary },
    fab: { ...styles.fab, backgroundColor: colors.primary, ...theme.shadows.lg },
  }), [colors, theme]);

  // Fallback guard: redirect non-admins who attempt direct URL access
  useEffect(() => {
    if (roleLoading) return;
    
    if (!isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [isAdmin, roleLoading, router]);

  const fetchMyEvents = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch events created by current admin (Requirement 7.4)
      const myEvents = await EventService.getEventsByCreator(user.uid);
      setEvents(myEvents);
    } catch (error) {
      console.error('Error fetching admin events:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh events when screen comes into focus (after returning from modals)
  useFocusEffect(
    useCallback(() => {
      fetchMyEvents();
    }, [fetchMyEvents])
  );

  // Filter and sort events based on current filter
  const displayedEvents = useMemo(() => {
    const filtered = filterEventsByStatus(events, filter);
    return sortEventsByStatus(filtered);
  }, [events, filter]);

  // Count events by status for filter labels
  const eventCounts = useMemo(() => {
    const upcoming = events.filter(e => !isEventPast(e.date)).length;
    const past = events.filter(e => isEventPast(e.date)).length;
    return { all: events.length, upcoming, past };
  }, [events]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyEvents();
    setRefreshing(false);
  }, [fetchMyEvents]);

  const handleEventPress = (eventId: string) => {
    // Navigate to modal edit screen 
    router.push(`/edit-event?id=${eventId}` as any);
  };

  const handleCreateEvent = () => {
    // Navigate to modal create screen
    router.push('/create-event' as any);
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await EventService.deleteEvent(eventId);
              // Refresh the list after deletion
              fetchMyEvents();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const renderFilterToggle = () => (
    <View style={themedStyles.filterContainer}>
      <TouchableOpacity
        style={[themedStyles.filterButton, filter === 'all' && themedStyles.filterButtonActive]}
        onPress={() => setFilter('all')}
      >
        <Text style={[themedStyles.filterText, filter === 'all' && themedStyles.filterTextActive]}>
          All ({eventCounts.all})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[themedStyles.filterButton, filter === 'upcoming' && themedStyles.filterButtonActive]}
        onPress={() => setFilter('upcoming')}
      >
        <Text style={[themedStyles.filterText, filter === 'upcoming' && themedStyles.filterTextActive]}>
          Upcoming ({eventCounts.upcoming})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[themedStyles.filterButton, filter === 'past' && themedStyles.filterButtonActive]}
        onPress={() => setFilter('past')}
      >
        <Text style={[themedStyles.filterText, filter === 'past' && themedStyles.filterTextActive]}>
          Past ({eventCounts.past})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEventCard = ({ item }: { item: Event }) => {
    const isPast = isEventPast(item.date);
    
    return (
      <View style={styles.cardContainer}>
        <EventCard
          event={item}
          onPress={() => handleEventPress(item.id)}
          showPastIndicator={true}
          showAttendanceSummary={true}
        />
        <View style={[themedStyles.cardActions, isPast && themedStyles.cardActionsPast]}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => handleEventPress(item.id)}
            >
              <View style={styles.buttonContent}>
                <IconSymbol name="pencil" size={14} color={colors.onPrimary} />
                <Text style={[styles.editButtonText, { color: colors.onPrimary }]}>Edit</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={() => handleDeleteEvent(item.id, item.title)}
            >
              <View style={styles.buttonContent}>
                <IconSymbol name="xmark" size={14} color={colors.onPrimary} />
                <Text style={[styles.deleteButtonText, { color: colors.onPrimary }]}>Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            {isPast ? (
              <Text style={themedStyles.statsTextPast}>
                {item.checkedIn.length}/{item.rsvps.length} attended
              </Text>
            ) : (
              <Text style={themedStyles.statsText}>
                {item.checkedIn.length}/{item.rsvps.length} checked in
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    const emptyMessage = filter === 'all' 
      ? "You haven't created any events yet. Tap the button below to create your first event."
      : filter === 'upcoming'
      ? "You don't have any upcoming events. Create a new event to get started."
      : "You don't have any past events yet.";

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <IconSymbol name="list.bullet" size={64} color={colors.textTertiary} />
        </View>
        <Text style={themedStyles.emptyTitle}>
          {filter === 'all' ? 'No Events Created' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Events`}
        </Text>
        <Text style={themedStyles.emptyText}>{emptyMessage}</Text>
        {filter !== 'past' && (
          <TouchableOpacity
            style={themedStyles.createButton}
            onPress={handleCreateEvent}
          >
            <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>Create Event</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Show loading while checking role or fetching events
  if (roleLoading || loading) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.loadingText}>Loading your events...</Text>
      </View>
    );
  }

  // Don't render if not admin (fallback for direct URL access)
  if (!isAdmin) {
    return null;
  }

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>Manage Events</Text>
        <Text style={themedStyles.headerSubtitle}>
          {events.length} event{events.length !== 1 ? 's' : ''} created
        </Text>
      </View>

      {events.length > 0 && renderFilterToggle()}

      <FlatList
        data={displayedEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          displayedEvents.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {events.length > 0 && (
        <TouchableOpacity
          style={themedStyles.fab}
          onPress={handleCreateEvent}
        >
          <Text style={[styles.fabText, { color: colors.onPrimary }]}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  cardContainer: {
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cardActionsPast: {
    backgroundColor: '#e5e7eb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsTextPast: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    marginTop: -2,
  },
});

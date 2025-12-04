import { EventCard } from '@/components/event-card';
import { SkeletonList } from '@/components/skeleton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useEvents } from '@/hooks/use-events';
import { Event } from '@/types/models';
import { useRouter } from 'expo-router';
import React, { useMemo , useCallback , useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function EventsScreen() {
  const router = useRouter();
  const { events, loading, refreshEvents } = useEvents();
  const { colors, theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Create themed styles
  const themedStyles = useMemo(() => ({
    container: {
      ...styles.container,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      ...styles.header,
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...styles.headerTitle,
      color: colors.text,
    },
    headerSubtitle: {
      ...styles.headerSubtitle,
      color: colors.textSecondary,
    },
    loadingContainer: {
      ...styles.loadingContainer,
      backgroundColor: colors.backgroundSecondary,
    },
    loadingText: {
      ...styles.loadingText,
      color: colors.textSecondary,
    },
    emptyTitle: {
      ...styles.emptyTitle,
      color: colors.text,
    },
    emptyText: {
      ...styles.emptyText,
      color: colors.textSecondary,
    },
  }), [colors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshEvents();
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents]);


  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item.id)}
    />
  );

  
  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <IconSymbol name="calendar" size={64} color={colors.textTertiary} />
        </View>
        <Text style={themedStyles.emptyTitle}>No Events Available</Text>
        <Text style={themedStyles.emptyText}>
          Check back later for upcoming campus events
        </Text>
      </View>
    );
  };

  if (loading && events.length === 0) {
    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.header}>
          <Text style={themedStyles.headerTitle}>Campus Events</Text>
          <Text style={themedStyles.headerSubtitle}>
            Discover upcoming activities
          </Text>
        </View>
        <SkeletonList count={4} type="event" style={styles.skeletonList} />
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>Campus Events</Text>
        <Text style={themedStyles.headerSubtitle}>
          Discover upcoming activities
        </Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          events.length === 0 && styles.listContentEmpty,
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
  listContent: {
    paddingVertical: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
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
  skeletonList: {
    paddingTop: 8,
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
  },
});

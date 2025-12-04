import { FadeInView } from '@/components/animated-components';
import { EventCard } from '@/components/event-card';
import { SkeletonList } from '@/components/skeleton';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useEvents } from '@/hooks/use-events';
import { Event } from '@/types/models';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function EventsScreen() {
  const router = useRouter();
  const { events, loading, refreshEvents } = useEvents();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Create themed styles
  const themedStyles = useMemo(
    () => ({
      container: {
        ...styles.container,
        backgroundColor: colors.backgroundSecondary,
      },
      headerTitle: {
        ...styles.headerTitle,
        color: '#fff',
      },
      headerSubtitle: {
        ...styles.headerSubtitle,
        color: 'rgba(255,255,255,0.85)',
      },
      emptyTitle: {
        ...styles.emptyTitle,
        color: colors.text,
      },
      emptyText: {
        ...styles.emptyText,
        color: colors.textSecondary,
      },
      emptyIconContainer: {
        ...styles.emptyIconContainer,
        backgroundColor: colors.primaryLight,
      },
    }),
    [colors]
  );

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

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => (
    <FadeInView delay={index * 50} direction="up" distance={15}>
      <EventCard event={item} onPress={() => handleEventPress(item.id)} />
    </FadeInView>
  );

  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    return (
      <FadeInView delay={200} direction="up">
        <View style={styles.emptyContainer}>
          <View style={themedStyles.emptyIconContainer}>
            <IconSymbol name="calendar" size={48} color={colors.primary} />
          </View>
          <Text style={themedStyles.emptyTitle}>No Events Available</Text>
          <Text style={themedStyles.emptyText}>
            Check back later for upcoming campus events
          </Text>
        </View>
      </FadeInView>
    );
  };

  const renderHeader = () => (
    <LinearGradient
      colors={isDark ? ['#4338ca', '#6366f1'] : ['#6366f1', '#8b5cf6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <FadeInView delay={100} direction="down" distance={10}>
          <Text style={themedStyles.headerTitle}>Campus Events</Text>
        </FadeInView>
        <FadeInView delay={200} direction="down" distance={10}>
          <Text style={themedStyles.headerSubtitle}>
            {events.length > 0
              ? `${events.length} upcoming ${events.length === 1 ? 'event' : 'events'}`
              : 'Discover upcoming activities'}
          </Text>
        </FadeInView>
      </View>
      <View style={styles.headerDecoration}>
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
      </View>
    </LinearGradient>
  );

  if (loading && events.length === 0) {
    return (
      <View style={themedStyles.container}>
        {renderHeader()}
        <SkeletonList count={4} type="event" style={styles.skeletonList} />
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
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
            progressViewOffset={120}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 8,
  },
  headerContent: {
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
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
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    right: 60,
  },
  listContent: {
    paddingBottom: 24,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  skeletonList: {
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});

import { EventCard } from '@/components/event-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useEvents } from '@/hooks/use-events';
import { Event } from '@/types/models';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';


export default function MyEventsScreen() {
  const router = useRouter();
  const { myEvents, loading, refreshMyEvents } = useEvents();
  const { colors, theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

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
    loadingContainer: { ...styles.loadingContainer, backgroundColor: colors.backgroundSecondary },
    loadingText: { ...styles.loadingText, color: colors.textSecondary },
    emptyTitle: { ...styles.emptyTitle, color: colors.text },
    emptyText: { ...styles.emptyText, color: colors.textSecondary },
    qrButton: { 
      ...styles.qrButton, 
      backgroundColor: colors.primary,
      ...theme.shadows.md,
    },
  }), [colors, theme]);


  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMyEvents();
    } catch (error) {
      console.error('Error refreshing my events:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshMyEvents]);

  
  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const handleQRPress = (eventId: string) => {
    router.push(`/qr-code/${eventId}`);
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <View style={styles.eventCardContainer}>
      <EventCard
        event={item}
        onPress={() => handleEventPress(item.id)}
      />
      <TouchableOpacity
        style={themedStyles.qrButton}
        onPress={() => handleQRPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.qrButtonIconContainer}>
          <IconSymbol name="qrcode.viewfinder" size={18} color={colors.onPrimary} />
        </View>
        <Text style={[styles.qrButtonText, { color: colors.onPrimary }]}>Show QR Code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <IconSymbol name="ticket.fill" size={64} color={colors.textTertiary} />
        </View>
        <Text style={themedStyles.emptyTitle}>No Events Yet</Text>
        <Text style={themedStyles.emptyText}>
          RSVP to events to see them here and generate QR codes for check-in
        </Text>
      </View>
    );
  };

  if (loading && myEvents.length === 0) {
    return (
      <View style={themedStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.loadingText}>Loading your events...</Text>
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Text style={themedStyles.headerTitle}>My Events</Text>
        <Text style={themedStyles.headerSubtitle}>
          {myEvents.length} {myEvents.length === 1 ? 'event' : 'events'} RSVP&apos;d
        </Text>
      </View>

      <FlatList
        data={myEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          myEvents.length === 0 && styles.listContentEmpty,
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
  eventCardContainer: {
    marginBottom: 8,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrButtonIconContainer: {
    marginRight: 8,
  },
  qrButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

import { FadeInView } from '@/components/animated-components';
import { EventCard } from '@/components/event-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme.context';
import { useEvents } from '@/hooks/use-events';
import { Event } from '@/types/models';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function MyEventsScreen() {
  const router = useRouter();
  const { myEvents, loading, refreshMyEvents } = useEvents();
  const { colors, theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

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
      loadingContainer: {
        ...styles.loadingContainer,
        backgroundColor: colors.backgroundSecondary,
      },
      loadingText: { ...styles.loadingText, color: colors.textSecondary },
      emptyTitle: { ...styles.emptyTitle, color: colors.text },
      emptyText: { ...styles.emptyText, color: colors.textSecondary },
      emptyIconContainer: {
        ...styles.emptyIconContainer,
        backgroundColor: colors.secondaryLight,
      },
    }),
    [colors]
  );

  const onRefresh = useCallback(async () => {
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
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/qr-code/${eventId}`);
  };

  const QRButton = ({ eventId }: { eventId: string }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();
    };

    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => handleQRPress(eventId)}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={isDark ? ['#4338ca', '#6366f1'] : ['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.qrButton, theme.shadows.md]}
          >
            <View style={styles.qrButtonIconContainer}>
              <IconSymbol
                name="qrcode.viewfinder"
                size={20}
                color="#fff"
              />
            </View>
            <Text style={styles.qrButtonText}>Show QR Code</Text>
            <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  };

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => (
    <FadeInView delay={index * 60} direction="up" distance={15}>
      <View style={styles.eventCardContainer}>
        <EventCard event={item} onPress={() => handleEventPress(item.id)} />
        <QRButton eventId={item.id} />
      </View>
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
            <IconSymbol name="ticket.fill" size={48} color={colors.secondary} />
          </View>
          <Text style={themedStyles.emptyTitle}>No Events Yet</Text>
          <Text style={themedStyles.emptyText}>
            RSVP to events to see them here and generate QR codes for check-in
          </Text>
        </View>
      </FadeInView>
    );
  };

  const renderHeader = () => (
    <LinearGradient
      colors={isDark ? ['#047857', '#10b981'] : ['#10b981', '#34d399']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <FadeInView delay={100} direction="down" distance={10}>
          <Text style={themedStyles.headerTitle}>My Events</Text>
        </FadeInView>
        <FadeInView delay={200} direction="down" distance={10}>
          <Text style={themedStyles.headerSubtitle}>
            {myEvents.length} {myEvents.length === 1 ? 'event' : 'events'} RSVP&apos;d
          </Text>
        </FadeInView>
      </View>
      <View style={styles.headerDecoration}>
        <View style={[styles.decorCircle, styles.decorCircle1]} />
        <View style={[styles.decorCircle, styles.decorCircle2]} />
      </View>
    </LinearGradient>
  );

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
      <FlatList
        data={myEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          myEvents.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
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
  eventCardContainer: {
    marginBottom: 4,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: -6,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: 10,
  },
  qrButtonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

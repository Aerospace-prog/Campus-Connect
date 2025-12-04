/**
 * Skeleton Loading Component
 * 
 * Provides animated placeholder content while data is loading.
 */

import { useTheme } from '@/contexts/theme.context';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

// ============================================================================
// Types
// ============================================================================

interface SkeletonProps {
  /** Width of the skeleton (number or percentage string) */
  width?: number | string;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Whether to show animation */
  animated?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

interface SkeletonTextProps {
  /** Number of lines to show */
  lines?: number;
  /** Width of the last line (percentage) */
  lastLineWidth?: number | string;
  /** Line height */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Custom style for container */
  style?: ViewStyle;
}

interface SkeletonCardProps {
  /** Whether to show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Custom style */
  style?: ViewStyle;
}

// ============================================================================
// Base Skeleton Component
// ============================================================================

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 4,
  animated = true,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animated, animatedValue]);

  const opacity = animated
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      })
    : 0.5;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as number | `${number}%` | 'auto',
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ============================================================================
// Skeleton Text Component
// ============================================================================

export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  lineHeight = 14,
  gap = 8,
  style,
}: SkeletonTextProps) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={{ marginBottom: index < lines - 1 ? gap : 0 }}
        />
      ))}
    </View>
  );
}

// ============================================================================
// Skeleton Card Component
// ============================================================================

export function SkeletonCard({
  showImage = true,
  lines = 2,
  style,
}: SkeletonCardProps) {
  const { colors, theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          ...theme.shadows.sm,
        },
        style,
      ]}
    >
      {showImage && (
        <Skeleton
          width="100%"
          height={120}
          borderRadius={8}
          style={styles.cardImage}
        />
      )}
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={18} style={styles.cardTitle} />
        <SkeletonText lines={lines} lineHeight={12} gap={6} />
      </View>
    </View>
  );
}

// ============================================================================
// Skeleton Event Card Component
// ============================================================================

export function SkeletonEventCard() {
  const { colors, theme } = useTheme();

  return (
    <View
      style={[
        styles.eventCard,
        {
          backgroundColor: colors.cardBackground,
          ...theme.shadows.md,
        },
      ]}
    >
      <View style={styles.eventCardContent}>
        {/* Title */}
        <Skeleton width="80%" height={20} style={styles.eventTitle} />
        
        {/* Date row */}
        <View style={styles.eventDetailRow}>
          <Skeleton width={16} height={16} borderRadius={4} />
          <Skeleton width="60%" height={14} style={styles.eventDetailText} />
        </View>
        
        {/* Location row */}
        <View style={styles.eventDetailRow}>
          <Skeleton width={16} height={16} borderRadius={4} />
          <Skeleton width="50%" height={14} style={styles.eventDetailText} />
        </View>
        
        {/* RSVP badge */}
        <View style={styles.eventFooter}>
          <Skeleton width={80} height={28} borderRadius={14} />
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Skeleton List Component
// ============================================================================

interface SkeletonListProps {
  /** Number of items to show */
  count?: number;
  /** Type of skeleton item */
  type?: 'card' | 'event' | 'text';
  /** Custom style */
  style?: ViewStyle;
}

export function SkeletonList({
  count = 3,
  type = 'event',
  style,
}: SkeletonListProps) {
  const renderItem = () => {
    switch (type) {
      case 'card':
        return <SkeletonCard />;
      case 'event':
        return <SkeletonEventCard />;
      case 'text':
        return <SkeletonText />;
      default:
        return <SkeletonEventCard />;
    }
  };

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          {renderItem()}
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  textContainer: {
    width: '100%',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImage: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    marginBottom: 12,
  },
  eventCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  eventCardContent: {
    padding: 16,
  },
  eventTitle: {
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    marginLeft: 8,
  },
  eventFooter: {
    marginTop: 8,
  },
  listItem: {
    marginBottom: 0,
  },
});

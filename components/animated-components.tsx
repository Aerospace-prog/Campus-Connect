/**
 * Animated Components Library
 * 
 * Provides reusable animated components with smooth transitions,
 * spring physics, and modern UI patterns for iOS and Android.
 */

import { useTheme } from '@/contexts/theme.context';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

// ============================================================================
// Fade In View - Animates children with fade and optional slide
// ============================================================================

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  style?: ViewStyle;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 400,
  direction = 'up',
  distance = 20,
  style,
}: FadeInViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(
    direction === 'up' ? distance : direction === 'down' ? -distance : 0
  )).current;
  const translateX = useRef(new Animated.Value(
    direction === 'left' ? distance : direction === 'right' ? -distance : 0
  )).current;

  useEffect(() => {
    const animations = [
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];

    if (direction === 'up' || direction === 'down') {
      animations.push(
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    }

    if (direction === 'left' || direction === 'right') {
      animations.push(
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  }, [delay, direction, distance, duration, opacity, translateX, translateY]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Scale Pressable - Button with scale animation on press
// ============================================================================

interface ScalePressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  scale?: number;
  haptic?: boolean;
  style?: ViewStyle;
}

export function ScalePressable({
  children,
  onPress,
  onLongPress,
  disabled = false,
  scale = 0.97,
  haptic = true,
  style,
}: ScalePressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (haptic && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [haptic, onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// Staggered List - Animates list items with staggered delay
// ============================================================================

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
}

export function StaggeredList({
  children,
  staggerDelay = 50,
  initialDelay = 0,
}: StaggeredListProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <FadeInView
          key={index}
          delay={initialDelay + index * staggerDelay}
          direction="up"
          distance={15}
        >
          {child}
        </FadeInView>
      ))}
    </>
  );
}

// ============================================================================
// Pulse Animation - Creates a pulsing effect
// ============================================================================

interface PulseViewProps {
  children: React.ReactNode;
  duration?: number;
  minScale?: number;
  maxScale?: number;
  style?: ViewStyle;
}

export function PulseView({
  children,
  duration = 1500,
  minScale = 0.97,
  maxScale = 1.03,
  style,
}: PulseViewProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: maxScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: minScale,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [duration, maxScale, minScale, scaleAnim]);

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Shimmer Effect - Loading shimmer animation
// ============================================================================

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({
  width,
  height,
  borderRadius = 8,
  style,
}: ShimmerProps) {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.skeletonHighlight,
          opacity: 0.5,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}

// ============================================================================
// Animated Badge - Badge with entrance animation
// ============================================================================

interface AnimatedBadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AnimatedBadge({
  text,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}: AnimatedBadgeProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const variantColors = {
    primary: { bg: colors.primaryLight, text: colors.primary },
    secondary: { bg: colors.secondaryLight, text: colors.secondary },
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    error: { bg: colors.errorLight, text: colors.error },
  };

  const sizeStyles = {
    small: { paddingH: 8, paddingV: 3, fontSize: 10 },
    medium: { paddingH: 12, paddingV: 5, fontSize: 12 },
    large: { paddingH: 16, paddingV: 7, fontSize: 14 },
  };

  const { bg, text: textColor } = variantColors[variant];
  const { paddingH, paddingV, fontSize } = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: textColor, fontSize },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
}

// ============================================================================
// Animated Counter - Number that animates when changed
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  duration = 500,
  style,
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.setValue(displayValue);
    
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => animatedValue.removeListener(listener);
  }, [animatedValue, displayValue, duration, value]);

  return (
    <Text style={style}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
}

// ============================================================================
// Floating Action Button with animation
// ============================================================================

interface FloatingButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  visible?: boolean;
}

export function FloatingButton({
  icon,
  onPress,
  style,
  visible = true,
}: FloatingButtonProps) {
  const { colors, theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [scaleAnim, visible]);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  }, [onPress, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          ...theme.shadows.lg,
          transform: [{ scale: scaleAnim }, { rotate }],
        },
        style,
      ]}
    >
      <Pressable onPress={handlePress} style={styles.fabPressable}>
        {icon}
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

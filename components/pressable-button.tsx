/**
 * Pressable Button Component
 * 
 * A button component with haptic feedback, loading states, and proper touch targets.
 * Requirements: 10.4, 10.5
 */

import { touchTargets } from '@/constants/theme';
import { useTheme } from '@/contexts/theme.context';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    PressableProps,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

// ============================================================================
// Types
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface PressableButtonProps extends Omit<PressableProps, 'style'> {
  /** Button text */
  title: string;
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Enable haptic feedback */
  hapticFeedback?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
  /** Full width button */
  fullWidth?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function PressableButton({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  hapticFeedback = true,
  style,
  textStyle,
  fullWidth = false,
  onPressIn,
  onPress,
  ...props
}: PressableButtonProps) {
  const { colors, theme } = useTheme();

  // Handle haptic feedback
  const handlePressIn = useCallback(
    (event: any) => {
      if (hapticFeedback && Platform.OS === 'ios' && !disabled && !loading) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPressIn?.(event);
    },
    [hapticFeedback, disabled, loading, onPressIn]
  );

  // Handle press with success haptic
  const handlePress = useCallback(
    (event: any) => {
      if (hapticFeedback && Platform.OS === 'ios' && !disabled && !loading) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onPress?.(event);
    },
    [hapticFeedback, disabled, loading, onPress]
  );

  // Get size-based styles
  const sizeStyles = useMemo(() => {
    const sizes = {
      small: {
        height: touchTargets.minimum,
        paddingHorizontal: theme.spacing.md,
        fontSize: 14,
        iconSize: 16,
      },
      medium: {
        height: touchTargets.comfortable,
        paddingHorizontal: theme.spacing.base,
        fontSize: 16,
        iconSize: 20,
      },
      large: {
        height: touchTargets.large,
        paddingHorizontal: theme.spacing.xl,
        fontSize: 18,
        iconSize: 24,
      },
    };
    return sizes[size];
  }, [size, theme]);

  // Get variant-based styles
  const variantStyles = useMemo(() => {
    const variants = {
      primary: {
        backgroundColor: colors.primary,
        textColor: colors.onPrimary,
        borderColor: 'transparent',
        pressedBg: colors.primaryDark,
      },
      secondary: {
        backgroundColor: colors.secondary,
        textColor: colors.onSecondary,
        borderColor: 'transparent',
        pressedBg: colors.secondaryDark,
      },
      outline: {
        backgroundColor: 'transparent',
        textColor: colors.primary,
        borderColor: colors.primary,
        pressedBg: colors.primaryLight,
      },
      ghost: {
        backgroundColor: 'transparent',
        textColor: colors.primary,
        borderColor: 'transparent',
        pressedBg: colors.primaryLight,
      },
      danger: {
        backgroundColor: colors.error,
        textColor: colors.textInverse,
        borderColor: 'transparent',
        pressedBg: '#b91c1c',
      },
    };
    return variants[variant];
  }, [variant, colors]);

  // Disabled styles
  const isDisabled = disabled || loading;
  const disabledStyles = useMemo(
    () => ({
      backgroundColor: colors.textDisabled,
      textColor: colors.textTertiary,
      borderColor: colors.textDisabled,
    }),
    [colors]
  );

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          height: sizeStyles.height,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          backgroundColor: isDisabled
            ? disabledStyles.backgroundColor
            : pressed
            ? variantStyles.pressedBg
            : variantStyles.backgroundColor,
          borderColor: isDisabled
            ? disabledStyles.borderColor
            : variantStyles.borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: pressed && !isDisabled ? 0.9 : 1,
          ...theme.shadows.sm,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isDisabled ? disabledStyles.textColor : variantStyles.textColor}
          />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text
              style={[
                styles.text,
                {
                  fontSize: sizeStyles.fontSize,
                  color: isDisabled
                    ? disabledStyles.textColor
                    : variantStyles.textColor,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </View>
    </Pressable>
  );
}

// ============================================================================
// Icon Button Component
// ============================================================================

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  /** Icon component */
  icon: React.ReactNode;
  /** Button size */
  size?: ButtonSize;
  /** Button variant */
  variant?: ButtonVariant;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Enable haptic feedback */
  hapticFeedback?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Accessibility label */
  accessibilityLabel: string;
}

export function IconButton({
  icon,
  size = 'medium',
  variant = 'ghost',
  loading = false,
  disabled = false,
  hapticFeedback = true,
  style,
  accessibilityLabel,
  onPressIn,
  onPress,
  ...props
}: IconButtonProps) {
  const { colors, theme } = useTheme();

  const handlePressIn = useCallback(
    (event: any) => {
      if (hapticFeedback && Platform.OS === 'ios' && !disabled && !loading) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPressIn?.(event);
    },
    [hapticFeedback, disabled, loading, onPressIn]
  );

  const handlePress = useCallback(
    (event: any) => {
      if (hapticFeedback && Platform.OS === 'ios' && !disabled && !loading) {
        Haptics.selectionAsync();
      }
      onPress?.(event);
    },
    [hapticFeedback, disabled, loading, onPress]
  );

  const sizeValue = useMemo(() => {
    const sizes = {
      small: touchTargets.minimum,
      medium: touchTargets.comfortable,
      large: touchTargets.large,
    };
    return sizes[size];
  }, [size]);

  const variantStyles = useMemo(() => {
    const variants = {
      primary: {
        backgroundColor: colors.primary,
        pressedBg: colors.primaryDark,
      },
      secondary: {
        backgroundColor: colors.secondary,
        pressedBg: colors.secondaryDark,
      },
      outline: {
        backgroundColor: 'transparent',
        pressedBg: colors.primaryLight,
      },
      ghost: {
        backgroundColor: 'transparent',
        pressedBg: colors.overlayLight,
      },
      danger: {
        backgroundColor: colors.error,
        pressedBg: '#b91c1c',
      },
    };
    return variants[variant];
  }, [variant, colors]);

  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor: pressed
            ? variantStyles.pressedBg
            : variantStyles.backgroundColor,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        icon
      )}
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { Platform, TextStyle, ViewStyle } from 'react-native';
/**
 * Base color palette - semantic color tokens
 */
const palette = {
  // Primary brand colors
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main primary
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  // Secondary/accent colors
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main secondary
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Semantic colors
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#047857',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1d4ed8',
  },
  // Pure colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};


// Theme Colors

export const lightColors = {
  // Backgrounds
  background: palette.white,
  backgroundSecondary: palette.gray[50],
  backgroundTertiary: palette.gray[100],
  surface: palette.white,
  surfaceElevated: palette.white,
  
  // Text
  text: palette.gray[800],
  textSecondary: palette.gray[500],
  textTertiary: palette.gray[400],
  textInverse: palette.white,
  textDisabled: palette.gray[300],
  
  // Primary
  primary: palette.primary[500],
  primaryLight: palette.primary[100],
  primaryDark: palette.primary[700],
  onPrimary: palette.white,
  
  // Secondary
  secondary: palette.secondary[500],
  secondaryLight: palette.secondary[100],
  secondaryDark: palette.secondary[700],
  onSecondary: palette.white,
  
  // Borders
  border: palette.gray[200],
  borderLight: palette.gray[100],
  borderDark: palette.gray[300],
  
  // Semantic
  success: palette.success.main,
  successLight: palette.success.light,
  warning: palette.warning.main,
  warningLight: palette.warning.light,
  error: palette.error.main,
  errorLight: palette.error.light,
  info: palette.info.main,
  infoLight: palette.info.light,
  
  // Interactive
  tint: palette.primary[500],
  tabIconDefault: palette.gray[500],
  tabIconSelected: palette.primary[500],
  icon: palette.gray[500],
  iconSecondary: palette.gray[400],
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  
  // Specific UI elements
  cardBackground: palette.white,
  inputBackground: palette.gray[50],
  inputBorder: palette.gray[300],
  inputBorderFocused: palette.primary[500],
  placeholder: palette.gray[400],
  divider: palette.gray[200],
  skeleton: palette.gray[200],
  skeletonHighlight: palette.gray[100],
  
  // Status badges
  badgeBackground: palette.primary[100],
  badgeText: palette.primary[700],
  badgeSuccessBackground: palette.secondary[100],
  badgeSuccessText: palette.secondary[700],
  badgeWarningBackground: palette.warning.light,
  badgeWarningText: palette.warning.dark,
  badgeErrorBackground: palette.error.light,
  badgeErrorText: palette.error.dark,
};

export const darkColors: typeof lightColors = {
  // Backgrounds
  background: palette.gray[900],
  backgroundSecondary: palette.gray[800],
  backgroundTertiary: palette.gray[700],
  surface: palette.gray[800],
  surfaceElevated: palette.gray[700],
  
  // Text
  text: palette.gray[50],
  textSecondary: palette.gray[400],
  textTertiary: palette.gray[500],
  textInverse: palette.gray[900],
  textDisabled: palette.gray[600],
  
  // Primary
  primary: palette.primary[400],
  primaryLight: palette.primary[900],
  primaryDark: palette.primary[300],
  onPrimary: palette.gray[900],
  
  // Secondary
  secondary: palette.secondary[400],
  secondaryLight: palette.secondary[900],
  secondaryDark: palette.secondary[300],
  onSecondary: palette.gray[900],
  
  // Borders
  border: palette.gray[700],
  borderLight: palette.gray[800],
  borderDark: palette.gray[600],
  
  // Semantic
  success: palette.secondary[400],
  successLight: palette.secondary[900],
  warning: palette.warning.main,
  warningLight: 'rgba(245, 158, 11, 0.2)',
  error: '#f87171',
  errorLight: 'rgba(239, 68, 68, 0.2)',
  info: palette.info.main,
  infoLight: 'rgba(59, 130, 246, 0.2)',
  
  // Interactive
  tint: palette.primary[400],
  tabIconDefault: palette.gray[500],
  tabIconSelected: palette.primary[400],
  icon: palette.gray[400],
  iconSecondary: palette.gray[500],
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.1)',
  
  // Specific UI elements
  cardBackground: palette.gray[800],
  inputBackground: palette.gray[800],
  inputBorder: palette.gray[600],
  inputBorderFocused: palette.primary[400],
  placeholder: palette.gray[500],
  divider: palette.gray[700],
  skeleton: palette.gray[700],
  skeletonHighlight: palette.gray[600],
  
  // Status badges
  badgeBackground: palette.primary[900],
  badgeText: palette.primary[300],
  badgeSuccessBackground: palette.secondary[900],
  badgeSuccessText: palette.secondary[300],
  badgeWarningBackground: 'rgba(245, 158, 11, 0.2)',
  badgeWarningText: '#fbbf24',
  badgeErrorBackground: 'rgba(239, 68, 68, 0.2)',
  badgeErrorText: '#fca5a5',
};

// Legacy Colors export for backward compatibility
export const Colors = {
  light: {
    text: lightColors.text,
    background: lightColors.background,
    tint: lightColors.tint,
    icon: lightColors.icon,
    tabIconDefault: lightColors.tabIconDefault,
    tabIconSelected: lightColors.tabIconSelected,
  },
  dark: {
    text: darkColors.text,
    background: darkColors.background,
    tint: darkColors.tint,
    icon: darkColors.icon,
    tabIconDefault: darkColors.tabIconDefault,
    tabIconSelected: darkColors.tabIconSelected,
  },
};

// Typography

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
  },
});

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
};

export const fontWeights = {
  normal: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const typography = {
  // Display styles
  displayLarge: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  } as TextStyle,
  displayMedium: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  } as TextStyle,
  displaySmall: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  } as TextStyle,
  
  // Heading styles
  headingLarge: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.tight,
  } as TextStyle,
  headingMedium: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.lg * lineHeights.tight,
  } as TextStyle,
  headingSmall: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.base * lineHeights.tight,
  } as TextStyle,
  
  // Body styles
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.lg * lineHeights.normal,
  } as TextStyle,
  bodyMedium: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.base * lineHeights.normal,
  } as TextStyle,
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.sm * lineHeights.normal,
  } as TextStyle,
  
  // Label styles
  labelLarge: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.base * lineHeights.tight,
  } as TextStyle,
  labelMedium: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.tight,
  } as TextStyle,
  labelSmall: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.xs * lineHeights.tight,
  } as TextStyle,
  
  // Caption
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.xs * lineHeights.normal,
  } as TextStyle,
};

// Spacing

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border Radius

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Shadows

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ViewStyle,
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  } as ViewStyle,
};

// Animation Durations

export const durations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
};

// Animation Easing (for use with Animated API)
export const easings = {
  easeInOut: [0.42, 0, 0.58, 1],
  easeOut: [0, 0, 0.58, 1],
  easeIn: [0.42, 0, 1, 1],
  spring: { damping: 15, stiffness: 150 },
  bounce: { damping: 8, stiffness: 180 },
  gentle: { damping: 20, stiffness: 120 },
};

// Gradient Presets
export const gradients = {
  primary: ['#6366f1', '#8b5cf6'],
  secondary: ['#10b981', '#34d399'],
  sunset: ['#f59e0b', '#ef4444'],
  ocean: ['#3b82f6', '#06b6d4'],
  purple: ['#8b5cf6', '#ec4899'],
  dark: ['#1f2937', '#374151'],
};

// Touch Target Sizes (Accessibility)

export const touchTargets = {
  minimum: 44, // Minimum touch target size for accessibility
  comfortable: 48,
  large: 56,
};

// Z-Index

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
};

// Theme Type Definitions

export type ThemeColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  durations: typeof durations;
  touchTargets: typeof touchTargets;
  zIndex: typeof zIndex;
}

// Theme Objects

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  durations,
  touchTargets,
  zIndex,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  durations,
  touchTargets,
  zIndex,
};

// Helper Functions

/**
 * Get theme based on color scheme
 */
export function getTheme(mode: ThemeMode): Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}

/**
 * Create a color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Handle rgb colors
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  // Handle rgba colors - replace existing opacity
  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }
  return color;
}

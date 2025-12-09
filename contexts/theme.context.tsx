/**
 * Theme Context and Provider
 * 
 * Provides centralized theme management with light/dark mode support.
 */

import {
    getTheme,
    lightTheme,
    Theme,
    ThemeColors,
    ThemeMode
} from '@/constants/theme';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

// ============================================================================
// Context Types
// ============================================================================

interface ThemeContextType {
  /** Current theme object with all design tokens */
  theme: Theme;
  /** Current theme mode ('light' or 'dark') */
  mode: ThemeMode;
  /** Whether dark mode is active */
  isDark: boolean;
  /** Current theme colors */
  colors: ThemeColors;
  /** Toggle between light and dark mode */
  toggleTheme: () => void;
  /** Set specific theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Use system color scheme preference */
  useSystemTheme: () => void;
  /** Whether using system theme preference */
  isSystemTheme: boolean;
}

// ============================================================================
// Context Creation
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme mode (defaults to system preference) */
  initialMode?: ThemeMode;
  /** Force a specific mode (ignores system preference) */
  forcedMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialMode,
  forcedMode,
}: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [isSystemTheme, setIsSystemTheme] = useState(!initialMode && !forcedMode);
  const [manualMode, setManualMode] = useState<ThemeMode | null>(
    forcedMode || initialMode || null
  );

  // Determine current mode
  const mode: ThemeMode = useMemo(() => {
    if (forcedMode) return forcedMode;
    if (manualMode && !isSystemTheme) return manualMode;
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }, [forcedMode, manualMode, isSystemTheme, systemColorScheme]);

  // Get theme based on mode
  const theme = useMemo(() => getTheme(mode), [mode]);

  // Update manual mode when forced mode changes
  useEffect(() => {
    if (forcedMode) {
      setManualMode(forcedMode);
      setIsSystemTheme(false);
    }
  }, [forcedMode]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setIsSystemTheme(false);
    setManualMode((prev) => {
      const current = prev || mode;
      return current === 'light' ? 'dark' : 'light';
    });
  }, [mode]);

  // Set specific mode
  const setModeHandler = useCallback((newMode: ThemeMode) => {
    setIsSystemTheme(false);
    setManualMode(newMode);
  }, []);

  // Use system theme
  const useSystemTheme = useCallback(() => {
    setIsSystemTheme(true);
    setManualMode(null);
  }, []);

  const contextValue: ThemeContextType = useMemo(
    () => ({
      theme,
      mode,
      isDark: mode === 'dark',
      colors: theme.colors,
      toggleTheme,
      setMode: setModeHandler,
      useSystemTheme,
      isSystemTheme,
    }),
    [theme, mode, toggleTheme, setModeHandler, useSystemTheme, isSystemTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access theme context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { colors, isDark, toggleTheme } = useTheme();
 *   
 *   return (
 *     <View style={{ backgroundColor: colors.background }}>
 *       <Text style={{ color: colors.text }}>Hello</Text>
 *       <Button onPress={toggleTheme} title={isDark ? 'Light' : 'Dark'} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    // Return default light theme if used outside provider
    // This allows components to work without explicit provider wrapping
    return {
      theme: lightTheme,
      mode: 'light',
      isDark: false,
      colors: lightTheme.colors,
      toggleTheme: () => {
        console.warn('useTheme: toggleTheme called outside ThemeProvider');
      },
      setMode: () => {
        console.warn('useTheme: setMode called outside ThemeProvider');
      },
      useSystemTheme: () => {
        console.warn('useTheme: useSystemTheme called outside ThemeProvider');
      },
      isSystemTheme: true,
    };
  }
  
  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get a specific color from the current theme
 * 
 * @example
 * ```tsx
 * const backgroundColor = useThemeColor('background');
 * const textColor = useThemeColor('text');
 * ```
 */
export function useThemeColor(colorKey: keyof ThemeColors): string {
  const { colors } = useTheme();
  return colors[colorKey];
}

/**
 * Hook to get themed styles based on light/dark mode
 * 
 * @example
 * ```tsx
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *     padding: 16,
 *   },
 *   text: {
 *     color: colors.text,
 *   },
 * }));
 * ```
 */
export function useThemedStyles<T>(
  styleFactory: (colors: ThemeColors, isDark: boolean) => T
): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => styleFactory(colors, isDark), [colors, isDark, styleFactory]);
}

// ============================================================================
// Exports
// ============================================================================

export { ThemeContext };
export type { ThemeContextType, ThemeProviderProps };


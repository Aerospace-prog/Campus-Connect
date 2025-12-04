/**
 * useTheme Hook
 * 
 * Re-exports theme hooks from the theme context for convenient access.
 * Requirements: 10.4, 10.5
 */

export {
    useTheme,
    useThemeColor,
    useThemedStyles
} from '@/contexts/theme.context';

export type { ThemeContextType } from '@/contexts/theme.context';

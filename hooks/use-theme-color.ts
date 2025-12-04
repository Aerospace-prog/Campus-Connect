/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, ThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme.context';

/**
 * Hook to get a color from the current theme with optional overrides
 * 
 * @param props - Optional light/dark color overrides
 * @param colorName - The color key from the theme
 * @returns The resolved color value
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { mode, colors } = useTheme();
  const colorFromProps = props[mode];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Map legacy color names to new theme colors
    const colorMap: Record<string, keyof ThemeColors> = {
      text: 'text',
      background: 'background',
      tint: 'tint',
      icon: 'icon',
      tabIconDefault: 'tabIconDefault',
      tabIconSelected: 'tabIconSelected',
    };
    
    const mappedKey = colorMap[colorName] || colorName;
    return colors[mappedKey as keyof ThemeColors] || Colors[mode][colorName];
  }
}

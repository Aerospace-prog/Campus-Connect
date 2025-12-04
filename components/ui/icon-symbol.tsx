// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Existing mappings
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  // New mappings for CampusConnect
  'calendar': 'event',
  'location.fill': 'location-on',
  'clock.fill': 'schedule',
  'qrcode.viewfinder': 'qr-code-scanner',
  'qrcode': 'qr-code-scanner',
  'ticket.fill': 'confirmation-number',
  'exclamationmark.triangle.fill': 'warning',
  'checkmark': 'check',
  'crown.fill': 'workspace-premium',
  'plus': 'add',
  'list.bullet': 'list',
  'camera.fill': 'photo-camera',
  'pencil': 'edit',
  'xmark': 'close',
  'person.fill': 'person',
  'person.crop.circle': 'account-circle',
  // Tab navigation icons
  'star.fill': 'star',
  'square.grid.2x2': 'grid-view',
} as IconMapping;

// Export the type for use in other components
export type IconSymbolName = keyof typeof MAPPING;

export interface IconSymbolProps {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: IconSymbolProps) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

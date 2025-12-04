import { useTheme } from '@/contexts/theme.context';
import { encodeQRData } from '@/utils/qr-code.utils';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeDisplayProps {
  userId: string;
  eventId: string;
  eventTitle: string;
  size?: number;
}

/**
 * QRCodeDisplay component - Generates and displays a QR code for event check-in
 * Works offline using cached RSVP data
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  userId,
  eventId,
  eventTitle,
  size = 250,
}) => {
  const { colors, theme } = useTheme();
  
  // Generate QR code data
  const qrData = encodeQRData(userId, eventId);

  // Create themed styles
  const themedStyles = useMemo(() => ({
    qrContainer: { 
      ...styles.qrContainer, 
      backgroundColor: colors.surface,
      ...theme.shadows.lg,
    },
    eventTitle: { ...styles.eventTitle, color: colors.text },
    instructions: { ...styles.instructions, color: colors.textSecondary },
  }), [colors, theme]);

  return (
    <View style={styles.container}>
      <View style={themedStyles.qrContainer}>
        <QRCode
          value={qrData}
          size={size}
          backgroundColor="white"
          color="black"
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={themedStyles.eventTitle} numberOfLines={2}>
          {eventTitle}
        </Text>
        <Text style={themedStyles.instructions}>
          Show this QR code at the event for check-in
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  infoContainer: {
    marginTop: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

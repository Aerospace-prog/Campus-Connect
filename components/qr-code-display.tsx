import { encodeQRData } from '@/utils/qr-code.utils';
import React from 'react';
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
  // Generate QR code data
  const qrData = encodeQRData(userId, eventId);

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={size}
          backgroundColor="white"
          color="black"
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {eventTitle}
        </Text>
        <Text style={styles.instructions}>
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

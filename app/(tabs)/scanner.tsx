import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/contexts/theme.context';
import { useAuth } from '@/hooks/use-auth';
import { useEvents } from '@/hooks/use-events';
import { useRole } from '@/hooks/use-role';
import { CheckInService } from '@/services/checkin.service';
import { CheckInResult, Event } from '@/types/models';

/**
 * ScannerTab - QR code scanning interface for check-ins
 * 
 */
export default function ScannerTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, theme } = useTheme();
  const { isAdmin, loading: roleLoading } = useRole();
  const { events } = useEvents();

  // Create themed styles for non-camera elements
  const themedStyles = useMemo(() => ({
    permissionContainer: { 
      ...styles.container, 
      ...styles.centerContent,
      backgroundColor: colors.background,
    },
    permissionTitle: { ...styles.permissionTitle, color: colors.text },
    permissionText: { ...styles.permissionText, color: colors.textSecondary },
    permissionButton: { ...styles.permissionButton, backgroundColor: colors.primary },
    resultCard: { ...styles.resultCard, backgroundColor: colors.surface },
    resultTitle: { ...styles.resultTitle, color: colors.text },
    resultUserName: { ...styles.resultUserName, color: colors.primary },
    resultMessage: { ...styles.resultMessage, color: colors.textSecondary },
    scanAgainButton: { ...styles.scanAgainButton, backgroundColor: colors.primary },
    modalContent: { 
      ...styles.modalContent, 
      backgroundColor: colors.surface,
    },
    modalHeader: {
      ...styles.modalHeader,
      borderBottomColor: colors.border,
    },
    modalTitle: { ...styles.modalTitle, color: colors.text },
    noEventsText: { ...styles.noEventsText, color: colors.textSecondary },
    eventItem: { ...styles.eventItem, backgroundColor: colors.backgroundSecondary },
    eventItemSelected: { 
      backgroundColor: colors.primaryLight,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    eventItemTitle: { ...styles.eventItemTitle, color: colors.text },
    eventItemDate: { ...styles.eventItemDate, color: colors.textSecondary },
    eventItemStats: { ...styles.eventItemStats, color: colors.textTertiary },
  }), [colors, theme]);
  
  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  
  // Scanner state
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Event selector state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  
  // Cooldown to prevent duplicate scans
  const scanCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SCAN_COOLDOWN_MS = 4000;

  // Get admin's events (events they created)
  const adminEvents = events.filter(event => event.createdBy === user?.uid);

  // Fallback guard: redirect non-admins
  useEffect(() => {
    if (roleLoading) return;
    
    if (!isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [isAdmin, roleLoading, router]);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (scanCooldownRef.current) {
        clearTimeout(scanCooldownRef.current);
      }
    };
  }, []);


  /**
   * Handle barcode scan event
   * Validates QR data and performs check-in
   */
  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    // Prevent duplicate scans during cooldown
    if (scanned || processing) return;
    
    setScanned(true);
    setProcessing(true);
    
    try {
      // Provide haptic feedback on scan
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Validate and check in the user
      const result = await CheckInService.validateAndCheckIn(data);
      setScanResult(result);
      
      // Provide success/error haptic feedback
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      setScanResult({
        success: false,
        message: error.message || 'Failed to process QR code',
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setProcessing(false);
      
      // Set cooldown before allowing next scan
      scanCooldownRef.current = setTimeout(() => {
        setScanned(false);
        setScanResult(null);
      }, SCAN_COOLDOWN_MS);
    }
  }, [scanned, processing]);

  /**
   * Reset scanner to scan again
   */
  const handleScanAgain = useCallback(() => {
    if (scanCooldownRef.current) {
      clearTimeout(scanCooldownRef.current);
    }
    setScanned(false);
    setScanResult(null);
  }, []);

  /**
   * Select an event for scanning
   */
  const handleSelectEvent = useCallback((event: Event) => {
    setSelectedEvent(event);
    setShowEventSelector(false);
  }, []);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <View style={themedStyles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  // Show permission request screen
  if (!permission) {
    return (
      <View style={themedStyles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.permissionText}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={themedStyles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
        <Text style={themedStyles.permissionTitle}>Camera Access Required</Text>
        <Text style={themedStyles.permissionText}>
          We need camera access to scan QR codes for event check-ins.
        </Text>
        <Pressable style={themedStyles.permissionButton} onPress={requestPermission}>
          <Text style={[styles.permissionButtonText, { color: colors.onPrimary }]}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Scan Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            {selectedEvent && (
              <Text style={styles.headerSubtitle}>{selectedEvent.title}</Text>
            )}
          </View>

          {/* Scan Frame */}
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Processing indicator */}
              {processing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.scanInstructions}>
              Position the QR code within the frame
            </Text>
          </View>

          {/* Event Selector Button */}
          {adminEvents.length > 0 && (
            <Pressable
              style={styles.eventSelectorButton}
              onPress={() => setShowEventSelector(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#fff" />
              <Text style={styles.eventSelectorText}>
                {selectedEvent ? 'Change Event' : 'Select Event'}
              </Text>
            </Pressable>
          )}
        </View>
      </CameraView>

      {/* Scan Result Modal */}
      {scanResult && (
        <View style={styles.resultOverlay}>
          <View style={[
            themedStyles.resultCard,
            scanResult.success ? styles.resultSuccess : styles.resultError
          ]}>
            <Ionicons
              name={scanResult.success ? 'checkmark-circle' : 'close-circle'}
              size={64}
              color={scanResult.success ? colors.success : colors.error}
            />
            <Text style={themedStyles.resultTitle}>
              {scanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
            </Text>
            {scanResult.userName && (
              <Text style={themedStyles.resultUserName}>{scanResult.userName}</Text>
            )}
            <Text style={themedStyles.resultMessage}>{scanResult.message}</Text>
            <Pressable style={themedStyles.scanAgainButton} onPress={handleScanAgain}>
              <Text style={[styles.scanAgainText, { color: colors.onPrimary }]}>Scan Another</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Event Selector Modal */}
      <Modal
        visible={showEventSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>Select Event</Text>
              <Pressable onPress={() => setShowEventSelector(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.eventList}>
              {adminEvents.length === 0 ? (
                <Text style={themedStyles.noEventsText}>
                  You have not created any events yet.
                </Text>
              ) : (
                adminEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    style={[
                      themedStyles.eventItem,
                      selectedEvent?.id === event.id && themedStyles.eventItemSelected
                    ]}
                    onPress={() => handleSelectEvent(event)}
                  >
                    <View style={styles.eventItemContent}>
                      <Text style={themedStyles.eventItemTitle}>{event.title}</Text>
                      <Text style={themedStyles.eventItemDate}>
                        {event.date.toDate().toLocaleDateString()}
                      </Text>
                      <Text style={themedStyles.eventItemStats}>
                        {event.rsvps?.length || 0} RSVPs • {event.checkedIn?.length || 0} Checked In
                      </Text>
                    </View>
                    {selectedEvent?.id === event.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e5e7eb',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#6366f1',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  processingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  scanInstructions: {
    color: '#e5e7eb',
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  eventSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 40,
    marginHorizontal: 40,
    gap: 8,
  },
  eventSelectorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Permission styles
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Result overlay styles
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  resultSuccess: {
    borderTopWidth: 4,
    borderTopColor: '#22c55e',
  },
  resultError: {
    borderTopWidth: 4,
    borderTopColor: '#ef4444',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  resultUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
    marginTop: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanAgainButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  eventList: {
    padding: 16,
  },
  noEventsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  eventItemSelected: {
    backgroundColor: '#eef2ff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  eventItemContent: {
    flex: 1,
  },
  eventItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  eventItemDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  eventItemStats: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

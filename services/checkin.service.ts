import {
  arrayUnion,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AttendanceData, CheckInResult, Event, QRValidationResult, User } from '../types/models';
import { getFirebaseErrorMessage, logError, withRetry } from '../utils/error-handler';
import { decodeQRData } from '../utils/qr-code.utils';

/**
 * CheckInService - Handles QR code validation and event check-in operations
 */
export class CheckInService {
  private static readonly EVENTS_COLLECTION = 'events';
  private static readonly USERS_COLLECTION = 'users';

  /**
   * Validate QR code data using the decodeQRData utility
   * @param qrString - Raw QR code string data
   * @returns Validation result with decoded data or error
   */
  static validateQRData(qrString: string): QRValidationResult {
    return decodeQRData(qrString);
  }

  /**
   * Check in a user to an event
   * Verifies RSVP status and adds user to checkedIn array
   * Uses arrayUnion for idempotent operations (no duplicates)
   * 
   * @param userId - User ID from QR code
   * @param eventId - Event ID from QR code
   * @returns Check-in result with success status and message
   *
   */
  static async checkInUser(userId: string, eventId: string): Promise<CheckInResult> {
    try {
      // Validate inputs
      if (!userId || !eventId) {
        return {
          success: false,
          message: 'Invalid QR code: missing user or event information',
        };
      }

      // Get event document with retry
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      const eventSnap = await withRetry(
        () => getDoc(eventRef),
        { operation: 'checkInUser.getEvent', userId, additionalData: { eventId } }
      );

      if (!eventSnap.exists()) {
        return {
          success: false,
          message: 'Event not found',
        };
      }

      const eventData = eventSnap.data() as Event;

      // Verify user has RSVP'd for this event (Requirement 5.4)
      if (!eventData.rsvps?.includes(userId)) {
        return {
          success: false,
          message: 'User has not RSVP\'d for this event',
        };
      }

      // Check if user is already checked in (Requirement 5.6)
      if (eventData.checkedIn?.includes(userId)) {
        // Get user name for the message
        const userName = await this.getUserName(userId);
        return {
          success: false,
          message: `${userName || 'User'} is already checked in`,
          userName: userName || undefined,
        };
      }

      // Get user name for success message
      const userName = await this.getUserName(userId);

      // Add user to checkedIn array using arrayUnion (idempotent - Requirement 5.6) with retry
      await withRetry(
        () => updateDoc(eventRef, {
          checkedIn: arrayUnion(userId),
          updatedAt: Timestamp.now(),
        }),
        { operation: 'checkInUser.update', userId, additionalData: { eventId } }
      );

      return {
        success: true,
        message: `Successfully checked in ${userName || 'user'}`,
        userName: userName || undefined,
      };
    } catch (error: any) {
      logError(error, { operation: 'checkInUser', userId, additionalData: { eventId } });
      return {
        success: false,
        message: getFirebaseErrorMessage(error),
      };
    }
  }


  /**
   * Get check-in status for a user at an event
   * @param userId - User ID to check
   * @param eventId - Event ID to check
   * @returns True if user is checked in, false otherwise
   */
  static async getCheckInStatus(userId: string, eventId: string): Promise<boolean> {
    try {
      if (!userId || !eventId) {
        return false;
      }

      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      const eventSnap = await withRetry(
        () => getDoc(eventRef),
        { operation: 'getCheckInStatus', userId, additionalData: { eventId } }
      );

      if (!eventSnap.exists()) {
        return false;
      }

      const eventData = eventSnap.data() as Event;
      return eventData.checkedIn?.includes(userId) || false;
    } catch (error: any) {
      logError(error, { operation: 'getCheckInStatus', userId, additionalData: { eventId } });
      return false;
    }
  }

  /**
   * Get attendance data for an event
   * @param eventId - Event ID to get attendance for
   * @returns Attendance data including RSVP and check-in counts
   */
  static async getEventAttendance(eventId: string): Promise<AttendanceData | null> {
    try {
      if (!eventId) {
        return null;
      }

      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      const eventSnap = await withRetry(
        () => getDoc(eventRef),
        { operation: 'getEventAttendance', additionalData: { eventId } }
      );

      if (!eventSnap.exists()) {
        return null;
      }

      const eventData = eventSnap.data() as Event;
      const rsvpUsers = eventData.rsvps || [];
      const checkedInUsers = eventData.checkedIn || [];
      const totalRSVPs = rsvpUsers.length;
      const totalCheckedIn = checkedInUsers.length;

      return {
        eventId,
        totalRSVPs,
        totalCheckedIn,
        attendanceRate: totalRSVPs > 0 ? (totalCheckedIn / totalRSVPs) * 100 : 0,
        rsvpUsers,
        checkedInUsers,
      };
    } catch (error: any) {
      logError(error, { operation: 'getEventAttendance', additionalData: { eventId } });
      return null;
    }
  }

  /**
   * Helper method to get user name from Firestore
   * @param userId - User ID to look up
   * @returns User name or null if not found
   */
  private static async getUserName(userId: string): Promise<string | null> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, userId);
      const userSnap = await withRetry(
        () => getDoc(userRef),
        { operation: 'getUserName', userId }
      );

      if (!userSnap.exists()) {
        return null;
      }

      const userData = userSnap.data() as User;
      return userData.name;
    } catch (error) {
      logError(error as Error, { operation: 'getUserName', userId });
      return null;
    }
  }

  /**
   * Validate and check in a user from QR code data
   * Combines validation and check-in into a single operation
   * 
   * @param qrString - Raw QR code string data
   * @returns Check-in result with success status and message
   */
  static async validateAndCheckIn(qrString: string): Promise<CheckInResult> {
    // First validate the QR data
    const validationResult = this.validateQRData(qrString);

    if (!validationResult.isValid || !validationResult.data) {
      return {
        success: false,
        message: validationResult.error || 'Invalid QR code',
      };
    }

    // Then perform the check-in
    return this.checkInUser(validationResult.data.userId, validationResult.data.eventId);
  }
}

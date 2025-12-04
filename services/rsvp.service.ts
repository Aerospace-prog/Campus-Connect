import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Event } from '../types/models';
import { getFirebaseErrorMessage, logError, withRetry } from '../utils/error-handler';

/**
 * RSVPService - Handles all RSVP-related operations
 */
export class RSVPService {
  private static readonly EVENTS_COLLECTION = 'events';

  /**
   * Add RSVP for a user to an event
   * Uses arrayUnion to ensure idempotent operations (no duplicates)
   */
  static async addRSVP(userId: string, eventId: string): Promise<void> {
    try {
      if (!userId || !eventId) {
        throw new Error('User ID and Event ID are required');
      }

      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      
      // Verify event exists with retry
      const eventSnap = await withRetry(
        () => getDoc(eventRef),
        { operation: 'addRSVP.getEvent', userId, additionalData: { eventId } }
      );
      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      // Use arrayUnion to add user ID only if not already present (idempotent)
      await withRetry(
        () => updateDoc(eventRef, {
          rsvps: arrayUnion(userId),
          updatedAt: Timestamp.now(),
        }),
        { operation: 'addRSVP.update', userId, additionalData: { eventId } }
      );
    } catch (error: any) {
      logError(error, { operation: 'addRSVP', userId, additionalData: { eventId } });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Remove RSVP for a user from an event
   */
  static async removeRSVP(userId: string, eventId: string): Promise<void> {
    try {
      if (!userId || !eventId) {
        throw new Error('User ID and Event ID are required');
      }

      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      
      // Verify event exists with retry
      const eventSnap = await withRetry(
        () => getDoc(eventRef),
        { operation: 'removeRSVP.getEvent', userId, additionalData: { eventId } }
      );
      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      // Use arrayRemove to remove user ID with retry
      await withRetry(
        () => updateDoc(eventRef, {
          rsvps: arrayRemove(userId),
          updatedAt: Timestamp.now(),
        }),
        { operation: 'removeRSVP.update', userId, additionalData: { eventId } }
      );
    } catch (error: any) {
      logError(error, { operation: 'removeRSVP', userId, additionalData: { eventId } });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Get all events a user has RSVP'd to
   */
  static async getUserRSVPs(userId: string): Promise<Event[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const now = Timestamp.now();
      const eventsQuery = query(
        collection(db, this.EVENTS_COLLECTION),
        where('rsvps', 'array-contains', userId),
        where('date', '>=', now)
      );

      const querySnapshot = await withRetry(
        () => getDocs(eventsQuery),
        { operation: 'getUserRSVPs', userId }
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
    } catch (error: any) {
      logError(error, { operation: 'getUserRSVPs', userId });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Get all user IDs who have RSVP'd to an event
   */
  static async getEventRSVPs(eventId: string): Promise<string[]> {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      const eventSnap = await withRetry(
        () => getDoc(eventRef),
        { operation: 'getEventRSVPs', additionalData: { eventId } }
      );

      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      const eventData = eventSnap.data() as Event;
      return eventData.rsvps || [];
    } catch (error: any) {
      logError(error, { operation: 'getEventRSVPs', additionalData: { eventId } });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Check if a user has RSVP'd to an event
   */
  static async isUserRSVPd(userId: string, eventId: string): Promise<boolean> {
    try {
      if (!userId || !eventId) {
        return false;
      }

      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      const eventSnap = await withRetry(
        () => getDoc(eventRef),
        { operation: 'isUserRSVPd', userId, additionalData: { eventId } }
      );

      if (!eventSnap.exists()) {
        return false;
      }

      const eventData = eventSnap.data() as Event;
      return eventData.rsvps?.includes(userId) || false;
    } catch (error: any) {
      logError(error, { operation: 'isUserRSVPd', userId, additionalData: { eventId } });
      return false;
    }
  }
}

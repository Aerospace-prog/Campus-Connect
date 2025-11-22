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
      
      // Verify event exists
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      // Use arrayUnion to add user ID only if not already present (idempotent)
      await updateDoc(eventRef, {
        rsvps: arrayUnion(userId),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error adding RSVP:', error);
      throw new Error(error.message || 'Failed to add RSVP');
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
      
      // Verify event exists
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      // Use arrayRemove to remove user ID
      await updateDoc(eventRef, {
        rsvps: arrayRemove(userId),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      console.error('Error removing RSVP:', error);
      throw new Error(error.message || 'Failed to remove RSVP');
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

      const querySnapshot = await getDocs(eventsQuery);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
    } catch (error: any) {
      console.error('Error fetching user RSVPs:', error);
      throw new Error(error.message || 'Failed to fetch user RSVPs');
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
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        throw new Error('Event not found');
      }

      const eventData = eventSnap.data() as Event;
      return eventData.rsvps || [];
    } catch (error: any) {
      console.error('Error fetching event RSVPs:', error);
      throw new Error(error.message || 'Failed to fetch event RSVPs');
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
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        return false;
      }

      const eventData = eventSnap.data() as Event;
      return eventData.rsvps?.includes(userId) || false;
    } catch (error: any) {
      console.error('Error checking RSVP status:', error);
      return false;
    }
  }
}

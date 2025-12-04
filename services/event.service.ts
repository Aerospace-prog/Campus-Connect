import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    QuerySnapshot,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CreateEventInput, Event } from '../types/models';
import { getFirebaseErrorMessage, logError, withRetry } from '../utils/error-handler';

/**
 * EventService - Handles all event-related operations with Firestore
 */
export class EventService {
  private static readonly COLLECTION_NAME = 'events';

  /**
   * Create a new event
   */
  static async createEvent(
    eventInput: CreateEventInput,
    createdBy: string
  ): Promise<Event> {
    try {
      // Validate required fields
      if (!eventInput.title || !eventInput.description || !eventInput.date || !eventInput.location) {
        throw new Error('Missing required fields: title, description, date, and location are required');
      }

      const now = Timestamp.now();
      const eventData = {
        title: eventInput.title,
        description: eventInput.description,
        date: Timestamp.fromDate(eventInput.date),
        location: eventInput.location,
        createdBy,
        rsvps: [],
        checkedIn: [],
        imageUrl: eventInput.imageUrl || null,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await withRetry(
        () => addDoc(collection(db, this.COLLECTION_NAME), eventData),
        { operation: 'createEvent', userId: createdBy }
      );

      return {
        id: docRef.id,
        ...eventData,
      } as Event;
    } catch (error: any) {
      logError(error, { operation: 'createEvent', userId: createdBy });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Get all upcoming events sorted by date
   */
  static async getEvents(): Promise<Event[]> {
    try {
      const now = Timestamp.now();
      const eventsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('date', '>=', now),
        orderBy('date', 'asc')
      );

      const querySnapshot = await withRetry(
        () => getDocs(eventsQuery),
        { operation: 'getEvents' }
      );
      return this.mapQuerySnapshotToEvents(querySnapshot);
    } catch (error: any) {
      logError(error, { operation: 'getEvents' });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Get a single event by ID
   */
  static async getEventById(id: string): Promise<Event> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await withRetry(
        () => getDoc(docRef),
        { operation: 'getEventById', additionalData: { eventId: id } }
      );

      if (!docSnap.exists()) {
        throw new Error('Event not found');
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Event;
    } catch (error: any) {
      logError(error, { operation: 'getEventById', additionalData: { eventId: id } });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(
    id: string,
    updates: Partial<CreateEventInput>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convert date to Timestamp if provided
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }

      await withRetry(
        () => updateDoc(docRef, updateData),
        { operation: 'updateEvent', additionalData: { eventId: id } }
      );
    } catch (error: any) {
      logError(error, { operation: 'updateEvent', additionalData: { eventId: id } });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await withRetry(
        () => deleteDoc(docRef),
        { operation: 'deleteEvent', additionalData: { eventId: id } }
      );
    } catch (error: any) {
      logError(error, { operation: 'deleteEvent', additionalData: { eventId: id } });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Get events created by a specific admin user
   */
  static async getEventsByCreator(creatorId: string): Promise<Event[]> {
    try {
      const eventsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('createdBy', '==', creatorId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await withRetry(
        () => getDocs(eventsQuery),
        { operation: 'getEventsByCreator', userId: creatorId }
      );
      return this.mapQuerySnapshotToEvents(querySnapshot);
    } catch (error: any) {
      logError(error, { operation: 'getEventsByCreator', userId: creatorId });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Subscribe to real-time updates for all upcoming events
   * Returns an unsubscribe function
   * 
   * @param callback - Called with events array when data changes
   * @param onError - Optional error callback for handling subscription errors
   */
  static subscribeToEvents(
    callback: (events: Event[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const now = Timestamp.now();
      const eventsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('date', '>=', now),
        orderBy('date', 'asc')
      );

      return onSnapshot(
        eventsQuery,
        (querySnapshot) => {
          const events = this.mapQuerySnapshotToEvents(querySnapshot);
          callback(events);
        },
        (error) => {
          console.error('Error in events subscription:', error);
          // Call error callback if provided
          if (onError) {
            onError(error);
          }
          // Still call callback with empty array to prevent app crash
          callback([]);
        }
      );
    } catch (error: any) {
      console.error('Error subscribing to events:', error);
      if (onError) {
        onError(error);
      }
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  /**
   * Subscribe to real-time updates for a specific event
   * Returns an unsubscribe function
   */
  static subscribeToEvent(
    eventId: string,
    callback: (event: Event | null) => void
  ): () => void {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, eventId);

      return onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const event: Event = {
              id: docSnap.id,
              ...docSnap.data(),
            } as Event;
            callback(event);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Error in event subscription:', error);
          callback(null);
        }
      );
    } catch (error: any) {
      console.error('Error subscribing to event:', error);
      return () => {};
    }
  }

  /**
   * Helper method to map Firestore QuerySnapshot to Event array
   */
  private static mapQuerySnapshotToEvents(
    querySnapshot: QuerySnapshot<DocumentData>
  ): Event[] {
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  }
}

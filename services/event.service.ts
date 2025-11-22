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

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), eventData);

      return {
        id: docRef.id,
        ...eventData,
      } as Event;
    } catch (error: any) {
      console.error('Error creating event:', error);
      throw new Error(error.message || 'Failed to create event');
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

      const querySnapshot = await getDocs(eventsQuery);
      return this.mapQuerySnapshotToEvents(querySnapshot);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      throw new Error(error.message || 'Failed to fetch events');
    }
  }

  /**
   * Get a single event by ID
   */
  static async getEventById(id: string): Promise<Event> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Event not found');
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Event;
    } catch (error: any) {
      console.error('Error fetching event:', error);
      throw new Error(error.message || 'Failed to fetch event');
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

      await updateDoc(docRef, updateData);
    } catch (error: any) {
      console.error('Error updating event:', error);
      throw new Error(error.message || 'Failed to update event');
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      throw new Error(error.message || 'Failed to delete event');
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

      const querySnapshot = await getDocs(eventsQuery);
      return this.mapQuerySnapshotToEvents(querySnapshot);
    } catch (error: any) {
      console.error('Error fetching events by creator:', error);
      throw new Error(error.message || 'Failed to fetch events by creator');
    }
  }

  /**
   * Subscribe to real-time updates for all upcoming events
   * Returns an unsubscribe function
   */
  static subscribeToEvents(
    callback: (events: Event[]) => void
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
          // Call callback with empty array on error to prevent app crash
          callback([]);
        }
      );
    } catch (error: any) {
      console.error('Error subscribing to events:', error);
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

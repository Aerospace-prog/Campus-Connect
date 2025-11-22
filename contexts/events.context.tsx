import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { EventService } from '../services/event.service';
import { RSVPService } from '../services/rsvp.service';
import { CreateEventInput, Event } from '../types/models';

/**
 * EventsContext type definition
 */
interface EventsContextType {
  events: Event[];
  myEvents: Event[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  refreshMyEvents: () => Promise<void>;
  createEvent: (eventInput: CreateEventInput) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<CreateEventInput>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => Promise<Event>;
  rsvpForEvent: (eventId: string) => Promise<void>;
  cancelRSVP: (eventId: string) => Promise<void>;
  isUserRSVPd: (eventId: string) => boolean;
}

/**
 * Create the EventsContext
 */
const EventsContext = createContext<EventsContextType | undefined>(undefined);

/**
 * EventsProvider Props
 */
interface EventsProviderProps {
  children: ReactNode;
}

/**
 * EventsProvider - Provides global event state management
 */
export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Subscribe to real-time event updates
   */
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Subscribe to all upcoming events
    const unsubscribe = EventService.subscribeToEvents((updatedEvents) => {
      setEvents(updatedEvents);
      setLoading(false);
      
      // Update myEvents if user is authenticated
      if (user) {
        const userEvents = updatedEvents.filter((event) =>
          event.rsvps.includes(user.uid)
        );
        setMyEvents(userEvents);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user]);

  /**
   * Refresh events manually
   */
  const refreshEvents = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedEvents = await EventService.getEvents();
      setEvents(updatedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh events');
      console.error('Error refreshing events:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh user's RSVP'd events
   */
  const refreshMyEvents = async (): Promise<void> => {
    if (!user) {
      setMyEvents([]);
      return;
    }

    try {
      setError(null);
      // Filter events where user has RSVP'd
      const userEvents = events.filter((event) =>
        event.rsvps.includes(user.uid)
      );
      setMyEvents(userEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh my events');
      console.error('Error refreshing my events:', err);
    }
  };

  /**
   * Create a new event
   */
  const createEvent = async (eventInput: CreateEventInput): Promise<Event> => {
    if (!user) {
      throw new Error('User must be authenticated to create events');
    }

    try {
      setError(null);
      const newEvent = await EventService.createEvent(eventInput, user.uid);
      // Real-time listener will update the events list automatically
      return newEvent;
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      throw err;
    }
  };

  /**
   * Update an existing event
   */
  const updateEvent = async (
    id: string,
    updates: Partial<CreateEventInput>
  ): Promise<void> => {
    try {
      setError(null);
      await EventService.updateEvent(id, updates);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      throw err;
    }
  };

  /**
   * Delete an event
   */
  const deleteEvent = async (id: string): Promise<void> => {
    try {
      setError(null);
      await EventService.deleteEvent(id);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      throw err;
    }
  };

  /**
   * Get a single event by ID
   */
  const getEventById = async (id: string): Promise<Event> => {
    try {
      setError(null);
      return await EventService.getEventById(id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event');
      throw err;
    }
  };

  /**
   * RSVP for an event
   */
  const rsvpForEvent = async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to RSVP');
    }

    try {
      setError(null);
      await RSVPService.addRSVP(user.uid, eventId);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      setError(err.message || 'Failed to RSVP for event');
      throw err;
    }
  };

  /**
   * Cancel RSVP for an event
   */
  const cancelRSVP = async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to cancel RSVP');
    }

    try {
      setError(null);
      await RSVPService.removeRSVP(user.uid, eventId);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      setError(err.message || 'Failed to cancel RSVP');
      throw err;
    }
  };

  /**
   * Check if current user has RSVP'd to an event
   */
  const isUserRSVPd = (eventId: string): boolean => {
    if (!user) return false;
    const event = events.find((e) => e.id === eventId);
    return event?.rsvps?.includes(user.uid) || false;
  };

  const value: EventsContextType = {
    events,
    myEvents,
    loading,
    error,
    refreshEvents,
    refreshMyEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    rsvpForEvent,
    cancelRSVP,
    isUserRSVPd,
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = (): EventsContextType => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};

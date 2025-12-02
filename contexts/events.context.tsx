import NetInfo from '@react-native-community/netinfo';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { EventService } from '../services/event.service';
import { RSVPService } from '../services/rsvp.service';
import { CreateEventInput, Event } from '../types/models';

/**
 * Check if device is currently online
 */
async function checkIsOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Get user-friendly error message for network/Firestore errors
 */
function getNetworkErrorMessage(error: any): string {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  // Network connectivity errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('offline') ||
    errorCode.includes('unavailable') ||
    errorCode === 'failed-precondition'
  ) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorCode.includes('deadline-exceeded')) {
    return 'Request timed out. Please try again.';
  }

  // Permission errors
  if (errorCode.includes('permission-denied')) {
    return 'You don\'t have permission to perform this action.';
  }

  // Not found errors
  if (errorCode.includes('not-found')) {
    return 'The requested event was not found.';
  }

  // Default error message
  return error?.message || 'Something went wrong. Please try again.';
}

/**
 * EventsContext type definition
 */
interface EventsContextType {
  events: Event[];
  myEvents: Event[];
  loading: boolean;
  error: string | null;
  isOfflineData: boolean;
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
  const [isOfflineData, setIsOfflineData] = useState<boolean>(false);

  /**
   * Subscribe to real-time event updates
   * Firestore automatically serves cached data when offline
   */
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Subscribe to all upcoming events
    // Firestore will serve cached data when offline automatically
    const unsubscribe = EventService.subscribeToEvents(
      (updatedEvents) => {
        setEvents(updatedEvents);
        setLoading(false);
        setIsOfflineData(false);
        
        // Update myEvents if user is authenticated
        if (user) {
          const userEvents = updatedEvents.filter((event) =>
            event.rsvps.includes(user.uid)
          );
          setMyEvents(userEvents);
        }
      },
      (subscriptionError) => {
        // Handle subscription errors gracefully
        console.error('Events subscription error:', subscriptionError);
        setError(getNetworkErrorMessage(subscriptionError));
        setLoading(false);
        // Keep showing cached data if available
        setIsOfflineData(events.length > 0);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user]);

  /**
   * Refresh events manually
   * When offline, Firestore will serve cached data automatically
   */
  const refreshEvents = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedEvents = await EventService.getEvents();
      setEvents(updatedEvents);
      setIsOfflineData(false);
    } catch (err: any) {
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      console.error('Error refreshing events:', err);
      // Keep showing cached data if available
      if (events.length > 0) {
        setIsOfflineData(true);
      }
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
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      console.error('Error refreshing my events:', err);
    }
  };

  /**
   * Create a new event
   * Requires network connection to sync to server
   */
  const createEvent = async (eventInput: CreateEventInput): Promise<Event> => {
    if (!user) {
      throw new Error('User must be authenticated to create events');
    }

    // Check network status before attempting write
    const online = await checkIsOnline();
    if (!online) {
      const errorMessage = 'You\'re offline. Please connect to the internet to create events.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      setError(null);
      const newEvent = await EventService.createEvent(eventInput, user.uid);
      // Real-time listener will update the events list automatically
      return newEvent;
    } catch (err: any) {
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Update an existing event
   * Requires network connection to sync to server
   */
  const updateEvent = async (
    id: string,
    updates: Partial<CreateEventInput>
  ): Promise<void> => {
    // Check network status before attempting write
    const online = await checkIsOnline();
    if (!online) {
      const errorMessage = 'You\'re offline. Please connect to the internet to update events.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      setError(null);
      await EventService.updateEvent(id, updates);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Delete an event
   * Requires network connection to sync to server
   */
  const deleteEvent = async (id: string): Promise<void> => {
    // Check network status before attempting write
    const online = await checkIsOnline();
    if (!online) {
      const errorMessage = 'You\'re offline. Please connect to the internet to delete events.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      setError(null);
      await EventService.deleteEvent(id);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
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
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * RSVP for an event
   * Requires network connection to ensure RSVP is synced to server
   */
  const rsvpForEvent = async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to RSVP');
    }

    // Check network status before attempting write
    const online = await checkIsOnline();
    if (!online) {
      const errorMessage = 'You\'re offline. Please connect to the internet to RSVP.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      setError(null);
      await RSVPService.addRSVP(user.uid, eventId);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  /**
   * Cancel RSVP for an event
   * Requires network connection to ensure cancellation is synced to server
   */
  const cancelRSVP = async (eventId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to cancel RSVP');
    }

    // Check network status before attempting write
    const online = await checkIsOnline();
    if (!online) {
      const errorMessage = 'You\'re offline. Please connect to the internet to cancel RSVP.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      setError(null);
      await RSVPService.removeRSVP(user.uid, eventId);
      // Real-time listener will update the events list automatically
    } catch (err: any) {
      const errorMessage = getNetworkErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
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
    isOfflineData,
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

import { Event } from '@/types/models';
import { Timestamp } from 'firebase/firestore';

/**
 * Check if an event date has passed
 * @param eventDate - Firestore Timestamp of the event
 * @returns True if the event date is in the past
 */
export function isEventPast(eventDate: Timestamp): boolean {
  const now = new Date();
  const eventDateObj = eventDate.toDate();
  return eventDateObj < now;
}

/**
 * Sort events with upcoming events first, then past events
 * Both groups are sorted by date (ascending for upcoming, descending for past)
 * @param events - Array of events to sort
 * @returns Sorted array of events
 */
export function sortEventsByStatus(events: Event[]): Event[] {
  const upcoming: Event[] = [];
  const past: Event[] = [];

  events.forEach((event) => {
    if (isEventPast(event.date)) {
      past.push(event);
    } else {
      upcoming.push(event);
    }
  });

  // Sort upcoming by date ascending (soonest first)
  upcoming.sort((a, b) => a.date.toMillis() - b.date.toMillis());
  
  // Sort past by date descending (most recent first)
  past.sort((a, b) => b.date.toMillis() - a.date.toMillis());

  return [...upcoming, ...past];
}

/**
 * Filter events by status
 * @param events - Array of events to filter
 * @param filter - Filter type: 'all', 'upcoming', or 'past'
 * @returns Filtered array of events
 */
export function filterEventsByStatus(
  events: Event[],
  filter: 'all' | 'upcoming' | 'past'
): Event[] {
  if (filter === 'all') {
    return events;
  }

  return events.filter((event) => {
    const isPast = isEventPast(event.date);
    return filter === 'past' ? isPast : !isPast;
  });
}

/**
 * Get attendance summary string for an event
 * @param event - Event object
 * @returns Formatted attendance string (e.g., "45/50 attended")
 */
export function getAttendanceSummary(event: Event): string {
  const attended = event.checkedIn.length;
  const rsvps = event.rsvps.length;
  return `${attended}/${rsvps} attended`;
}

export type EventFilter = 'all' | 'upcoming' | 'past';

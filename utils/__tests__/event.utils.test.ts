import { Event } from '@/types/models';
import { Timestamp } from 'firebase/firestore';
import {
    filterEventsByStatus,
    getAttendanceSummary,
    isEventPast,
    sortEventsByStatus
} from '../event.utils';

// Helper to create a mock Timestamp
const createMockTimestamp = (date: Date): Timestamp => ({
  toDate: () => date,
  toMillis: () => date.getTime(),
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  isEqual: () => false,
  valueOf: () => '',
  toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, type: 'timestamp' }),
} as unknown as Timestamp);

// Helper to create a mock Event
const createMockEvent = (id: string, date: Date, rsvps: string[] = [], checkedIn: string[] = []): Event => ({
  id,
  title: `Event ${id}`,
  description: 'Test event',
  date: createMockTimestamp(date),
  location: 'Test Location',
  createdBy: 'admin1',
  rsvps,
  checkedIn,
  createdAt: createMockTimestamp(new Date()),
  updatedAt: createMockTimestamp(new Date()),
});

describe('Event Utils', () => {
  describe('isEventPast', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const timestamp = createMockTimestamp(pastDate);
      expect(isEventPast(timestamp)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const timestamp = createMockTimestamp(futureDate);
      expect(isEventPast(timestamp)).toBe(false);
    });

    it('should return true for dates in the past by hours', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2); // 2 hours ago
      
      const timestamp = createMockTimestamp(pastDate);
      expect(isEventPast(timestamp)).toBe(true);
    });

    it('should return false for dates in the future by hours', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // 2 hours from now
      
      const timestamp = createMockTimestamp(futureDate);
      expect(isEventPast(timestamp)).toBe(false);
    });
  });

  describe('sortEventsByStatus', () => {
    it('should sort upcoming events before past events', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const events = [
        createMockEvent('past1', yesterday),
        createMockEvent('future1', tomorrow),
      ];
      
      const sorted = sortEventsByStatus(events);
      
      expect(sorted[0].id).toBe('future1');
      expect(sorted[1].id).toBe('past1');
    });

    it('should sort upcoming events by date ascending (soonest first)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const events = [
        createMockEvent('later', nextWeek),
        createMockEvent('sooner', tomorrow),
      ];
      
      const sorted = sortEventsByStatus(events);
      
      expect(sorted[0].id).toBe('sooner');
      expect(sorted[1].id).toBe('later');
    });

    it('should sort past events by date descending (most recent first)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const events = [
        createMockEvent('older', lastWeek),
        createMockEvent('recent', yesterday),
      ];
      
      const sorted = sortEventsByStatus(events);
      
      expect(sorted[0].id).toBe('recent');
      expect(sorted[1].id).toBe('older');
    });

    it('should handle empty array', () => {
      const sorted = sortEventsByStatus([]);
      expect(sorted).toEqual([]);
    });
  });

  describe('filterEventsByStatus', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const events = [
      createMockEvent('past1', yesterday),
      createMockEvent('future1', tomorrow),
    ];

    it('should return all events when filter is "all"', () => {
      const filtered = filterEventsByStatus(events, 'all');
      expect(filtered.length).toBe(2);
    });

    it('should return only upcoming events when filter is "upcoming"', () => {
      const filtered = filterEventsByStatus(events, 'upcoming');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('future1');
    });

    it('should return only past events when filter is "past"', () => {
      const filtered = filterEventsByStatus(events, 'past');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('past1');
    });

    it('should handle empty array', () => {
      expect(filterEventsByStatus([], 'all')).toEqual([]);
      expect(filterEventsByStatus([], 'upcoming')).toEqual([]);
      expect(filterEventsByStatus([], 'past')).toEqual([]);
    });
  });

  describe('getAttendanceSummary', () => {
    it('should return correct attendance summary', () => {
      const event = createMockEvent(
        'event1', 
        new Date(), 
        ['user1', 'user2', 'user3', 'user4', 'user5'], // 5 RSVPs
        ['user1', 'user2', 'user3'] // 3 checked in
      );
      
      expect(getAttendanceSummary(event)).toBe('3/5 attended');
    });

    it('should handle zero attendance', () => {
      const event = createMockEvent('event1', new Date(), ['user1', 'user2'], []);
      expect(getAttendanceSummary(event)).toBe('0/2 attended');
    });

    it('should handle no RSVPs', () => {
      const event = createMockEvent('event1', new Date(), [], []);
      expect(getAttendanceSummary(event)).toBe('0/0 attended');
    });

    it('should handle full attendance', () => {
      const event = createMockEvent(
        'event1', 
        new Date(), 
        ['user1', 'user2'], 
        ['user1', 'user2']
      );
      expect(getAttendanceSummary(event)).toBe('2/2 attended');
    });
  });
});

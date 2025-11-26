import { decodeQRData, encodeQRData, isValidQRData } from '../qr-code.utils';

describe('QR Code Utils', () => {
  describe('encodeQRData', () => {
    it('should encode user and event IDs into JSON string', () => {
      const userId = 'user123';
      const eventId = 'event456';
      
      const encoded = encodeQRData(userId, eventId);
      const parsed = JSON.parse(encoded);
      
      expect(parsed.userId).toBe(userId);
      expect(parsed.eventId).toBe(eventId);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.version).toBe('1.0');
    });

    it('should include current timestamp', () => {
      const beforeTime = Date.now();
      const encoded = encodeQRData('user1', 'event1');
      const afterTime = Date.now();
      
      const parsed = JSON.parse(encoded);
      
      expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(parsed.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('decodeQRData', () => {
    it('should decode valid QR data', () => {
      const userId = 'user123';
      const eventId = 'event456';
      const encoded = encodeQRData(userId, eventId);
      
      const result = decodeQRData(encoded);
      
      expect(result.isValid).toBe(true);
      expect(result.data?.userId).toBe(userId);
      expect(result.data?.eventId).toBe(eventId);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid JSON', () => {
      const result = decodeQRData('not valid json');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('unable to parse JSON');
    });

    it('should reject data with missing fields', () => {
      const invalidData = JSON.stringify({ userId: 'user1' });
      const result = decodeQRData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should reject data with invalid types', () => {
      const invalidData = JSON.stringify({
        userId: 123,
        eventId: 'event1',
        timestamp: Date.now(),
        version: '1.0',
      });
      const result = decodeQRData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid data types');
    });

    it('should reject future timestamps', () => {
      const futureData = JSON.stringify({
        userId: 'user1',
        eventId: 'event1',
        timestamp: Date.now() + 10000,
        version: '1.0',
      });
      const result = decodeQRData(futureData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('from the future');
    });
  });

  describe('isValidQRData', () => {
    it('should validate correct QR data structure', () => {
      const validData = {
        userId: 'user123',
        eventId: 'event456',
        timestamp: Date.now(),
        version: '1.0',
      };
      
      expect(isValidQRData(validData)).toBe(true);
    });

    it('should reject data with missing fields', () => {
      const invalidData = {
        userId: 'user123',
        eventId: 'event456',
      };
      
      expect(isValidQRData(invalidData)).toBe(false);
    });

    it('should reject data with wrong types', () => {
      const invalidData = {
        userId: 123,
        eventId: 'event456',
        timestamp: Date.now(),
        version: '1.0',
      };
      
      expect(isValidQRData(invalidData)).toBe(false);
    });

    it('should reject empty strings', () => {
      const invalidData = {
        userId: '',
        eventId: 'event456',
        timestamp: Date.now(),
        version: '1.0',
      };
      
      expect(isValidQRData(invalidData)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isValidQRData(null)).toBe(false);
      expect(isValidQRData(undefined)).toBe(false);
    });
  });
});

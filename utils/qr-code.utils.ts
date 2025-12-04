import { QRCodeData, QRValidationResult } from '@/types/models';

const QR_VERSION = '1.0';


export function encodeQRData(userId: string, eventId: string): string {
  const qrData: QRCodeData = {
    userId,
    eventId,
    timestamp: Date.now(),
    version: QR_VERSION,
  };
  
  return JSON.stringify(qrData);
}


export function decodeQRData(qrString: string): QRValidationResult {
  try {
    const data = JSON.parse(qrString) as QRCodeData;
    
    // Validate required fields
    if (!data.userId || !data.eventId || !data.timestamp || !data.version) {
      return {
        isValid: false,
        error: 'Missing required fields in QR code data',
      };
    }
    
    // Validate data types
    if (
      typeof data.userId !== 'string' ||
      typeof data.eventId !== 'string' ||
      typeof data.timestamp !== 'number' ||
      typeof data.version !== 'string'
    ) {
      return {
        isValid: false,
        error: 'Invalid data types in QR code',
      };
    }
    
    // Validate timestamp is not in the future
    if (data.timestamp > Date.now()) {
      return {
        isValid: false,
        error: 'Invalid timestamp: QR code is from the future',
      };
    }
    
    return {
      isValid: true,
      data,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid QR code format: unable to parse JSON',
    };
  }
}


export function isValidQRData(data: any): data is QRCodeData {
  return !!(
    data &&
    typeof data === 'object' &&
    typeof data.userId === 'string' &&
    typeof data.eventId === 'string' &&
    typeof data.timestamp === 'number' &&
    typeof data.version === 'string' &&
    data.userId.length > 0 &&
    data.eventId.length > 0 &&
    data.timestamp > 0
  );
}

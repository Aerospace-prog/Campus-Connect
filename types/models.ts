import { Timestamp } from 'firebase/firestore';


export type UserRole = 'student' | 'admin';


export interface User {
  uid: string;                    // Firebase Auth UID (document ID)
  email: string;
  name: string;
  role: UserRole;
  pushToken?: string;             // Expo push notification token
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface Event {
  id: string;                     // Auto-generated document ID
  title: string;
  description: string;
  date: Timestamp;                // Event date and time
  location: string;
  createdBy: string;              // Admin user UID
  rsvps: string[];                // Array of user UIDs who RSVP'd
  checkedIn: string[];            // Array of user UIDs who checked in
  imageUrl?: string;              // Optional event image
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface CreateEventInput {
  title: string;
  description: string;
  date: Date;
  location: string;
  imageUrl?: string;
}


export interface QRCodeData {
  userId: string;
  eventId: string;
  timestamp: number;              // Unix timestamp when QR was generated
  version: string;                // QR format version (e.g., "1.0")
}


export interface CheckInResult {
  success: boolean;
  message: string;
  userName?: string;
}


export interface QRValidationResult {
  isValid: boolean;
  data?: QRCodeData;
  error?: string;
}


export interface AttendanceData {
  eventId: string;
  totalRSVPs: number;
  totalCheckedIn: number;
  attendanceRate: number;
  rsvpUsers: string[];
  checkedInUsers: string[];
}


export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: {
    eventId?: string;
    [key: string]: any;
  };
}

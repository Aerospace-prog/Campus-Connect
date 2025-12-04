/**
 * Navigation type definitions for Expo Router
 */

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'event/[id]': { id: string };
  'create-event': undefined;
  'edit-event': { id: string };
  'send-notification': { eventId?: string };
  'qr-code/[eventId]': { eventId: string };
};

export type TabParamList = {
  'index': undefined;
  'my-events': undefined;
  'manage': undefined;
  'scanner': undefined;
  'profile': undefined;
};

export type AuthStackParamList = {
  'login': undefined;
  'signup': undefined;
};

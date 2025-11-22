/**
 * Navigation type definitions for Expo Router
 */

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  '(admin)': undefined;
  'event/[id]': { id: string };
};

export type TabParamList = {
  'index': undefined;
  'my-events': undefined;
  'profile': undefined;
};

export type AdminStackParamList = {
  'dashboard': undefined;
  'create-event': undefined;
  'scanner': { eventId?: string };
  'send-notification': { eventId: string };
};

export type AuthStackParamList = {
  'login': undefined;
  'signup': undefined;
};

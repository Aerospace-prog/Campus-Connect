import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Network status information
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * Pending operation for offline queue
 */
interface PendingOperation {
  id: string;
  type: 'rsvp' | 'cancelRsvp' | 'createEvent' | 'updateEvent' | 'deleteEvent';
  data: any;
  timestamp: number;
}

/**
 * NetworkContext type definition
 */
interface NetworkContextType {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  pendingOperations: PendingOperation[];
  addPendingOperation: (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => void;
  clearPendingOperations: () => void;
  getNetworkErrorMessage: (error: any) => string;
}

/**
 * Create the NetworkContext
 */
const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

/**
 * NetworkProvider Props
 */
interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * NetworkProvider - Provides network status and offline handling to the app
 */
export function NetworkProvider({ children }: NetworkProviderProps): React.ReactElement {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);

  useEffect(() => {
    let unsubscribe: NetInfoSubscription | null = null;

    const handleNetworkChange = (state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    };

    // Fetch initial network state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network state changes
    unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /**
   * Check if device is online
   */
  const isOnline = networkStatus.isConnected && networkStatus.isInternetReachable !== false;

  /**
   * Add a pending operation to the queue for later sync
   */
  const addPendingOperation = useCallback((operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
    const newOperation: PendingOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setPendingOperations((prev) => [...prev, newOperation]);
  }, []);

  /**
   * Clear all pending operations (after successful sync)
   */
  const clearPendingOperations = useCallback(() => {
    setPendingOperations([]);
  }, []);

  /**
   * Get user-friendly error message for network errors
   */
  const getNetworkErrorMessage = useCallback((error: any): string => {
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
      return 'The requested item was not found.';
    }

    // Already exists errors
    if (errorCode.includes('already-exists')) {
      return 'This item already exists.';
    }

    // Rate limiting
    if (errorCode.includes('resource-exhausted')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Firebase Auth errors
    if (errorCode.includes('auth/')) {
      if (errorCode.includes('wrong-password') || errorCode.includes('user-not-found')) {
        return 'Invalid email or password.';
      }
      if (errorCode.includes('email-already-in-use')) {
        return 'This email is already registered.';
      }
      if (errorCode.includes('weak-password')) {
        return 'Password is too weak. Please use a stronger password.';
      }
      if (errorCode.includes('invalid-email')) {
        return 'Please enter a valid email address.';
      }
    }

    // Default error message
    return error?.message || 'Something went wrong. Please try again.';
  }, []);

  const value: NetworkContextType = {
    networkStatus,
    isOnline,
    pendingOperations,
    addPendingOperation,
    clearPendingOperations,
    getNetworkErrorMessage,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * useNetwork hook - Access network context
 * Error if used outside of NetworkProvider
 */
export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);

  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }

  return context;
}

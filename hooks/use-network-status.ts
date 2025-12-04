import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';


export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * useNetworkStatus hook - Detects online/offline state
 * 
 * This hook monitors the device's network connectivity and provides
 * real-time updates when the connection status changes.
 * 
 * returns NetworkStatus object with connection information
 */
export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

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

  return networkStatus;
}

/**
 * Check if the device is currently online
 * @param status NetworkStatus object
 * @returns true if device has internet connectivity
 */
export function isOnline(status: NetworkStatus): boolean {
  return status.isConnected && status.isInternetReachable !== false;
}

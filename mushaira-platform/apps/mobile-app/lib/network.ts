import { useEffect, useState, useCallback } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  const check = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected ?? false);
    } catch {
      setIsOnline(true); // default to online on error
    }
  }, []);

  useEffect(() => {
    check();
    // Poll every 5 seconds — expo-network has no event listener API
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [check]);

  return { isOnline };
}

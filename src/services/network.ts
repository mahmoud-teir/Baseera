import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** Live connectivity. `isInternetReachable` may be null while unknown — treat as online. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false));
    return unsub;
  }, []);
  return online;
}

export async function isOnline(): Promise<boolean> {
  const s = await NetInfo.fetch();
  return s.isConnected !== false && s.isInternetReachable !== false;
}

export async function isOnWifi(): Promise<boolean> {
  const s = await NetInfo.fetch();
  return s.type === 'wifi' || s.type === 'ethernet';
}

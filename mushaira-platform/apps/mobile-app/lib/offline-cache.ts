import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'mushaira:cache:';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export const CACHE_TTL = {
  EVENTS_LIST: 60 * 60 * 1000,        // 1 hour
  TICKETS_LIST: 5 * 60 * 1000,        // 5 minutes
  TICKET_DETAIL: 7 * 24 * 60 * 60 * 1000, // 7 days (QR pass)
  PROFILE: 24 * 60 * 60 * 1000,       // 24 hours
  FOREVER: Number.MAX_SAFE_INTEGER,
} as const;

export const CACHE_KEYS = {
  EVENTS_LIST: (search?: string) => `events:list:${search ?? ''}`,
  TICKETS_LIST: 'tickets:list',
  TICKET_DETAIL: (id: string) => `ticket:${id}`,
  PROFILE: 'profile:me',
  QR_LOCAL_URI: (registrationId: string) => `qr:${registrationId}:localUri`,
} as const;

export const offlineCache = {
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() > entry.expiresAt) {
        await AsyncStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  async getStale<T>(key: string): Promise<T | null> {
    // Returns cached data even if expired — useful for offline fallback
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      return entry.data;
    } catch {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(PREFIX + key);
  },

  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  },
};

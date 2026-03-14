import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { EventCard } from '@/components/EventCard';
import { eventsApi } from '@/lib/api';
import { offlineCache, CACHE_KEYS, CACHE_TTL } from '@/lib/offline-cache';
import { useNetworkStatus } from '@/lib/network';
import { IEvent } from '@/constants/types';

export default function HomeScreen() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const { isOnline } = useNetworkStatus();
  const router = useRouter();

  const fetchEvents = useCallback(async (q?: string) => {
    const cacheKey = CACHE_KEYS.EVENTS_LIST(q);

    // Show cached data immediately while fetching
    const cached = await offlineCache.getStale<IEvent[]>(cacheKey);
    if (cached) {
      setEvents(cached);
      setFromCache(true);
      setLoading(false);
    }

    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await eventsApi.list(q ? { search: q } : undefined);
      const data = res.data.data.items ?? [];
      setEvents(data);
      setFromCache(false);
      await offlineCache.set(cacheKey, data, CACHE_TTL.EVENTS_LIST);
    } catch {
      // stay with cached data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    const t = setTimeout(() => fetchEvents(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(search || undefined);
  };

  if (loading && events.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search events or venues…"
          placeholderTextColor={Colors.text.muted}
        />
        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={Colors.text.muted}
            onPress={() => setSearch('')}
          />
        )}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Upcoming Events</Text>
            {fromCache && !isOnline && (
              <View style={styles.cachedBadge}>
                <Ionicons name="time-outline" size={12} color={Colors.text.muted} />
                <Text style={styles.cachedText}>Showing saved events</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>
              {!isOnline
                ? 'No cached events. Connect to the internet to load events.'
                : search
                ? 'No events found for your search.'
                : 'No events available right now.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    height: 44,
  },
  searchIcon: { marginRight: Spacing.sm },
  search: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text.primary,
  },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  cachedText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

export default function HomeScreen() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const fetchEvents = useCallback(async (q?: string) => {
    try {
      const res = await eventsApi.list(q ? { search: q } : undefined);
      setEvents(res.data.data.items ?? []);
    } catch {
      // silently fail on network error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchEvents(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(search || undefined);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search events or venues…"
          placeholderTextColor={Colors.text.muted}
        />
        {search.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={Colors.text.muted}
            onPress={() => setSearch('')}
          />
        )}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.heading}>Upcoming Events</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>
              {search ? 'No events found for your search.' : 'No events available right now.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    height: 44,
  },
  searchIcon: { marginRight: Spacing.sm },
  search: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text.primary,
  },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});

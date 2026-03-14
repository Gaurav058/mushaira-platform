import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { TicketCard } from '@/components/TicketCard';
import { registrationsApi } from '@/lib/api';
import { offlineCache, CACHE_KEYS, CACHE_TTL } from '@/lib/offline-cache';
import { useNetworkStatus } from '@/lib/network';
import { IRegistration } from '@/constants/types';

export default function TicketsScreen() {
  const [registrations, setRegistrations] = useState<IRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const { isOnline } = useNetworkStatus();
  const router = useRouter();

  const fetchRegistrations = useCallback(async () => {
    // Show cached data immediately
    const cached = await offlineCache.getStale<IRegistration[]>(CACHE_KEYS.TICKETS_LIST);
    if (cached) {
      setRegistrations(cached);
      setFromCache(true);
      setLoading(false);
    }

    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await registrationsApi.getMy();
      const data = res.data.data.items ?? [];
      setRegistrations(data);
      setFromCache(false);
      await offlineCache.set(CACHE_KEYS.TICKETS_LIST, data, CACHE_TTL.TICKETS_LIST);
    } catch {
      // stay with cached
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const onRefresh = () => { setRefreshing(true); fetchRegistrations(); };

  if (loading && registrations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={registrations}
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
          <Text style={styles.heading}>My Tickets</Text>
          {fromCache && !isOnline && (
            <View style={styles.offlineRow}>
              <Ionicons name="time-outline" size={12} color={Colors.text.muted} />
              <Text style={styles.offlineText}>Showing saved tickets</Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="ticket-outline" size={48} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>No tickets yet</Text>
          <Text style={styles.emptyText}>
            {!isOnline
              ? 'Connect to the internet to load your tickets.'
              : 'Register for an event to see your tickets here.'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TicketCard
          registration={item}
          onPress={() => router.push(`/ticket/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    minHeight: '100%',
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  offlineText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text.muted },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text.primary,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: Spacing.lg,
  },
});

export default function TicketsScreen() {
  const [registrations, setRegistrations] = useState<IRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchRegistrations = useCallback(async () => {
    try {
      const res = await registrationsApi.getMy();
      setRegistrations(res.data.data.items ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const onRefresh = () => { setRefreshing(true); fetchRegistrations(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={registrations}
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
        <Text style={styles.heading}>My Tickets</Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="ticket-outline" size={48} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>No tickets yet</Text>
          <Text style={styles.emptyText}>
            Register for an event to see your tickets here.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TicketCard
          registration={item}
          onPress={() => router.push(`/ticket/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    minHeight: '100%',
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text.primary,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
});

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { eventsApi } from '@/lib/api';
import { IEvent, EventStatus } from '@/constants/types';
import { formatDate, formatTime, isRegistrationOpen } from '@/lib/utils';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    eventsApi.getById(id).then(({ data }) => {
      setEvent(data.data as IEvent);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Event not found.</Text>
      </View>
    );
  }

  const regOpen = isRegistrationOpen(
    event.registration_start,
    event.registration_end,
  );
  const isCancelled = event.status === EventStatus.CANCELLED;
  const isCompleted = event.status === EventStatus.COMPLETED;
  const canRegister = regOpen && !isCancelled && !isCompleted;
  const fillPct = Math.round((event._count.registrations / event.capacity) * 100);
  const isLive = event.status === EventStatus.LIVE;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Poster */}
      <View style={styles.posterWrap}>
        {event.poster ? (
          <Image source={{ uri: event.poster }} style={styles.poster} contentFit="cover" />
        ) : (
          <View style={styles.posterFallback}>
            <Text style={styles.posterFallbackText}>{event.title.charAt(0)}</Text>
          </View>
        )}
        {isLive && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE NOW</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Header */}
        <Text style={styles.organiser}>{event.organiser.name}</Text>
        <Text style={styles.title}>{event.title}</Text>
        {event.subtitle ? (
          <Text style={styles.subtitle}>{event.subtitle}</Text>
        ) : null}

        {/* Info Grid */}
        <View style={styles.infoCard}>
          <InfoRow icon="calendar-outline" label="Date" value={formatDate(event.date_time)} />
          <InfoRow icon="time-outline" label="Time" value={formatTime(event.date_time)} />
          <InfoRow icon="location-outline" label="Venue" value={event.venue} />
          {event.map_link ? (
            <InfoRow
              icon="navigate-outline"
              label="Directions"
              value="Open in Maps"
              onPress={() => Linking.openURL(event.map_link!)}
              isLink
            />
          ) : null}
        </View>

        {/* Capacity Bar */}
        <View style={styles.capacityCard}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityLabel}>Registration</Text>
            <Text style={styles.capacityCount}>
              {event._count.registrations} / {event.capacity}
            </Text>
          </View>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(fillPct, 100)}%`,
                  backgroundColor: fillPct >= 90 ? Colors.status.error : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.capacityNote}>
            {canRegister
              ? `Registration open until ${formatDate(event.registration_end)}`
              : isCancelled
              ? 'This event has been cancelled'
              : isCompleted
              ? 'This event has ended'
              : `Registration closed on ${formatDate(event.registration_end)}`}
          </Text>
        </View>

        {/* Details */}
        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        {/* Family & Approval */}
        <View style={styles.tagsRow}>
          {event.family_allowed && (
            <View style={styles.tag}>
              <Ionicons name="people-outline" size={14} color={Colors.primary} />
              <Text style={styles.tagText}>Family Welcome</Text>
            </View>
          )}
          {event.approval_required && (
            <View style={styles.tag}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
              <Text style={styles.tagText}>Approval Required</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <Button
          label={canRegister ? 'Register for this Event' : 'Registration Closed'}
          onPress={() => router.push(`/register/${event.id}`)}
          disabled={!canRegister}
          fullWidth
          variant={canRegister ? 'primary' : 'outline'}
          style={styles.cta}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon, label, value, onPress, isLink,
}: {
  icon: string; label: string; value: string; onPress?: () => void; isLink?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={16} color={Colors.primary} style={infoStyles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text
          style={[infoStyles.value, isLink && infoStyles.link]}
          onPress={onPress}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  icon: { marginRight: Spacing.sm, marginTop: 2 },
  label: { fontFamily: Fonts.body, fontSize: 11, color: Colors.text.muted },
  value: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text.primary },
  link: { color: Colors.primary, textDecorationLine: 'underline' },
});

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  errorText: { fontFamily: Fonts.body, color: Colors.text.muted },
  container: { flex: 1, backgroundColor: Colors.background },
  posterWrap: { position: 'relative' },
  poster: { width: '100%', height: 220 },
  posterFallback: {
    width: '100%', height: 220,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  posterFallbackText: { fontFamily: Fonts.heading, fontSize: 72, color: 'rgba(255,255,255,0.4)' },
  livePill: {
    position: 'absolute', bottom: Spacing.md, left: Spacing.md,
    backgroundColor: Colors.status.error,
    borderRadius: Radius.full,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 4, gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text.inverse },
  liveLabel: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.text.inverse, letterSpacing: 1 },
  body: { padding: Spacing.lg },
  organiser: {
    fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.accent,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  title: { fontFamily: Fonts.heading, fontSize: 26, color: Colors.text.primary, lineHeight: 34, marginBottom: 6 },
  subtitle: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text.secondary, marginBottom: Spacing.md },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  capacityCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  capacityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  capacityLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.text.primary },
  capacityCount: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.primary },
  bar: { height: 8, backgroundColor: Colors.surfaceBorder, borderRadius: 4, marginBottom: Spacing.xs },
  barFill: { height: '100%', borderRadius: 4 },
  capacityNote: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text.muted },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Fonts.heading, fontSize: 17, color: Colors.text.primary, marginBottom: Spacing.sm },
  description: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text.secondary, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.lg },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  tagText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.primary },
  cta: { marginBottom: Spacing.xl },
});

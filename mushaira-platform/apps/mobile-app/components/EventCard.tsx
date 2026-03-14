import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { IEvent } from '@/constants/types';
import { formatDate, formatTime } from '@/lib/utils';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

interface EventCardProps {
  event: IEvent;
  onPress: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const isLive = event.status === 'LIVE';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Poster */}
      <View style={styles.posterWrap}>
        {event.poster ? (
          <Image
            source={{ uri: event.poster }}
            style={styles.poster}
            contentFit="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.posterPlaceholderText}>
              {event.title.charAt(0)}
            </Text>
          </View>
        )}
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.organiser} numberOfLines={1}>
          {event.organiser.name}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        {event.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {event.subtitle}
          </Text>
        ) : null}

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={Colors.text.muted}
            />
            <Text style={styles.metaText}>{formatDate(event.date_time)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={13}
              color={Colors.text.muted}
            />
            <Text style={styles.metaText}>{formatTime(event.date_time)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={Colors.text.muted}
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.seats}>
            {event._count.registrations} / {event.capacity} registered
          </Text>
          <View style={styles.arrow}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.primary}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#5B2C83',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  posterWrap: { position: 'relative' },
  poster: { width: '100%', height: 160 },
  posterPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: {
    fontFamily: Fonts.heading,
    fontSize: 56,
    color: 'rgba(255,255,255,0.6)',
  },
  liveBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.status.error,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text.inverse,
  },
  liveText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.text.inverse,
    letterSpacing: 1,
  },
  content: { padding: Spacing.md },
  organiser: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.text.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  meta: { gap: 4, marginBottom: Spacing.sm },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  seats: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text.muted,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { IRegistration, RegistrationStatus } from '@/constants/types';
import {
  formatDate,
  formatTime,
  registrationStatusColor,
  registrationStatusLabel,
} from '@/lib/utils';

interface TicketCardProps {
  registration: IRegistration;
  onPress: () => void;
}

export function TicketCard({ registration, onPress }: TicketCardProps) {
  const { event, status, category } = registration;
  const statusColor = registrationStatusColor(status as RegistrationStatus);
  const hasQr = status === RegistrationStatus.APPROVED || status === RegistrationStatus.CHECKED_IN;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Status stripe */}
      <View style={[styles.stripe, { backgroundColor: statusColor }]} />

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            {category ? (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: category.color + '20' },
                ]}
              >
                <Text style={[styles.categoryText, { color: category.color }]}>
                  {category.name}
                </Text>
              </View>
            ) : null}
          </View>
          {hasQr && (
            <View style={styles.qrIcon}>
              <Ionicons name="qr-code" size={28} color={Colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.text.muted} />
            <Text style={styles.metaText}>{formatDate(event.date_time)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={Colors.text.muted} />
            <Text style={styles.metaText}>{formatTime(event.date_time)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={Colors.text.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {registrationStatusLabel(status as RegistrationStatus)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#5B2C83',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  stripe: { width: 5 },
  body: { flex: 1, padding: Spacing.md },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  info: { flex: 1, marginRight: Spacing.sm },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  categoryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
  },
  qrIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { gap: 4, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
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
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
});

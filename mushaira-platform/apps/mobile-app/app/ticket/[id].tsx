import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { registrationsApi } from '@/lib/api';
import { offlineCache, CACHE_KEYS, CACHE_TTL } from '@/lib/offline-cache';
import { cacheQrImage, getCachedQrUri } from '@/lib/qr-cache';
import { useNetworkStatus } from '@/lib/network';
import { IRegistration, IQRPass, RegistrationStatus } from '@/constants/types';
import {
  formatDateTime,
  registrationStatusColor,
  registrationStatusLabel,
} from '@/lib/utils';

interface CachedTicket {
  registration: IRegistration;
  qrPass: IQRPass | null;
  localQrUri: string | null;
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [registration, setRegistration] = useState<IRegistration | null>(null);
  const [qrPass, setQrPass] = useState<IQRPass | null>(null);
  const [localQrUri, setLocalQrUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const fetchData = async () => {
      // Try cache first so screen loads immediately
      const cached = await offlineCache.getStale<CachedTicket>(CACHE_KEYS.TICKET_DETAIL(id));
      if (cached) {
        setRegistration(cached.registration);
        setQrPass(cached.qrPass);
        setLocalQrUri(cached.localQrUri);
        setLoading(false);
        if (!isOnline) return;
      }

      if (!isOnline) {
        setLoading(false);
        return;
      }

      try {
        const regRes = await registrationsApi.getById(id);
        const reg = regRes.data.data as IRegistration;
        setRegistration(reg);

        let pass: IQRPass | null = null;
        let qrUri: string | null = null;

        if (
          reg.status === RegistrationStatus.APPROVED ||
          reg.status === RegistrationStatus.CHECKED_IN
        ) {
          const qrRes = await registrationsApi.getQrPass(id);
          pass = qrRes.data.data as IQRPass;
          setQrPass(pass);

          // Download QR image to local filesystem for offline use
          if (pass?.qr_image_url) {
            try {
              qrUri = await cacheQrImage(pass.qr_image_url, id);
              setLocalQrUri(qrUri);
            } catch {
              // Couldn't download image — use URL directly when online
            }
          }
        }

        // Persist full ticket to cache
        await offlineCache.set<CachedTicket>(
          CACHE_KEYS.TICKET_DETAIL(id),
          { registration: reg, qrPass: pass, localQrUri: qrUri },
          CACHE_TTL.TICKET_DETAIL,
        );
      } catch {
        // already showing cached data if available
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isOnline]);

  // Resolve QR image source: prefer local file, fall back to URL (when online)
  const qrImageSource = localQrUri
    ? { uri: localQrUri }
    : qrPass?.qr_image_url && isOnline
    ? { uri: qrPass.qr_image_url }
    : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!registration) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Ticket not found.</Text>
      </View>
    );
  }

  const { event, status, category } = registration;
  const statusColor = registrationStatusColor(status as RegistrationStatus);
  const hasQR =
    status === RegistrationStatus.APPROVED ||
    status === RegistrationStatus.CHECKED_IN;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Ticket Header */}
      <View style={[styles.ticketHeader, { borderColor: statusColor }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusLabel, { color: statusColor }]}>
          {registrationStatusLabel(status as RegistrationStatus)}
        </Text>
      </View>

      {/* Event Info */}
      <View style={styles.card}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.text.muted} />
          <Text style={styles.infoText}>{formatDateTime(event.date_time)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={Colors.text.muted} />
          <Text style={styles.infoText}>{event.venue}</Text>
        </View>
        {category && (
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: (category.color ?? Colors.primary) + '22' },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: category.color ?? Colors.primary },
              ]}
            >
              {category.name}
            </Text>
          </View>
        )}
      </View>

      {/* QR Code */}
      {hasQR && qrPass ? (
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Your Entry Pass</Text>
          <Text style={styles.qrSub}>
            Present this QR code at the gate for entry
          </Text>
          {/* Offline notice if we only have local URI */}
          {!isOnline && localQrUri && (
            <View style={styles.offlineQrNote}>
              <Ionicons name="checkmark-circle-outline" size={13} color="#27AE60" />
              <Text style={styles.offlineQrText}>QR saved for offline use ✓</Text>
            </View>
          )}
          {!isOnline && !localQrUri && (
            <View style={styles.offlineQrNote}>
              <Ionicons name="warning-outline" size={13} color="#E67E22" />
              <Text style={[styles.offlineQrText, { color: '#E67E22' }]}>
                Connect to internet to load QR pass
              </Text>
            </View>
          )}
          <View style={styles.qrWrap}>
            {qrImageSource ? (
              <Image
                source={qrImageSource}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.qrImage, styles.qrPlaceholder]}>
                <Ionicons name="qr-code-outline" size={48} color={Colors.text.muted} />
              </View>
            )}
            {qrPass.is_used && (
              <View style={styles.usedOverlay}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.status.success} />
                <Text style={styles.usedText}>Entry Granted</Text>
              </View>
            )}
          </View>
          {qrPass.expires_at && (
            <Text style={styles.expiry}>
              Valid until {formatDateTime(qrPass.expires_at)}
            </Text>
          )}
          {!qrPass.is_used && (
            <Button
              label="Share Ticket"
              variant="outline"
              onPress={() =>
                Share.share({
                  message: `My ticket for ${event.title} on ${formatDateTime(event.date_time)} at ${event.venue}`,
                })
              }
              style={styles.shareBtn}
            />
          )}
        </View>
      ) : (
        <View style={styles.pendingCard}>
          <Ionicons
            name={
              status === RegistrationStatus.PENDING
                ? 'hourglass-outline'
                : status === RegistrationStatus.WAITLIST
                ? 'list-outline'
                : 'close-circle-outline'
            }
            size={40}
            color={statusColor}
          />
          <Text style={[styles.pendingTitle, { color: statusColor }]}>
            {registrationStatusLabel(status as RegistrationStatus)}
          </Text>
          <Text style={styles.pendingDesc}>
            {status === RegistrationStatus.PENDING &&
              'Your registration is awaiting organiser approval. Your QR pass will appear here once approved.'}
            {status === RegistrationStatus.WAITLIST &&
              'You are on the waitlist. We will notify you if a spot becomes available.'}
            {status === RegistrationStatus.REJECTED &&
              'Your registration was not approved for this event.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: Fonts.body, color: Colors.text.muted },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  eventTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text.secondary, flex: 1 },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  categoryText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  qrCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  qrTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  qrSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  qrWrap: { position: 'relative', marginBottom: Spacing.md },
  qrImage: { width: 240, height: 240, borderRadius: Radius.md },
  qrPlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  offlineQrNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  offlineQrText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#27AE60',
  },
  usedOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  usedText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.status.success,
  },
  expiry: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: Spacing.md,
  },
  shareBtn: { width: '100%' },
  pendingCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  pendingTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  pendingDesc: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

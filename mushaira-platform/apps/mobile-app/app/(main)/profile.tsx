import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';
import { IUserProfile } from '@/constants/types';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    city: '',
    profession: '',
  });
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    userApi.getProfile().then(({ data }) => {
      const p = data.data as IUserProfile;
      setProfile(p);
      setForm({
        full_name: p.full_name ?? '',
        email: p.email ?? '',
        city: p.city ?? '',
        profession: p.profession ?? '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userApi.updateProfile(
        Object.fromEntries(
          Object.entries(form).filter(([, v]) => v.trim() !== ''),
        ),
      );
      setProfile(data.data as IUserProfile);
      setEditing(false);
    } catch (err) {
      Alert.alert('Update Failed', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(profile?.full_name ?? profile?.mobile_number ?? 'G').charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.name}>
        {profile?.full_name ?? 'Guest User'}
      </Text>
      <Text style={styles.mobile}>{profile?.mobile_number}</Text>

      {/* Role Badge */}
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{profile?.role ?? 'GUEST'}</Text>
      </View>

      {/* Family Members */}
      <TouchableOpacity
        style={styles.actionRow}
        onPress={() => router.push('/family')}
      >
        <View style={styles.actionIcon}>
          <Ionicons name="people-outline" size={20} color={Colors.primary} />
        </View>
        <Text style={styles.actionLabel}>Family Members</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
      </TouchableOpacity>

      {/* Edit Profile */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Profile Details</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Input
              label="Full Name"
              value={form.full_name}
              onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
              placeholder="Ahmed Rashid"
            />
            <Input
              label="Email"
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="ahmed@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="City"
              value={form.city}
              onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
              placeholder="New Delhi"
            />
            <Input
              label="Profession"
              value={form.profession}
              onChangeText={(v) => setForm((f) => ({ ...f, profession: v }))}
              placeholder="Poet, Writer…"
            />
            <View style={styles.editActions}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setEditing(false)}
                style={styles.editBtn2}
              />
              <Button
                label="Save"
                onPress={handleSave}
                loading={saving}
                style={styles.editBtn2}
              />
            </View>
          </>
        ) : (
          <>
            <ProfileRow icon="person-outline" label="Name" value={profile?.full_name ?? '—'} />
            <ProfileRow icon="mail-outline" label="Email" value={profile?.email ?? '—'} />
            <ProfileRow icon="location-outline" label="City" value={profile?.city ?? '—'} />
            <ProfileRow icon="briefcase-outline" label="Profession" value={profile?.profession ?? '—'} />
          </>
        )}
      </View>

      {/* Logout */}
      <Button
        label="Log Out"
        variant="outline"
        onPress={handleLogout}
        fullWidth
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={16} color={Colors.text.muted} />
      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.accent },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  mobile: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.primaryLight + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginBottom: Spacing.xl,
  },
  roleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.primaryLight,
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionLabel: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text.primary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Colors.text.primary,
  },
  editBtn: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  editBtn2: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  rowValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  logoutBtn: { borderColor: Colors.status.error },
});

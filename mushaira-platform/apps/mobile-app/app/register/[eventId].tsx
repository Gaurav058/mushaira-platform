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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { eventsApi, registrationsApi, userApi } from '@/lib/api';
import { ICategory, IFamilyMember } from '@/constants/types';
import { getErrorMessage } from '@/lib/utils';

export default function RegisterScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [familyMembers, setFamilyMembers] = useState<IFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([eventsApi.getCategories(), userApi.getFamilyMembers()])
      .then(([catRes, famRes]) => {
        setCategories(catRes.data.data ?? []);
        setFamilyMembers(famRes.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleFamily = (id: string) => {
    setSelectedFamily((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await registrationsApi.register(eventId, {
        category_id: selectedCategory ?? undefined,
        family_member_ids: selectedFamily.length > 0 ? selectedFamily : undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        'Registration Submitted',
        'Your registration has been received. Check My Tickets for status updates.',
        [{ text: 'View Tickets', onPress: () => router.replace('/(main)/tickets') }],
      );
    } catch (err) {
      Alert.alert('Registration Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
      keyboardShouldPersistTaps="handled"
    >
      {/* Category */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          <Text style={styles.sectionHint}>
            Choose your registration tier
          </Text>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.optionRow,
                selectedCategory === cat.id && styles.optionSelected,
              ]}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id,
                )
              }
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: cat.color ?? Colors.primary },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.optionName}>{cat.name}</Text>
                {cat.description ? (
                  <Text style={styles.optionDesc}>{cat.description}</Text>
                ) : null}
              </View>
              {selectedCategory === cat.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Family Members */}
      {familyMembers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bring Family Members</Text>
          <Text style={styles.sectionHint}>
            Select family members to include in this registration
          </Text>
          {familyMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.optionRow,
                selectedFamily.includes(member.id) && styles.optionSelected,
              ]}
              onPress={() => toggleFamily(member.id)}
              activeOpacity={0.8}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {member.full_name.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionName}>{member.full_name}</Text>
                {member.relation ? (
                  <Text style={styles.optionDesc}>{member.relation}</Text>
                ) : null}
              </View>
              {selectedFamily.includes(member.id) && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={Colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Notes */}
      <View style={styles.section}>
        <Input
          label="Special Requests (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Wheelchair access, dietary requirements…"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 80 }}
        />
      </View>

      <Button
        label="Submit Registration"
        onPress={handleSubmit}
        loading={submitting}
        fullWidth
        style={styles.cta}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F5EDFF',
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  optionName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  optionDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
  },
  cta: { marginTop: Spacing.sm },
});

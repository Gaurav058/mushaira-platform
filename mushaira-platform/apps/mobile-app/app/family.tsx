import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/lib/api';
import { IFamilyMember } from '@/constants/types';
import { getErrorMessage } from '@/lib/utils';

export default function FamilyScreen() {
  const [members, setMembers] = useState<IFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    relation: '',
    age: '',
  });

  const fetchMembers = () => {
    userApi.getFamilyMembers().then(({ data }) => {
      setMembers(data.data ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Required', 'Please enter a name for the family member.');
      return;
    }
    setSaving(true);
    try {
      await userApi.addFamilyMember({
        full_name: form.full_name.trim(),
        relation: form.relation.trim() || undefined,
        age: form.age ? parseInt(form.age, 10) : undefined,
      });
      setForm({ full_name: '', relation: '', age: '' });
      setAdding(false);
      fetchMembers();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (member: IFamilyMember) =>
    Alert.alert(
      'Remove Member',
      `Remove ${member.full_name} from your family list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.removeFamilyMember(member.id);
              fetchMembers();
            } catch (err) {
              Alert.alert('Error', getErrorMessage(err));
            }
          },
        },
      ],
    );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Text style={styles.hint}>
                Add family members you may bring to events. You can select them during registration.
              </Text>
              {adding && (
                <View style={styles.addCard}>
                  <Text style={styles.addTitle}>New Family Member</Text>
                  <Input
                    label="Full Name *"
                    value={form.full_name}
                    onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
                    placeholder="Name"
                    autoFocus
                  />
                  <Input
                    label="Relation"
                    value={form.relation}
                    onChangeText={(v) => setForm((f) => ({ ...f, relation: v }))}
                    placeholder="Spouse, Child, Parent…"
                  />
                  <Input
                    label="Age"
                    value={form.age}
                    onChangeText={(v) => setForm((f) => ({ ...f, age: v }))}
                    placeholder="30"
                    keyboardType="number-pad"
                  />
                  <View style={styles.addActions}>
                    <Button
                      label="Cancel"
                      variant="outline"
                      onPress={() => setAdding(false)}
                      style={styles.addBtn}
                    />
                    <Button
                      label="Save"
                      onPress={handleAdd}
                      loading={saving}
                      style={styles.addBtn}
                    />
                  </View>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            !adding ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={40} color={Colors.text.muted} />
                <Text style={styles.emptyText}>No family members added yet.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            !adding ? (
              <Button
                label="Add Family Member"
                variant="outline"
                onPress={() => setAdding(true)}
                fullWidth
                style={styles.addMemberBtn}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{item.full_name}</Text>
                {item.relation ? (
                  <Text style={styles.memberMeta}>{item.relation}</Text>
                ) : null}
                {item.age ? (
                  <Text style={styles.memberMeta}>Age: {item.age}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(item)}
                style={styles.removeBtn}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  addCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  addTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  addActions: { flexDirection: 'row', gap: Spacing.sm },
  addBtn: { flex: 1 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: Colors.primary,
  },
  memberName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text.primary,
  },
  memberMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text.muted,
  },
  removeBtn: {
    padding: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.muted,
  },
  addMemberBtn: { marginTop: Spacing.md },
});

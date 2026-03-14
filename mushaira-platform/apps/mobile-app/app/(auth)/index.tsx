import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function PhoneScreen() {
  const [mobile, setMobile] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleContinue = async () => {
    setError('');
    const trimmed = mobile.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      setError('Enter a valid number with country code (e.g. +919876543210)');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp(trimmed);
      router.push({ pathname: '/(auth)/verify', params: { mobile: trimmed } });
    } catch (err) {
      Alert.alert('Could Not Send OTP', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" backgroundColor={Colors.primary} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.brand}>
          <Text style={styles.logo}>Mushaira</Text>
          <Text style={styles.tagline}>Poetry & Literary Events Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.sub}>
            Enter your mobile number to receive a one-time verification code.
          </Text>

          <Input
            label="Mobile Number"
            value={mobile}
            onChangeText={(t) => { setMobile(t); setError(''); }}
            keyboardType="phone-pad"
            placeholder="+919876543210"
            hint="Include country code (e.g. +91 for India)"
            error={error}
            autoFocus
            maxLength={16}
          />

          <Button
            label={loading ? 'Sending…' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
            fullWidth
          />
        </View>

        <Text style={styles.terms}>
          By continuing you agree to our Terms of Service
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: {
    fontFamily: Fonts.heading,
    fontSize: 44,
    color: Colors.accent,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 21,
    marginBottom: Spacing.xl,
  },
  terms: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});

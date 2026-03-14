import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/utils';

export default function VerifyScreen() {
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    if (timer === 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const handleChange = (val: string, i: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (!val && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the full 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(mobile, code);
      const { access_token, refresh_token } = data.data;
      await login(access_token, refresh_token);
      router.replace('/(main)');
    } catch (err) {
      Alert.alert('Verification Failed', getErrorMessage(err));
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await authApi.sendOtp(mobile);
      setOtp(['', '', '', '', '', '']);
      setTimer(60);
      inputs.current[0]?.focus();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brand}>
        <Text style={styles.logo}>Mushaira</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Enter OTP</Text>
        <Text style={styles.sub}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.mobile}>{mobile}</Text>
        </Text>

        {/* OTP Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              style={[styles.box, digit ? styles.boxFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Button
          label="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          fullWidth
          style={{ marginBottom: Spacing.md }}
        />

        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={[styles.resend, timer > 0 && styles.resendDisabled]}>
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.change}>
          <Text style={styles.changeText}>Change Number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  brand: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontFamily: Fonts.heading, fontSize: 38, color: Colors.accent },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  mobile: { fontFamily: Fonts.bodySemiBold, color: Colors.primary },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  box: {
    width: 46,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: Fonts.bodyBold,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
  },
  boxFilled: { borderColor: Colors.primary, backgroundColor: '#F2E8FF' },
  resend: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  resendDisabled: { color: Colors.text.muted },
  change: { alignItems: 'center', paddingTop: Spacing.xs },
  changeText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text.secondary,
  },
});

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: {
    bg: Colors.primary,
    border: Colors.primary,
    text: Colors.text.inverse,
  },
  outline: {
    bg: 'transparent',
    border: Colors.primary,
    text: Colors.primary,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    text: Colors.primary,
  },
  accent: {
    bg: Colors.accent,
    border: Colors.accent,
    text: Colors.text.primary,
  },
};

const sizeStyles = {
  sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, fontSize: 13 },
  md: { paddingVertical: 12, paddingHorizontal: Spacing.lg, fontSize: 15 },
  lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, fontSize: 16 },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text
          style={[styles.label, { color: v.text, fontSize: s.fontSize }]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 44,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },
  label: {
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: 0.2,
  },
});

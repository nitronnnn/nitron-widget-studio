import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, hitSlop, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';

type Variant = 'default' | 'active' | 'danger' | 'ghost';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  variant?: Variant;
  size?: number;
  label?: string;
  disabled?: boolean;
}

const fg: Record<Variant, string> = {
  default: colors.text,
  active: colors.bg,
  danger: colors.danger,
  ghost: colors.textDim,
};

export function IconBtn({ icon, onPress, variant = 'default', size = 38, label, disabled }: Props) {
  return (
    <Pressable
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2.6 },
        variant === 'active' && { backgroundColor: colors.accent },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.35 },
        label ? styles.withLabel : null,
      ]}
    >
      <Ionicons name={icon} size={size * 0.46} color={fg[variant]} />
      {!!label && <Text style={[text.caption, styles.label, { color: fg[variant] }]}>{label}</Text>}
    </Pressable>
  );
}

export function SectionLabel({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[text.section, { color: colors.textFaint }]}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withLabel: { width: undefined, paddingHorizontal: spacing.md, flexDirection: 'row', gap: 6 },
  label: { fontWeight: '600' },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});

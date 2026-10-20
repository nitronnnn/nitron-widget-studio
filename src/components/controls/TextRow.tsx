import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, text } from '@/theme';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  mono?: boolean;
}

export function TextRow({ label, value, onChange, placeholder, multiline, mono }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[text.caption, styles.label]}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline, mono && styles.mono]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { color: colors.textDim, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    color: colors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  mono: { fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
});

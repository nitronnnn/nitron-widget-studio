import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';

interface Props {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, value, onChange }: Props) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        haptic.select();
        onChange(!value);
      }}
    >
      <Text style={[text.caption, styles.label]}>{label}</Text>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
    marginBottom: spacing.md,
  },
  label: { color: colors.textDim },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface3,
    justifyContent: 'center',
    padding: 3,
  },
  trackOn: { backgroundColor: colors.accent },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textDim },
  knobOn: { backgroundColor: colors.bg, alignSelf: 'flex-end' },
});

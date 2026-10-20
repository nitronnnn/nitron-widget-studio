import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';

interface Option<T> {
  value: T;
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

interface Props<T extends string | number> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

/** Компактный сегментированный переключатель; при >5 опциях — горизонтальный скролл. */
export function Segmented<T extends string | number>({ options, value, onChange }: Props<T>) {
  const items = options.map((opt) => {
    const active = opt.value === value;
    return (
      <Pressable
        key={String(opt.value)}
        onPress={() => {
          if (!active) {
            haptic.select();
            onChange(opt.value);
          }
        }}
        style={[styles.item, options.length > 5 && styles.itemScroll, active && styles.itemActive]}
      >
        {opt.icon && (
          <Ionicons
            name={opt.icon}
            size={15}
            color={active ? colors.bg : colors.textDim}
          />
        )}
        {!!opt.label && (
          <Text style={[text.caption, { color: active ? colors.bg : colors.textDim, fontWeight: active ? '700' : '500' }]}>
            {opt.label}
          </Text>
        )}
      </Pressable>
    );
  });

  if (options.length > 5) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollWrap} contentContainerStyle={styles.scrollContent}>
        {items}
      </ScrollView>
    );
  }
  return <View style={styles.wrap}>{items}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: 3,
    gap: 3,
    marginBottom: spacing.lg,
  },
  item: {
    flex: 1,
    minHeight: 34,
    borderRadius: radii.md - 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  itemScroll: { flex: 0, paddingHorizontal: spacing.md },
  scrollWrap: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  scrollContent: { padding: 3, gap: 3 },
  itemActive: { backgroundColor: colors.accent },
});

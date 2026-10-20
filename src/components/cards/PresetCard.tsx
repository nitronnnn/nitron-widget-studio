import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Preset } from '@/data/presets';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import { colors, radii, spacing, text } from '@/theme';
import { WidgetCanvas } from '@/components/canvas/WidgetCanvas';
import { haptic } from '@/utils/haptics';

interface Props {
  preset: Preset;
  width: number;
  onPress: () => void;
}

export function PresetCard({ preset, width, onPress }: Props) {
  // Один раз собираем документ для превью
  const doc = useMemo(() => preset.build(), [preset]);
  const size = WIDGET_SIZES[doc.size];
  const scale = width / size.w;

  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View
        pointerEvents="none"
        style={{
          width,
          height: size.h * scale,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <WidgetCanvas doc={doc} scale={scale} />
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={[text.bodySemibold, styles.name]}>
          {preset.name}
        </Text>
        <Text numberOfLines={2} style={[text.caption, styles.dim]}>
          {preset.description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  meta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 2,
  },
  name: { color: colors.text },
  dim: { color: colors.textFaint },
});

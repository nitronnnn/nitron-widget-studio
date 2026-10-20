import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WidgetDoc } from '@/types/widget';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import { colors, radii, spacing, text } from '@/theme';
import { WidgetCanvas } from '@/components/canvas/WidgetCanvas';
import { haptic } from '@/utils/haptics';

interface Props {
  doc: WidgetDoc;
  width: number;
  onPress: () => void;
  onLongPress: () => void;
}

export function WidgetCard({ doc, width, onPress, onLongPress }: Props) {
  const size = WIDGET_SIZES[doc.size];
  const scale = width / size.w;
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      onLongPress={() => {
        haptic.medium();
        onLongPress();
      }}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View
        pointerEvents="none"
        style={{
          width,
          height: size.h * scale,
          borderTopLeftRadius: radii.lg,
          borderTopRightRadius: radii.lg,
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
          {doc.name}
        </Text>
        <Text style={[text.caption, styles.dim]}>
          {size.label} · {size.grid}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  name: { color: colors.text, flex: 1 },
  dim: { color: colors.textFaint },
});

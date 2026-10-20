import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ABS_FILL, colors, radii, spacing, text } from '@/theme';
import {
  SWATCHES,
  hexToHsva,
  hexToRgba,
  hsvaToHex,
  rgbaToHex,
  hsvToRgb,
  withAlpha,
  type Hsva,
} from '@/utils/color';
import { haptic } from '@/utils/haptics';
import { SliderTrack } from './SliderRow';
import { Checkerboard } from '@/components/canvas/Checkerboard';

interface Props {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

const HUES = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'] as [string, string, ...string[]];

/** HEX-ввод с локальным драфтом: коммит по blur/enter, невалидный ввод откатывается. */
function HexInput({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft !== null) {
      const parsed = hexToRgba(draft);
      if (parsed) {
        haptic.select();
        onCommit(rgbaToHex(parsed));
      }
    }
    setDraft(null);
  };

  return (
    <TextInput
      style={styles.hexInput}
      value={draft ?? value.toUpperCase()}
      onChangeText={setDraft}
      onBlur={commit}
      onSubmitEditing={commit}
      autoCapitalize="characters"
      autoCorrect={false}
      maxLength={9}
      placeholderTextColor={colors.textFaint}
    />
  );
}

/** Поле цвета с HSV-слайдерами, альфа-каналом, hex-вводом и свотчами. */
export function ColorField({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  // Пикер целиком выводится из value — никакой локальной копии, которую надо синхронизировать.
  const hsva = hexToHsva(value);

  const apply = (next: Hsva) => onChange(hsvaToHex(next));

  const solid = rgbaToHex({ ...hsvToRgb(hsva.h, hsva.s, hsva.v), a: 1 });
  const satFrom = hsvaToHex({ ...hsva, s: 0, a: 1 });

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.head}
        onPress={() => {
          haptic.select();
          setOpen((v) => !v);
        }}
      >
        <Text style={[text.caption, styles.label]}>{label}</Text>
        <View style={styles.headRight}>
          <View style={styles.swatchOuter}>
            <View style={styles.swatchChecker}>
              <Checkerboard cell={6} />
            </View>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: value, borderRadius: 7 }]} />
          </View>
          <Text style={[text.caption, styles.hex]}>{value.toUpperCase()}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textFaint} />
        </View>
      </Pressable>

      {open && (
        <View style={styles.body}>
          <Text style={[text.caption, styles.mini]}>Тон</Text>
          <SliderTrack ratio={hsva.h / 360} onRatio={(r) => apply({ ...hsva, h: r * 360 })} showFill={false}>
            <LinearGradient colors={HUES} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </SliderTrack>

          <Text style={[text.caption, styles.mini]}>Насыщенность</Text>
          <SliderTrack ratio={hsva.s} onRatio={(r) => apply({ ...hsva, s: r })} showFill={false}>
            <LinearGradient colors={[satFrom, solid]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </SliderTrack>

          <Text style={[text.caption, styles.mini]}>Яркость</Text>
          <SliderTrack ratio={hsva.v} onRatio={(r) => apply({ ...hsva, v: r })} showFill={false}>
            <LinearGradient colors={['#000000', solid]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </SliderTrack>

          <Text style={[text.caption, styles.mini]}>Альфа · {Math.round(hsva.a * 100)}%</Text>
          <SliderTrack ratio={hsva.a} onRatio={(r) => apply({ ...hsva, a: r })} showFill={false}>
            <View style={StyleSheet.absoluteFill}>
              <Checkerboard cell={5} />
            </View>
            <LinearGradient
              colors={[withAlpha(solid, 0), solid]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </SliderTrack>

          <View style={styles.hexRow}>
            <Text style={[text.caption, styles.mini]}>HEX</Text>
            <HexInput value={value} onCommit={onChange} />
          </View>

          <View style={styles.swatches}>
            {SWATCHES.map((c) => {
              const active = c.toLowerCase() === value.toLowerCase();
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    haptic.select();
                    onChange(c);
                  }}
                  style={[styles.swatch, active && styles.swatchActive]}
                >
                  <View style={styles.swatchCheckerInner}>
                    <Checkerboard cell={5} />
                  </View>
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: c, borderRadius: 7 }]} />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { color: colors.textDim },
  hex: { color: colors.text, fontVariant: ['tabular-nums'], minWidth: 76, textAlign: 'right' },
  swatchOuter: { width: 26, height: 26, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  swatchChecker: { ...ABS_FILL },
  body: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  mini: { color: colors.textFaint, marginTop: spacing.sm, marginBottom: 2 },
  hexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  hexInput: {
    backgroundColor: colors.surface3,
    color: colors.text,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minWidth: 120,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    fontSize: 13,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  swatch: { width: 26, height: 26, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  swatchActive: { borderColor: colors.accent, borderWidth: 2 },
  swatchCheckerInner: { ...ABS_FILL },
});

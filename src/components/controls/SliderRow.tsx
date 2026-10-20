import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { colors, spacing, text } from '@/theme';
import { clamp01 } from '@/utils/color';
import { haptic } from '@/utils/haptics';

interface SliderTrackProps {
  ratio: number;
  onRatio: (ratio: number) => void;
  /** вызывается один раз в начале драга (хаптика) */
  onDragStart?: () => void;
  /** кастомное содержимое трека (градиент, шахматка…) */
  children?: React.ReactNode;
  thumbColor?: string;
  /** рисовать ли акцентную заливку слева от бегунка (в цветовых слайдерах — нет) */
  showFill?: boolean;
}

/** Базовый трек с жестом — переиспользуется в пикере цвета. */
export function SliderTrack({ ratio, onRatio, onDragStart, children, thumbColor = '#FFFFFF', showFill = true }: SliderTrackProps) {
  const [trackW, setTrackW] = useState(0);

  const emit = (px: number) => {
    onRatio(clamp01(trackW > 0 ? px / trackW : 0));
  };

  const dragStart = () => onDragStart?.();

  const pan = Gesture.Pan()
    .minDistance(0)
    .onStart((e) => {
      'worklet';
      runOnJS(dragStart)();
      runOnJS(emit)(e.x);
    })
    .onUpdate((e) => runOnJS(emit)(e.x));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.track}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      >
        <View style={styles.trackInner}>{children}</View>
        {showFill && (
          <View style={[styles.fill, { width: `${clamp01(ratio) * 100}%` }]} pointerEvents="none" />
        )}
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            { left: `${clamp01(ratio) * 100}%`, backgroundColor: thumbColor },
          ]}
        />
      </View>
    </GestureDetector>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function SliderRow({ label, value, min, max, step = 1, onChange, format }: SliderRowProps) {
  const ratio = (value - min) / (max - min);
  const shown = format ? format(value) : String(Math.round(value));

  const emit = (v: number) => onChange(v);

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text style={[text.caption, styles.label]}>{label}</Text>
        <Text style={[text.caption, styles.value]}>{shown}</Text>
      </View>
      <SliderTrack
        ratio={clamp01(ratio)}
        onDragStart={() => haptic.select()}
        onRatio={(r) => {
          let v = min + r * (max - min);
          if (step) v = Math.round(v / step) * step;
          v = Math.min(max, Math.max(min, v));
          if (v !== value) emit(v);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  label: { color: colors.textDim },
  value: { color: colors.text, fontVariant: ['tabular-nums'] },
  track: { height: 28, justifyContent: 'center' },
  trackInner: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface3,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: colors.bg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});

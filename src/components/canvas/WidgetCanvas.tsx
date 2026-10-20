/* eslint-disable react-hooks/immutability -- SharedValue мутируется в жестах по дизайну Reanimated (UI-runtime). */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { Frame, Layer, WidgetDoc } from '@/types/widget';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import { ABS_FILL, colors } from '@/theme';
import { Checkerboard } from './Checkerboard';
import { WidgetBackground } from './WidgetBackground';
import { LayerView } from '@/components/layers/LayerView';
import { AnimatedFx } from '@/components/layers/AnimatedFx';
import { isLiveLayer, isMediaLayer } from '@/native/widgetSpec';

interface CanvasProps {
  doc: WidgetDoc;
  scale: number;
  editing?: boolean;
  /** скрывает шахматку и рамки выделения — для экспорта PNG */
  captureMode?: boolean;
  /** скрывает «живые» слои (часы/дата/отсчёт/батарея) — для base.png домашнего виджета */
  hideLive?: boolean;
  /** скрывает GIF/видео — их рисует нативный сервис кадров */
  hideMedia?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onCommitFrame?: (id: string, frame: Frame, rotation: number) => void;
  canvasRef?: React.RefObject<View | null>;
}

/** RN 0.88: View ref ≠ ReactNativeElement в типах — безопасный мост для view-shot. */
const asViewRef = (r: React.RefObject<View | null> | undefined) =>
  r as unknown as React.RefObject<never> | undefined;

function StaticLayer({ layer, scale }: { layer: Layer; scale: number }) {
  const f = layer.frame;
  return (
    <View
      style={{
        position: 'absolute',
        left: f.x * scale,
        top: f.y * scale,
        width: f.w * scale,
        height: f.h * scale,
        opacity: layer.opacity,
        transform: [{ rotate: `${layer.rotation}deg` }],
      }}
    >
      <AnimatedFx anim={layer.anim} speed={layer.animSpeed} scale={scale}>
        <LayerView layer={layer} scale={scale} />
      </AnimatedFx>
    </View>
  );
}

const MIN_SIDE = 12;

interface EditableProps {
  layer: Layer;
  scale: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onCommit: (id: string, frame: Frame, rotation: number) => void;
}

function EditableLayer({ layer, scale, selected, onSelect, onCommit }: EditableProps) {
  const x = useSharedValue(layer.frame.x * scale);
  const y = useSharedValue(layer.frame.y * scale);
  const w = useSharedValue(layer.frame.w * scale);
  const h = useSharedValue(layer.frame.h * scale);
  const rot = useSharedValue(layer.rotation);

  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const sw = useSharedValue(0);
  const sh = useSharedValue(0);
  const sr = useSharedValue(0);
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);

  // Синхронизация, когда слой изменился извне (инспектор, undo, пресет)
  useEffect(() => {
    x.value = layer.frame.x * scale;
    y.value = layer.frame.y * scale;
    w.value = layer.frame.w * scale;
    h.value = layer.frame.h * scale;
    rot.value = layer.rotation;
  }, [layer.frame.x, layer.frame.y, layer.frame.w, layer.frame.h, layer.rotation, scale, x, y, w, h, rot]);

  const gestureEnabled = selected && !layer.locked;

  const commit = () => {
    onCommit(
      layer.id,
      {
        x: Math.round(x.value / scale),
        y: Math.round(y.value / scale),
        w: Math.max(MIN_SIDE, Math.round(w.value / scale)),
        h: Math.max(MIN_SIDE, Math.round(h.value / scale)),
      },
      Math.round(rot.value),
    );
  };

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onSelect)(layer.id);
  });

  const pan = Gesture.Pan()
    .enabled(gestureEnabled)
    .onStart(() => {
      sx.value = x.value;
      sy.value = y.value;
    })
    .onUpdate((e) => {
      x.value = sx.value + e.translationX;
      y.value = sy.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const pinch = Gesture.Pinch()
    .enabled(gestureEnabled)
    .onStart(() => {
      sw.value = w.value;
      sh.value = h.value;
      cx.value = x.value + w.value / 2;
      cy.value = y.value + h.value / 2;
    })
    .onUpdate((e) => {
      const nw = Math.max(MIN_SIDE * scale, sw.value * e.scale);
      const nh = Math.max(MIN_SIDE * scale, sh.value * e.scale);
      w.value = nw;
      h.value = nh;
      x.value = cx.value - nw / 2;
      y.value = cy.value - nh / 2;
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const rotate = Gesture.Rotation()
    .enabled(gestureEnabled)
    .onStart(() => {
      sr.value = rot.value;
    })
    .onUpdate((e) => {
      rot.value = sr.value + (e.rotation * 180) / Math.PI;
    })
    .onEnd(() => {
      runOnJS(commit)();
    });

  const gesture = Gesture.Simultaneous(tap, pan, pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
    width: w.value,
    height: h.value,
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.layer, { opacity: layer.opacity }, animatedStyle]}>
        <AnimatedFx anim={layer.anim} speed={layer.animSpeed} scale={scale}>
          <LayerView layer={layer} scale={scale} />
        </AnimatedFx>
        {selected && (
          <View pointerEvents="none" style={styles.selection}>
            {layer.locked && (
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={10} color={colors.bg} />
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export function WidgetCanvas({
  doc,
  scale,
  editing = false,
  captureMode = false,
  hideLive = false,
  hideMedia = false,
  selectedId = null,
  onSelect,
  onCommitFrame,
  canvasRef,
}: CanvasProps) {
  const size = WIDGET_SIZES[doc.size];
  const visible = doc.layers.filter(
    (l) => l.visible && !(hideLive && isLiveLayer(l)) && !(hideMedia && isMediaLayer(l)),
  );
  const showChecker = doc.background.kind === 'transparent' && !captureMode;

  const handleSelect = (id: string) => {
    onSelect?.(id);
  };

  return (
    <View
      ref={asViewRef(canvasRef)}
      collapsable={false}
      style={{
        width: size.w * scale,
        height: size.h * scale,
        borderRadius: doc.radius * scale,
        overflow: 'hidden',
        backgroundColor: doc.background.kind === 'transparent' ? 'transparent' : undefined,
      }}
    >
      <WidgetBackground background={doc.background} scale={scale} />
      {showChecker && <Checkerboard cell={Math.max(6, 10 * scale)} />}
      {visible.map((layer) =>
        editing && !captureMode ? (
          <EditableLayer
            key={layer.id}
            layer={layer}
            scale={scale}
            selected={layer.id === selectedId}
            onSelect={handleSelect}
            onCommit={(id, frame, rotation) => onCommitFrame?.(id, frame, rotation)}
          />
        ) : (
          <StaticLayer key={layer.id} layer={layer} scale={scale} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
  selection: {
    ...ABS_FILL,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  lockBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

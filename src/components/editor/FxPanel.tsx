import React from 'react';
import { View } from 'react-native';
import { useEditorStore } from '@/store/editorStore';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import type { AnimKind } from '@/types/widget';
import { SliderRow } from '@/components/controls/SliderRow';
import { Segmented } from '@/components/controls/Segmented';
import { SectionLabel } from '@/components/controls/IconBtn';
import { EmptyState } from '@/components/ui/EmptyState';

const ANIM_OPTIONS: { value: AnimKind; label: string }[] = [
  { value: 'none', label: 'Нет' },
  { value: 'pulse', label: 'Пульс' },
  { value: 'glow', label: 'Свечение' },
  { value: 'float', label: 'Парение' },
  { value: 'spin', label: 'Вращение' },
  { value: 'slide', label: 'Скольжение' },
  { value: 'blink', label: 'Мигание' },
];

/** FX: прозрачность (альфа слоя), геометрия, анимация. */
export function FxPanel() {
  const doc = useEditorStore((s) => s.doc);
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  if (!doc) return null;
  const layer = doc.layers.find((l) => l.id === selectedId);
  if (!layer) {
    return (
      <EmptyState
        icon="sparkles-outline"
        title="Ничего не выбрано"
        text="Выберите слой, чтобы настроить прозрачность, геометрию и анимацию."
      />
    );
  }

  const size = WIDGET_SIZES[doc.size];
  const f = layer.frame;

  return (
    <View>
      <SectionLabel title="Альфа-канал" />
      <SliderRow
        label="Непрозрачность слоя"
        value={layer.opacity}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, opacity: v }))}
        format={(v) => `${Math.round(v * 100)}%`}
      />

      <SectionLabel title="Геометрия" />
      <SliderRow label="Позиция X" value={f.x} min={-size.w} max={size.w} onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, frame: { ...l.frame, x: v } }))} />
      <SliderRow label="Позиция Y" value={f.y} min={-size.h} max={size.h} onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, frame: { ...l.frame, y: v } }))} />
      <SliderRow label="Ширина" value={f.w} min={8} max={size.w * 2} onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, frame: { ...l.frame, w: v } }))} />
      <SliderRow label="Высота" value={f.h} min={8} max={size.h * 2} onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, frame: { ...l.frame, h: v } }))} />
      <SliderRow
        label="Поворот"
        value={layer.rotation}
        min={-180}
        max={180}
        onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, rotation: v }))}
        format={(v) => `${Math.round(v)}°`}
      />

      <SectionLabel title="Анимация" />
      <Segmented
        options={ANIM_OPTIONS}
        value={layer.anim}
        onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, anim: v }))}
      />
      {layer.anim !== 'none' && (
        <SliderRow
          label="Скорость"
          value={layer.animSpeed}
          min={0.25}
          max={3}
          step={0.25}
          onChange={(v) => updateLayer(layer.id, (l) => ({ ...l, animSpeed: v }))}
          format={(v) => `${v.toFixed(2)}×`}
        />
      )}
    </View>
  );
}

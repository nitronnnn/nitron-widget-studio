import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Layer } from '@/types/widget';
import { useEditorStore } from '@/store/editorStore';
import { FONT_OPTIONS, colors, radii, spacing, text } from '@/theme';
import { isoInDays } from '@/utils/time';
import { pickMediaUri } from '@/utils/pickMedia';
import { haptic } from '@/utils/haptics';
import { SliderRow } from '@/components/controls/SliderRow';
import { Segmented } from '@/components/controls/Segmented';
import { ColorField } from '@/components/controls/ColorField';
import { Toggle } from '@/components/controls/Toggle';
import { TextRow } from '@/components/controls/TextRow';
import { IconBtn, SectionLabel } from '@/components/controls/IconBtn';
import { EmptyState } from '@/components/ui/EmptyState';

const ICON_CHOICES = [
  'planet', 'rocket', 'flame', 'flash', 'heart', 'star', 'moon', 'sunny',
  'partly-sunny', 'rainy', 'snow', 'musical-notes', 'headset', 'camera', 'videocam', 'game-controller',
  'fitness', 'cafe', 'pizza', 'leaf', 'paw', 'bicycle', 'airplane', 'car',
  'code-slash', 'terminal', 'logo-bitcoin', 'trending-up', 'trophy', 'medal', 'gift', 'diamond',
  'play', 'pause', 'stop', 'add', 'checkmark', 'close', 'alarm', 'time',
  'calendar', 'wifi', 'bluetooth', 'location', 'globe', 'chatbubble', 'notifications', 'sparkles',
] as const;

const SHAPE_OPTIONS = [
  { value: 'rect' as const, label: 'Квадрат' },
  { value: 'pill' as const, label: 'Пилюля' },
  { value: 'circle' as const, label: 'Круг' },
  { value: 'ring' as const, label: 'Кольцо' },
  { value: 'triangle' as const, label: 'Треуг.' },
  { value: 'star' as const, label: 'Звезда' },
  { value: 'line' as const, label: 'Линия' },
];

const FIT_OPTIONS = [
  { value: 'cover' as const, label: 'Cover' },
  { value: 'contain' as const, label: 'Contain' },
  { value: 'fill' as const, label: 'Fill' },
];

const ALIGN_OPTIONS = [
  { value: 'left' as const, label: 'Слева' },
  { value: 'center' as const, label: 'Центр' },
  { value: 'right' as const, label: 'Справа' },
];

const FONT_OPTS = FONT_OPTIONS.map((f) => ({ value: f.key, label: f.label }));

export function StylePanel() {
  const doc = useEditorStore((s) => s.doc);
  const selectedId = useEditorStore((s) => s.selectedId);
  const patchLayerProps = useEditorStore((s) => s.patchLayerProps);
  const renameLayer = useEditorStore((s) => s.renameLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const duplicateLayer = useEditorStore((s) => s.duplicateLayer);

  if (!doc) return null;
  const layer = doc.layers.find((l) => l.id === selectedId);
  if (!layer) {
    return (
      <EmptyState
        icon="color-wand-outline"
        title="Ничего не выбрано"
        text="Тапните слой на холсте или выберите его во вкладке «Слои»."
      />
    );
  }

  const patch = (p: Record<string, unknown>) => patchLayerProps(layer.id, p);

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <TextRow label="Имя слоя" value={layer.name} onChange={(v) => renameLayer(layer.id, v)} />
        </View>
        <IconBtn icon="copy-outline" onPress={() => duplicateLayer(layer.id)} />
        <IconBtn icon="trash-outline" variant="danger" onPress={() => removeLayer(layer.id)} />
      </View>

      {layer.type === 'text' && <TextEditor layer={layer} patch={patch} />}
      {layer.type === 'image' && <MediaEditor layer={layer} patch={patch} kind="image" />}
      {layer.type === 'gif' && (
        <>
          <MediaEditor layer={layer} patch={patch} kind="image" />
          <Toggle label="Автовоспроизведение" value={layer.props.autoplay} onChange={(v) => patch({ autoplay: v })} />
        </>
      )}
      {layer.type === 'video' && (
        <>
          <MediaEditor layer={layer} patch={patch} kind="video" />
          <Toggle label="Играть" value={layer.props.playing} onChange={(v) => patch({ playing: v })} />
          <Toggle label="Повторять (loop)" value={layer.props.loop} onChange={(v) => patch({ loop: v })} />
          <Toggle label="Без звука" value={layer.props.muted} onChange={(v) => patch({ muted: v })} />
        </>
      )}
      {layer.type === 'shape' && <ShapeEditor layer={layer} patch={patch} />}
      {layer.type === 'clock' && <ClockEditor layer={layer} patch={patch} />}
      {layer.type === 'date' && <DateEditor layer={layer} patch={patch} />}
      {layer.type === 'battery' && <BatteryEditor layer={layer} patch={patch} />}
      {layer.type === 'progress' && <ProgressEditor layer={layer} patch={patch} />}
      {layer.type === 'countdown' && <CountdownEditor layer={layer} patch={patch} />}
      {layer.type === 'icon' && <IconEditor layer={layer} patch={patch} />}
    </View>
  );
}

type Patch = (p: Record<string, unknown>) => void;

// ─── Текст ───────────────────────────────────────────────────────────────────

function TextEditor({ layer, patch }: { layer: Extract<Layer, { type: 'text' }>; patch: Patch }) {
  const p = layer.props;
  return (
    <View>
      <TextRow label="Текст" value={p.text} onChange={(v) => patch({ text: v })} multiline />
      <ColorField label="Цвет" value={p.color} onChange={(v) => patch({ color: v })} />
      <SliderRow label="Размер" value={p.fontSize} min={8} max={96} onChange={(v) => patch({ fontSize: v })} />
      <SectionLabel title="Шрифт" />
      <Segmented options={FONT_OPTS} value={p.fontKey} onChange={(v) => patch({ fontKey: v })} />
      <Toggle label="Жирный" value={p.bold} onChange={(v) => patch({ bold: v })} />
      <Toggle label="КАПС" value={p.uppercase} onChange={(v) => patch({ uppercase: v })} />
      <SliderRow label="Трекинг" value={p.letterSpacing} min={-2} max={12} step={0.5} onChange={(v) => patch({ letterSpacing: v })} format={(v) => v.toFixed(1)} />
      <SectionLabel title="Выравнивание" />
      <Segmented options={ALIGN_OPTIONS} value={p.align} onChange={(v) => patch({ align: v })} />
      <GlowEditor glowColor={p.glowColor} glowRadius={p.glowRadius} patch={patch} />
    </View>
  );
}

function GlowEditor({ glowColor, glowRadius, patch }: { glowColor: string; glowRadius: number; patch: Patch }) {
  return (
    <View>
      <SectionLabel title="Неоновое свечение" />
      <ColorField label="Цвет свечения" value={glowColor} onChange={(v) => patch({ glowColor: v })} />
      <SliderRow label="Сила свечения" value={glowRadius} min={0} max={32} onChange={(v) => patch({ glowRadius: v })} />
    </View>
  );
}

// ─── Медиа ───────────────────────────────────────────────────────────────────

function MediaEditor({ layer, patch, kind }: { layer: Extract<Layer, { type: 'image' | 'gif' | 'video' }>; patch: Patch; kind: 'image' | 'video' }) {
  const p = layer.props;
  const pick = async () => {
    const uri = await pickMediaUri(kind);
    if (uri) {
      haptic.success();
      patch({ uri });
    }
  };
  return (
    <View>
      <Pressable style={styles.pickBtn} onPress={pick}>
        <Ionicons name="folder-open-outline" size={16} color={colors.accent} />
        <Text style={[text.bodySemibold, { color: colors.accent }]}>
          {kind === 'video' ? 'Выбрать видео' : 'Выбрать из галереи'}
        </Text>
      </Pressable>
      <TextRow label="URL источника" value={p.uri} onChange={(v) => patch({ uri: v })} placeholder="https://…" mono />
      <SectionLabel title="Вписывание" />
      <Segmented options={FIT_OPTIONS} value={p.fit} onChange={(v) => patch({ fit: v })} />
      <SliderRow label="Скругление" value={p.radius} min={0} max={100} onChange={(v) => patch({ radius: v })} />
      <SliderRow label="Обводка" value={p.borderWidth} min={0} max={10} step={0.5} onChange={(v) => patch({ borderWidth: v })} format={(v) => v.toFixed(1)} />
      {p.borderWidth > 0 && (
        <ColorField label="Цвет обводки" value={p.borderColor} onChange={(v) => patch({ borderColor: v })} />
      )}
    </View>
  );
}

// ─── Фигура ──────────────────────────────────────────────────────────────────

function ShapeEditor({ layer, patch }: { layer: Extract<Layer, { type: 'shape' }>; patch: Patch }) {
  const p = layer.props;
  const patchFill = (fp: Record<string, unknown>) => patch({ fill: { ...p.fill, ...fp } });
  const patchGradient = (gp: Record<string, unknown>) =>
    patch({ fill: { ...p.fill, gradient: { ...p.fill.gradient, ...gp } } });
  const gradColors = p.fill.gradient.colors;
  return (
    <View>
      <SectionLabel title="Форма" />
      <Segmented options={SHAPE_OPTIONS} value={p.shape} onChange={(v) => patch({ shape: v })} />
      <SectionLabel title="Заливка" />
      <Segmented
        options={[
          { value: 'color' as const, label: 'Цвет' },
          { value: 'gradient' as const, label: 'Градиент' },
        ]}
        value={p.fill.kind}
        onChange={(v) => patchFill({ kind: v })}
      />
      {p.fill.kind === 'color' ? (
        <ColorField label="Цвет" value={p.fill.color} onChange={(v) => patchFill({ color: v })} />
      ) : (
        <View>
          <ColorField label="Цвет A" value={gradColors[0] ?? '#35E0FF'} onChange={(v) => patchGradient({ colors: [v, gradColors[1] ?? '#FF4DE3', ...gradColors.slice(2)] })} />
          <ColorField label="Цвет B" value={gradColors[1] ?? '#FF4DE3'} onChange={(v) => patchGradient({ colors: [gradColors[0] ?? '#35E0FF', v, ...gradColors.slice(2)] })} />
          <SliderRow label="Угол градиента" value={p.fill.gradient.angle} min={0} max={360} onChange={(v) => patchGradient({ angle: v })} format={(v) => `${Math.round(v)}°`} />
        </View>
      )}
      <SliderRow label="Толщина обводки" value={p.strokeWidth} min={0} max={20} onChange={(v) => patch({ strokeWidth: v })} />
      {p.strokeWidth > 0 && (
        <ColorField label="Цвет обводки" value={p.strokeColor} onChange={(v) => patch({ strokeColor: v })} />
      )}
      <GlowEditor glowColor={p.glowColor} glowRadius={p.glowRadius} patch={patch} />
    </View>
  );
}

// ─── Часы / дата ─────────────────────────────────────────────────────────────

function ClockEditor({ layer, patch }: { layer: Extract<Layer, { type: 'clock' }>; patch: Patch }) {
  const p = layer.props;
  return (
    <View>
      <Toggle label="24-часовой формат" value={p.format24} onChange={(v) => patch({ format24: v })} />
      <Toggle label="Секунды" value={p.showSeconds} onChange={(v) => patch({ showSeconds: v })} />
      <ColorField label="Цвет" value={p.color} onChange={(v) => patch({ color: v })} />
      <SliderRow label="Размер" value={p.fontSize} min={12} max={120} onChange={(v) => patch({ fontSize: v })} />
      <SectionLabel title="Шрифт" />
      <Segmented options={FONT_OPTS} value={p.fontKey} onChange={(v) => patch({ fontKey: v })} />
      <Toggle label="Жирный" value={p.bold} onChange={(v) => patch({ bold: v })} />
      <SectionLabel title="Выравнивание" />
      <Segmented options={ALIGN_OPTIONS} value={p.align} onChange={(v) => patch({ align: v })} />
      <GlowEditor glowColor={p.glowColor} glowRadius={p.glowRadius} patch={patch} />
    </View>
  );
}

const DATE_PATTERNS = ['D MMMM', 'dd, D MMM', 'DD.MM.YYYY', 'MM/DD/YY', 'dd · HH:mm'];

function DateEditor({ layer, patch }: { layer: Extract<Layer, { type: 'date' }>; patch: Patch }) {
  const p = layer.props;
  return (
    <View>
      <TextRow label="Шаблон (DD MM YYYY hh mm dd)" value={p.pattern} onChange={(v) => patch({ pattern: v })} mono />
      <View style={styles.chips}>
        {DATE_PATTERNS.map((pt) => (
          <Pressable
            key={pt}
            style={[styles.chip, p.pattern === pt && styles.chipActive]}
            onPress={() => {
              haptic.select();
              patch({ pattern: pt });
            }}
          >
            <Text style={[text.caption, { color: p.pattern === pt ? colors.bg : colors.textDim }]}>{pt}</Text>
          </Pressable>
        ))}
      </View>
      <ColorField label="Цвет" value={p.color} onChange={(v) => patch({ color: v })} />
      <SliderRow label="Размер" value={p.fontSize} min={8} max={64} onChange={(v) => patch({ fontSize: v })} />
      <SectionLabel title="Шрифт" />
      <Segmented options={FONT_OPTS} value={p.fontKey} onChange={(v) => patch({ fontKey: v })} />
      <Toggle label="Жирный" value={p.bold} onChange={(v) => patch({ bold: v })} />
      <Toggle label="КАПС" value={p.uppercase} onChange={(v) => patch({ uppercase: v })} />
      <SectionLabel title="Выравнивание" />
      <Segmented options={ALIGN_OPTIONS} value={p.align} onChange={(v) => patch({ align: v })} />
    </View>
  );
}

// ─── Системные ───────────────────────────────────────────────────────────────

function BatteryEditor({ layer, patch }: { layer: Extract<Layer, { type: 'battery' }>; patch: Patch }) {
  const p = layer.props;
  return (
    <View>
      <SectionLabel title="Стиль" />
      <Segmented
        options={[
          { value: 'ring' as const, label: 'Кольцо' },
          { value: 'bar' as const, label: 'Полоса' },
          { value: 'text' as const, label: 'Текст' },
        ]}
        value={p.style}
        onChange={(v) => patch({ style: v })}
      />
      <ColorField label="Цвет" value={p.color} onChange={(v) => patch({ color: v })} />
      {p.style !== 'text' && (
        <ColorField label="Цвет трека" value={p.trackColor} onChange={(v) => patch({ trackColor: v })} />
      )}
      <Toggle label="Показывать проценты" value={p.showPercent} onChange={(v) => patch({ showPercent: v })} />
      <SliderRow label="Размер цифр" value={p.fontSize} min={10} max={48} onChange={(v) => patch({ fontSize: v })} />
      <SectionLabel title="Шрифт" />
      <Segmented options={FONT_OPTS} value={p.fontKey} onChange={(v) => patch({ fontKey: v })} />
    </View>
  );
}

function ProgressEditor({ layer, patch }: { layer: Extract<Layer, { type: 'progress' }>; patch: Patch }) {
  const p = layer.props;
  return (
    <View>
      <SliderRow label="Значение" value={p.value} min={0} max={1} step={0.01} onChange={(v) => patch({ value: v })} format={(v) => `${Math.round(v * 100)}%`} />
      <Toggle label="Градиентная заливка" value={p.useGradient} onChange={(v) => patch({ useGradient: v })} />
      <ColorField label={p.useGradient ? 'Цвет A' : 'Цвет'} value={p.color} onChange={(v) => patch({ color: v })} />
      {p.useGradient && (
        <>
          <ColorField label="Цвет B" value={p.colorEnd} onChange={(v) => patch({ colorEnd: v })} />
          <SliderRow label="Угол градиента" value={p.angle} min={0} max={360} onChange={(v) => patch({ angle: v })} format={(v) => `${Math.round(v)}°`} />
        </>
      )}
      <ColorField label="Цвет трека" value={p.trackColor} onChange={(v) => patch({ trackColor: v })} />
    </View>
  );
}

function CountdownEditor({ layer, patch }: { layer: Extract<Layer, { type: 'countdown' }>; patch: Patch }) {
  const p = layer.props;
  const chips = [
    { label: '+1 час', days: 1 / 24 },
    { label: '+1 день', days: 1 },
    { label: '+7 дней', days: 7 },
    { label: '+30 дней', days: 30 },
  ];
  return (
    <View>
      <View style={styles.chips}>
        {chips.map((c) => (
          <Pressable
            key={c.label}
            style={styles.chip}
            onPress={() => {
              haptic.select();
              patch({ targetISO: isoInDays(c.days) });
            }}
          >
            <Text style={[text.caption, { color: colors.textDim }]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextRow label="Дата цели (ISO)" value={p.targetISO} onChange={(v) => patch({ targetISO: v })} mono />
      <TextRow label="Подпись (необязательно)" value={p.label} onChange={(v) => patch({ label: v })} />
      <ColorField label="Цвет цифр" value={p.color} onChange={(v) => patch({ color: v })} />
      <ColorField label="Акцент (подписи)" value={p.accentColor} onChange={(v) => patch({ accentColor: v })} />
      <SliderRow label="Размер цифр" value={p.fontSize} min={16} max={72} onChange={(v) => patch({ fontSize: v })} />
      <SectionLabel title="Шрифт" />
      <Segmented options={FONT_OPTS} value={p.fontKey} onChange={(v) => patch({ fontKey: v })} />
    </View>
  );
}

function IconEditor({ layer, patch }: { layer: Extract<Layer, { type: 'icon' }>; patch: Patch }) {
  const p = layer.props;
  return (
    <View>
      <SectionLabel title="Иконка" />
      <View style={styles.iconGrid}>
        {ICON_CHOICES.map((name) => {
          const active = p.name === name;
          return (
            <Pressable
              key={name}
              style={[styles.iconCell, active && styles.iconCellActive]}
              onPress={() => {
                haptic.select();
                patch({ name });
              }}
            >
              <Ionicons name={name} size={20} color={active ? colors.accent : colors.textDim} />
            </Pressable>
          );
        })}
      </View>
      <TextRow label="Или имя Ionicons" value={p.name} onChange={(v) => patch({ name: v })} mono />
      <ColorField label="Цвет" value={p.color} onChange={(v) => patch({ color: v })} />
      <GlowEditor glowColor={p.glowColor} glowRadius={p.glowRadius} patch={patch} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingVertical: 12,
    marginBottom: spacing.lg,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  iconCell: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconCellActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
});

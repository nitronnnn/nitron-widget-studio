import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '@/store/editorStore';
import type { WidgetSizeKind } from '@/types/widget';
import { colors, radii, spacing, text } from '@/theme';
import { pickMediaUri } from '@/utils/pickMedia';
import { haptic } from '@/utils/haptics';
import { SliderRow } from '@/components/controls/SliderRow';
import { Segmented } from '@/components/controls/Segmented';
import { ColorField } from '@/components/controls/ColorField';
import { SectionLabel } from '@/components/controls/IconBtn';

const SIZE_OPTIONS: { value: WidgetSizeKind; label: string }[] = [
  { value: 'small', label: 'Малый' },
  { value: 'medium', label: 'Средний' },
  { value: 'large', label: 'Большой' },
];

const BG_OPTIONS = [
  { value: 'transparent' as const, label: 'Альфа' },
  { value: 'color' as const, label: 'Цвет' },
  { value: 'gradient' as const, label: 'Градиент' },
  { value: 'image' as const, label: 'Фото' },
];

/** Настройки холста: размер виджета, скругление, фон (включая прозрачный). */
export function CanvasPanel() {
  const doc = useEditorStore((s) => s.doc);
  const setSize = useEditorStore((s) => s.setSize);
  const setRadius = useEditorStore((s) => s.setRadius);
  const setBackground = useEditorStore((s) => s.setBackground);

  if (!doc) return null;
  const bg = doc.background;

  const pickBgImage = async () => {
    const uri = await pickMediaUri('image');
    if (uri) {
      haptic.success();
      setBackground({ kind: 'image', uri, fit: 'cover', dim: 0 });
    }
  };

  return (
    <View>
      <SectionLabel title="Размер виджета" />
      <Segmented options={SIZE_OPTIONS} value={doc.size} onChange={setSize} />
      <SliderRow
        label="Скругление углов"
        value={doc.radius}
        min={0}
        max={48}
        onChange={setRadius}
      />

      <SectionLabel title="Фон" />
      <Segmented
        options={BG_OPTIONS}
        value={bg.kind}
        onChange={(kind) => {
          switch (kind) {
            case 'transparent':
              setBackground({ kind: 'transparent' });
              break;
            case 'color':
              setBackground({ kind: 'color', color: '#0D1017' });
              break;
            case 'gradient':
              setBackground({ kind: 'gradient', gradient: { colors: ['#141926', '#06070B'], angle: 135 } });
              break;
            case 'image':
              void pickBgImage();
              break;
          }
        }}
      />

      {bg.kind === 'transparent' && (
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
          <Text style={[text.caption, styles.noteText]}>
            Прозрачный фон: шахматка видна только в редакторе. При экспорте PNG альфа-канал сохранится —
            виджет ляжет на обои без подложки.
          </Text>
        </View>
      )}

      {bg.kind === 'color' && (
        <ColorField label="Цвет фона" value={bg.color} onChange={(v) => setBackground({ kind: 'color', color: v })} />
      )}

      {bg.kind === 'gradient' && (
        <View>
          <ColorField
            label="Цвет A"
            value={bg.gradient.colors[0] ?? '#141926'}
            onChange={(v) =>
              setBackground({ kind: 'gradient', gradient: { ...bg.gradient, colors: [v, bg.gradient.colors[1] ?? '#06070B'] } })
            }
          />
          <ColorField
            label="Цвет B"
            value={bg.gradient.colors[1] ?? '#06070B'}
            onChange={(v) =>
              setBackground({ kind: 'gradient', gradient: { ...bg.gradient, colors: [bg.gradient.colors[0] ?? '#141926', v] } })
            }
          />
          <SliderRow
            label="Угол"
            value={bg.gradient.angle}
            min={0}
            max={360}
            onChange={(v) => setBackground({ kind: 'gradient', gradient: { ...bg.gradient, angle: v } })}
            format={(v) => `${Math.round(v)}°`}
          />
        </View>
      )}

      {bg.kind === 'image' && (
        <View>
          <Pressable style={styles.pickBtn} onPress={pickBgImage}>
            <Ionicons name="folder-open-outline" size={16} color={colors.accent} />
            <Text style={[text.bodySemibold, { color: colors.accent }]}>
              {bg.uri ? 'Заменить фото' : 'Выбрать фото'}
            </Text>
          </Pressable>
          <SectionLabel title="Вписывание" />
          <Segmented
            options={[
              { value: 'cover' as const, label: 'Cover' },
              { value: 'contain' as const, label: 'Contain' },
              { value: 'fill' as const, label: 'Fill' },
            ]}
            value={bg.fit}
            onChange={(v) => setBackground({ ...bg, fit: v })}
          />
          <SliderRow
            label="Затемнение"
            value={bg.dim}
            min={0}
            max={0.9}
            step={0.05}
            onChange={(v) => setBackground({ ...bg, dim: v })}
            format={(v) => `${Math.round(v * 100)}%`}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  noteText: { color: colors.textDim, flex: 1, lineHeight: 17 },
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
});

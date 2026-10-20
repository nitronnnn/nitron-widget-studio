import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '@/store/editorStore';
import { LAYER_META } from '@/data/layerFactory';
import { colors, hitSlop, radii, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';
import { SectionLabel } from '@/components/controls/IconBtn';
import { AddLayerMenu } from './AddLayerMenu';
import { EmptyState } from '@/components/ui/EmptyState';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Список слоёв: верхний слой — первым. Выбор, видимость, замок, порядок. */
export function LayersPanel() {
  const doc = useEditorStore((s) => s.doc);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const setTab = useEditorStore((s) => s.setTab);
  const toggleVisible = useEditorStore((s) => s.toggleVisible);
  const toggleLocked = useEditorStore((s) => s.toggleLocked);
  const moveLayer = useEditorStore((s) => s.moveLayer);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!doc) return null;
  const reversed = [...doc.layers].reverse();

  return (
    <View>
      <SectionLabel title={`Слои · ${doc.layers.length}`} />
      {reversed.length === 0 && (
        <EmptyState icon="layers-outline" title="Пусто" text="Добавьте первый слой — текст, GIF, видео или часы." />
      )}
      {reversed.map((layer, idx) => {
        const selected = layer.id === selectedId;
        const meta = LAYER_META[layer.type];
        return (
          <Pressable
            key={layer.id}
            onPress={() => {
              haptic.select();
              select(layer.id);
            }}
            onLongPress={() => {
              haptic.light();
              select(layer.id);
              setTab('style');
            }}
            style={[styles.row, selected && styles.rowActive, !layer.visible && { opacity: 0.45 }]}
          >
            <Ionicons name={meta.icon as IconName} size={16} color={selected ? colors.accent : colors.textDim} />
            <Text numberOfLines={1} style={[text.body, styles.name, selected && { color: colors.text }]}>
              {layer.name}
            </Text>
            <RowAction
              icon={layer.visible ? 'eye-outline' : 'eye-off-outline'}
              onPress={() => toggleVisible(layer.id)}
            />
            <RowAction
              icon={layer.locked ? 'lock-closed' : 'lock-open-outline'}
              tint={layer.locked ? colors.amber : undefined}
              onPress={() => toggleLocked(layer.id)}
            />
            <RowAction
              icon="chevron-up"
              disabled={idx === 0}
              onPress={() => moveLayer(layer.id, 1)}
            />
            <RowAction
              icon="chevron-down"
              disabled={idx === reversed.length - 1}
              onPress={() => moveLayer(layer.id, -1)}
            />
          </Pressable>
        );
      })}

      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && { backgroundColor: colors.surface2 }]}
        onPress={() => {
          haptic.light();
          setMenuOpen(true);
        }}
      >
        <Ionicons name="add" size={18} color={colors.accent} />
        <Text style={[text.bodySemibold, { color: colors.accent }]}>Добавить слой</Text>
      </Pressable>

      <AddLayerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAdd={(t) => useEditorStore.getState().addLayer(t)}
      />
    </View>
  );
}

function RowAction({ icon, onPress, disabled, tint }: { icon: IconName; onPress: () => void; disabled?: boolean; tint?: string }) {
  return (
    <Pressable
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={[styles.action, disabled && { opacity: 0.25 }]}
    >
      <Ionicons name={icon} size={15} color={tint ?? colors.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: { borderColor: colors.accent, backgroundColor: colors.surface3 },
  name: { flex: 1, color: colors.textDim },
  action: { padding: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
});

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LayerType } from '@/types/widget';
import { LAYER_META } from '@/data/layerFactory';
import { colors, radii, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (type: LayerType) => void;
}

const TYPES = Object.keys(LAYER_META) as LayerType[];

/** Нижний шит с типами слоёв. */
export function AddLayerMenu({ visible, onClose, onAdd }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          <Text style={[text.title, styles.title]}>Добавить слой</Text>
          <View style={styles.grid}>
            {TYPES.map((t) => {
              const meta = LAYER_META[t];
              return (
                <Pressable
                  key={t}
                  style={({ pressed }) => [styles.cell, pressed && { backgroundColor: colors.surface3 }]}
                  onPress={() => {
                    haptic.medium();
                    onAdd(t);
                    onClose();
                  }}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={meta.icon as React.ComponentProps<typeof Ionicons>['name']}
                      size={22}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={[text.caption, styles.cellLabel]}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000A0', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: { color: colors.text, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: '23%',
    aspectRatio: 0.9,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: { color: colors.textDim, fontSize: 11 },
});

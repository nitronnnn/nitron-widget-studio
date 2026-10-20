import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WidgetDoc, WidgetSizeKind } from '@/types/widget';
import { useWidgetsStore } from '@/store/widgetsStore';
import { createEmptyDoc } from '@/data/layerFactory';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import { WidgetCard } from '@/components/cards/WidgetCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, neonGlow, radii, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const widgets = useWidgetsStore((s) => s.widgets);
  const duplicate = useWidgetsStore((s) => s.duplicate);
  const remove = useWidgetsStore((s) => s.remove);
  const [sizePicker, setSizePicker] = useState(false);

  const pad = spacing.lg;
  const gap = spacing.md;
  const cardW = (width - pad * 2 - gap) / 2;

  const createNew = (size: WidgetSizeKind) => {
    const doc = createEmptyDoc(size);
    useWidgetsStore.getState().save(doc);
    setSizePicker(false);
    haptic.medium();
    router.push({ pathname: '/editor/[id]', params: { id: doc.id } });
  };

  const openActions = (doc: WidgetDoc) => {
    Alert.alert(doc.name, 'Что сделать с виджетом?', [
      { text: 'Дублировать', onPress: () => duplicate(doc.id) },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Удалить виджет?', 'Действие нельзя отменить.', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: () => remove(doc.id) },
          ]),
      },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={[styles.header, { paddingHorizontal: pad }]}>
        <View style={{ flex: 1 }}>
          <Text style={[text.display, styles.logo]}>
            NITRON<Text style={{ color: colors.accent }}>·</Text>
          </Text>
          <Text style={[text.caption, styles.subtitle]}>WIDGET STUDIO</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={[text.caption, { color: colors.accent, fontWeight: '700' }]}>{widgets.length}</Text>
        </View>
      </View>

      <FlatList
        data={widgets}
        keyExtractor={(w) => w.id}
        numColumns={2}
        columnWrapperStyle={{ gap, paddingHorizontal: pad }}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: pad, paddingTop: 60 }}>
            <EmptyState
              icon="grid-outline"
              title="Пока пусто"
              text="Создайте первый виджет: часы, GIF, видео, батарея — что угодно. Или возьмите готовый пресет."
            />
          </View>
        }
        renderItem={({ item }) => (
          <WidgetCard
            doc={item}
            width={cardW}
            onPress={() => router.push({ pathname: '/editor/[id]', params: { id: item.id } })}
            onLongPress={() => openActions(item)}
          />
        )}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + spacing.xl }, pressed && { transform: [{ scale: 0.94 }] }]}
        onPress={() => {
          haptic.medium();
          setSizePicker(true);
        }}
      >
        <Ionicons name="add" size={30} color={colors.bg} />
      </Pressable>

      <Modal visible={sizePicker} transparent animationType="fade" onRequestClose={() => setSizePicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSizePicker(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            <Text style={[text.title, { color: colors.text, marginBottom: spacing.lg }]}>Новый виджет</Text>
            {(Object.keys(WIDGET_SIZES) as WidgetSizeKind[]).map((size) => {
              const spec = WIDGET_SIZES[size];
              return (
                <Pressable
                  key={size}
                  style={({ pressed }) => [styles.sizeRow, pressed && { backgroundColor: colors.surface3 }]}
                  onPress={() => createNew(size)}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44 * (spec.h / spec.w) || 44,
                      maxHeight: 44,
                      borderRadius: 8,
                      backgroundColor: colors.accentSoft,
                      borderWidth: 1.5,
                      borderColor: colors.accent,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[text.bodySemibold, { color: colors.text }]}>{spec.label}</Text>
                    <Text style={[text.caption, { color: colors.textFaint }]}>
                      {spec.grid} · {spec.w}×{spec.h}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { color: colors.text, letterSpacing: 2 },
  subtitle: { color: colors.textFaint, letterSpacing: 4, marginTop: 2 },
  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...neonGlow(colors.accent, 16),
  },
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
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});

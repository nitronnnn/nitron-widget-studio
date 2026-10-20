import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRESETS, PRESET_CATEGORIES, type PresetCategory } from '@/data/presets';
import { useWidgetsStore } from '@/store/widgetsStore';
import { PresetCard } from '@/components/cards/PresetCard';
import { colors, radii, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';

type Filter = 'Все' | PresetCategory;

export default function PresetsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<Filter>('Все');

  const pad = spacing.lg;
  const gap = spacing.md;
  const cardW = (width - pad * 2 - gap) / 2;

  const data = filter === 'Все' ? PRESETS : PRESETS.filter((p) => p.category === filter);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const doc = preset.build();
    useWidgetsStore.getState().save(doc);
    haptic.success();
    router.push({ pathname: '/editor/[id]', params: { id: doc.id } });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <View style={{ paddingHorizontal: pad }}>
        <Text style={[text.title, { color: colors.text }]}>Пресеты</Text>
        <Text style={[text.caption, { color: colors.textFaint, marginTop: 2 }]}>
          {PRESETS.length} готовых виджетов — тап, и он ваш
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={{ paddingHorizontal: pad, gap: spacing.sm, alignItems: 'center' }}
      >
        {(['Все', ...PRESET_CATEGORIES] as Filter[]).map((c) => {
          const active = filter === c;
          return (
            <Pressable
              key={c}
              onPress={() => {
                haptic.select();
                setFilter(c);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[text.caption, { color: active ? colors.bg : colors.textDim, fontWeight: active ? '700' : '500' }]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap, paddingHorizontal: pad }}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PresetCard preset={item} width={cardW} onPress={() => applyPreset(item.id)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  chipsScroll: { flexGrow: 0, marginTop: spacing.lg, marginBottom: spacing.sm },
  chip: {
    backgroundColor: colors.surface2,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
});

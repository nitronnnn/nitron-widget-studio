import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/store/settingsStore';
import { useWidgetsStore } from '@/store/widgetsStore';
import { Segmented } from '@/components/controls/Segmented';
import { Toggle } from '@/components/controls/Toggle';
import { SectionLabel } from '@/components/controls/IconBtn';
import { colors, radii, spacing, text } from '@/theme';
import { haptic } from '@/utils/haptics';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useSettingsStore((s) => s.haptics);
  const exportScale = useSettingsStore((s) => s.exportScale);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const setExportScale = useSettingsStore((s) => s.setExportScale);
  const widgets = useWidgetsStore((s) => s.widgets);
  const clearAll = useWidgetsStore((s) => s.clearAll);

  const confirmClear = () => {
    Alert.alert('Удалить все виджеты?', `Будут удалены все ${widgets.length} шт. Действие нельзя отменить.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить всё',
        style: 'destructive',
        onPress: () => {
          clearAll();
          haptic.warn();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[text.title, { color: colors.text }]}>Настройки</Text>

      <View style={styles.card}>
        <SectionLabel title="Экспорт PNG" />
        <Segmented
          options={[
            { value: 2, label: '2×' },
            { value: 3, label: '3×' },
            { value: 4, label: '4×' },
          ]}
          value={exportScale}
          onChange={setExportScale}
        />
        <Text style={[text.caption, styles.hint]}>
          Средний виджет при 3× → 1080×510 px. Альфа-канал сохраняется всегда.
        </Text>
      </View>

      <View style={styles.card}>
        <SectionLabel title="Интерфейс" />
        <Toggle label="Тактильный отклик (хаптика)" value={haptics} onChange={setHaptics} />
      </View>

      <View style={styles.card}>
        <SectionLabel title="Данные" />
        <View style={styles.dataRow}>
          <Ionicons name="grid-outline" size={16} color={colors.textDim} />
          <Text style={[text.body, { color: colors.textDim, flex: 1 }]}>
            Сохранено виджетов: {widgets.length}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.8 }]}
          onPress={confirmClear}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={[text.bodySemibold, { color: colors.danger }]}>Очистить всё</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionLabel title="О приложении" />
        <Text style={[text.bodySemibold, { color: colors.text }]}>Nitron WidgetStudio · 1.0.0</Text>
        <Text style={[text.caption, styles.hint]}>
          Конструктор домашних виджетов: слои, GIF и видео, прозрачный фон с альфа-каналом,
          неоновые свечения, живые часы и обратный отсчёт, экспорт в PNG.
        </Text>
        <Text style={[text.caption, styles.hint]}>
          Движок: Expo SDK 58 · React Native 0.88 · Reanimated · Gesture Handler
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  hint: { color: colors.textFaint, marginTop: spacing.sm, lineHeight: 17 },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FF5C6C1A',
    borderRadius: radii.md,
    paddingVertical: 12,
  },
});

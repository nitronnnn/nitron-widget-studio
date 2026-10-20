import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WidgetDoc } from '@/types/widget';
import { useEditorStore, type PanelTab } from '@/store/editorStore';
import { useWidgetsStore } from '@/store/widgetsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import { WidgetCanvas } from '@/components/canvas/WidgetCanvas';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { StylePanel } from '@/components/editor/StylePanel';
import { FxPanel } from '@/components/editor/FxPanel';
import { CanvasPanel } from '@/components/editor/CanvasPanel';
import { IconBtn } from '@/components/controls/IconBtn';
import { colors, radii, spacing, text } from '@/theme';
import { captureWidgetPng, savePngToGallery, sharePng } from '@/utils/exporter';
import { haptic } from '@/utils/haptics';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { key: PanelTab; label: string; icon: IconName }[] = [
  { key: 'layers', label: 'Слои', icon: 'layers-outline' },
  { key: 'style', label: 'Стиль', icon: 'color-wand-outline' },
  { key: 'fx', label: 'FX', icon: 'sparkles-outline' },
  { key: 'canvas', label: 'Холст', icon: 'square-outline' },
];

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();

  const doc = useEditorStore((s) => s.doc);
  const tab = useEditorStore((s) => s.tab);
  const capturing = useEditorStore((s) => s.capturing);
  const selectedId = useEditorStore((s) => s.selectedId);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const exportScale = useSettingsStore((s) => s.exportScale);

  const canvasRef = useRef<View>(null);
  const [canvasBoxW, setCanvasBoxW] = useState(0);
  const [busy, setBusy] = useState(false);

  // Открываем копию документа из хранилища
  useEffect(() => {
    const w = useWidgetsStore.getState().widgets.find((x) => x.id === id);
    if (w) useEditorStore.getState().open(JSON.parse(JSON.stringify(w)) as WidgetDoc);
    return () => useEditorStore.getState().close();
  }, [id]);

  if (!doc) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const size = WIDGET_SIZES[doc.size];
  const availW = Math.min(canvasBoxW || winW - spacing.xl * 2, winW - spacing.xl * 2);
  const scale = Math.max(0.3, Math.min(availW / size.w, (winH * 0.4) / size.h));

  const saveAndBack = () => {
    const d = useEditorStore.getState().doc;
    if (d) useWidgetsStore.getState().save(d);
    haptic.success();
    router.back();
  };

  const doExport = async (mode: 'save' | 'share') => {
    if (busy) return;
    setBusy(true);
    useEditorStore.getState().setCapturing(true);
    // ждём перерисовку без шахматки и рамок выделения
    await new Promise((r) => setTimeout(r, 160));
    try {
      const uri = await captureWidgetPng(canvasRef, size.w * exportScale, size.h * exportScale);
      haptic.success();
      if (mode === 'save') {
        await savePngToGallery(uri);
        Alert.alert('Готово', 'PNG сохранён в галерею — альфа-канал сохранён.');
      } else {
        const ok = await sharePng(uri);
        if (!ok) Alert.alert('Шаринг недоступен', 'На этом устройстве нет системного шаринга.');
      }
    } catch (e) {
      haptic.warn();
      Alert.alert('Экспорт не удался', e instanceof Error ? e.message : String(e));
    } finally {
      useEditorStore.getState().setCapturing(false);
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      {/* Верхняя панель */}
      <View style={styles.header}>
        <IconBtn icon="chevron-back" onPress={saveAndBack} />
        <TextInput
          style={styles.nameInput}
          value={doc.name}
          onChangeText={(v) => useEditorStore.getState().setName(v)}
          placeholder="Название"
          placeholderTextColor={colors.textFaint}
        />
        <IconBtn icon="arrow-undo" onPress={() => useEditorStore.getState().undo()} disabled={!canUndo} />
        <IconBtn icon="arrow-redo" onPress={() => useEditorStore.getState().redo()} disabled={!canRedo} />
        <IconBtn icon="download-outline" onPress={() => void doExport('save')} variant="active" />
        <IconBtn icon="share-outline" onPress={() => void doExport('share')} />
      </View>

      {/* Холст */}
      <Pressable
        style={styles.canvasArea}
        onLayout={(e) => setCanvasBoxW(e.nativeEvent.layout.width)}
        onPress={() => useEditorStore.getState().select(null)}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <WidgetCanvas
            doc={doc}
            scale={scale}
            editing={!capturing}
            captureMode={capturing}
            selectedId={selectedId}
            onSelect={(lid) => useEditorStore.getState().select(lid)}
            onCommitFrame={(lid, frame, rotation) => useEditorStore.getState().commitFrame(lid, frame, rotation)}
            canvasRef={canvasRef}
          />
        </Pressable>
        <Text style={[text.caption, styles.sizeHint]}>
          {size.label} · {size.w}×{size.h} pt · экспорт {size.w * exportScale}×{size.h * exportScale} px
          {busy ? ' · захват…' : ''}
        </Text>
      </Pressable>

      {/* Панель инспектора */}
      <View style={styles.panel}>
        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  haptic.select();
                  useEditorStore.getState().setTab(t.key);
                }}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Ionicons name={t.icon} size={15} color={active ? colors.accent : colors.textFaint} />
                <Text style={[text.caption, { color: active ? colors.accent : colors.textFaint, fontWeight: '600' }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tab === 'layers' && <LayersPanel />}
          {tab === 'style' && <StylePanel />}
          {tab === 'fx' && <FxPanel />}
          {tab === 'canvas' && <CanvasPanel />}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  nameInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  canvasArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  sizeHint: { color: colors.textFaint, marginTop: spacing.md },
  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
  },
  tabActive: { backgroundColor: colors.accentSoft },
});

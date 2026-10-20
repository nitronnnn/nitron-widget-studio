import { PixelRatio, View } from 'react-native';
import type { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

/**
 * Захватывает canvas виджета в PNG.
 * Прозрачный фон сохраняется как альфа-канал (view-shot + формат png).
 *
 * Опции width/height у captureRef задаются в логических единицах,
 * а на выходе умножаются на PixelRatio — поэтому делим целевые пиксели на ratio.
 */
export async function captureWidgetPng(
  ref: RefObject<View | null>,
  targetW: number,
  targetH: number,
): Promise<string> {
  const ratio = PixelRatio.get();
  // RefObject<View> совместим с CaptureTarget в рантайме; типы RN 0.88 расходятся.
  const target = ref as unknown as Parameters<typeof captureRef>[0];
  return captureRef(target, {
    result: 'tmpfile',
    format: 'png',
    quality: 1,
    width: targetW / ratio,
    height: targetH / ratio,
  });
}

/** Сохраняет PNG в галерею. Бросает Error, если нет разрешения. */
export async function savePngToGallery(uri: string): Promise<void> {
  const perm = await MediaLibrary.requestPermissionsAsync(true);
  if (!perm.granted) {
    throw new Error('Нет доступа к галерее. Разрешите сохранение в настройках.');
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}

/** Открывает системный шаринг для PNG. Возвращает false, если шаринг недоступен. */
export async function sharePng(uri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Экспорт виджета',
  });
  return true;
}

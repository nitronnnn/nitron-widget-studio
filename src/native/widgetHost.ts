import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import type { Layer, WidgetDoc } from '@/types/widget';
import { buildMediaLayers, buildWidgetSpec, isMediaLayer, needsNativeRendering } from './widgetSpec';

/**
 * Установка на домашний экран (Android):
 * пишем base.png, spec.json и медиа-файлы в filesDir/nitron_widgets/ —
 * оттуда их читают нативный AppWidgetProvider и сервис кадров.
 * documentDirectory === context.filesDir.
 */

const DIR = 'nitron_widgets';

export function isHomeWidgetSupported(): boolean {
  // В Expo Go нет нашего нативного AppWidgetProvider — только standalone APK.
  return Platform.OS === 'android' && Constants.appOwnership !== 'expo';
}

/** Есть ли GIF/видео или анимация — значит нужен «живой» режим и уведомление. */
export function hasAnimatedLayers(doc: WidgetDoc): boolean {
  return doc.layers.some(
    (l) => l.visible && (isMediaLayer(l) || (l.anim !== 'none' && needsNativeRendering(l))),
  );
}

/**
 * Android 12+ не даёт запускать foreground-сервис из фона, кроме нескольких
 * исключений — одно из них «Поверх других приложений». Без него анимация
 * в виджете не запустится, поэтому ведём пользователя в нужный экран настроек.
 */
export async function openOverlayPermissionSettings(): Promise<boolean> {
  try {
    await IntentLauncher.startActivityAsync('android.settings.action.MANAGE_OVERLAY_PERMISSION', {
      data: 'package:com.nitron.widgetstudio',
    });
    return true;
  } catch {
    try {
      await IntentLauncher.startActivityAsync('android.settings.APPLICATION_DETAILS_SETTINGS', {
        data: 'package:com.nitron.widgetstudio',
      });
      return true;
    } catch {
      return false;
    }
  }
}

/** Экран «Батарея → без ограничений» — на HiOS/MIUI/Realme сервис иначе убивают. */
export async function openBatterySettings(): Promise<void> {
  try {
    await IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch {
    // останется ручной путь через настройки
  }
}

function mediaUri(layer: Layer): string | null {
  if (layer.type === 'gif' || layer.type === 'video' || layer.type === 'image') {
    return layer.props.uri || null;
  }
  return null;
}

export async function publishWidgetToHomeScreen(
  doc: WidgetDoc,
  pngUri: string,
): Promise<{ animated: boolean }> {
  if (!isHomeWidgetSupported()) {
    throw new Error(
      Platform.OS === 'android'
        ? 'Виджеты на домашний экран работают в установленном APK, а не в Expo Go.'
        : 'Домашние виджеты пока доступны только на Android',
    );
  }
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('Нет доступа к файловой системе устройства');

  const dir = `${root}${DIR}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);

  // GIF/видео копируем в приватную папку: провайдер читает только локальные файлы.
  const fileNames: Record<string, string> = {};
  if (hasAnimatedLayers(doc)) {
    const mediaDir = `${dir}media/`;
    await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true }).catch(() => undefined);

    for (const layer of doc.layers) {
      if (!layer.visible || !isMediaLayer(layer)) continue;
      const uri = mediaUri(layer);
      if (!uri) continue;
      const ext = layer.type === 'gif' ? 'gif' : 'mp4';
      const name = `media/${layer.id}.${ext}`;
      try {
        if (/^https?:/i.test(uri)) {
          await FileSystem.downloadAsync(uri, `${dir}${name}`);
        } else {
          await FileSystem.copyAsync({ from: uri, to: `${dir}${name}` });
        }
        fileNames[layer.id] = name;
      } catch {
        // недоступный файл просто не попадёт в виджет
      }
    }
  }

  await FileSystem.copyAsync({ from: pngUri, to: `${dir}base.png` });
  const media = buildMediaLayers(doc, fileNames);
  await FileSystem.writeAsStringAsync(`${dir}spec.json`, JSON.stringify(buildWidgetSpec(doc, media)));

  return { animated: media.length > 0 };
}

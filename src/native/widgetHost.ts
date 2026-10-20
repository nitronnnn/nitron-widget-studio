import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { WidgetDoc } from '@/types/widget';
import { buildWidgetSpec } from './widgetSpec';

/**
 * Установка на домашний экран (Android):
 * пишем base.png + spec.json в filesDir/nitron_widgets/ — оттуда их читает
 * нативный AppWidgetProvider. Папка documentDirectory === context.filesDir.
 */

const DIR = 'nitron_widgets';

export function isHomeWidgetSupported(): boolean {
  return Platform.OS === 'android';
}

export async function publishWidgetToHomeScreen(doc: WidgetDoc, pngUri: string): Promise<void> {
  if (!isHomeWidgetSupported()) {
    throw new Error('Домашние виджеты пока доступны только на Android');
  }
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('Нет доступа к файловой системе устройства');

  const dir = `${root}${DIR}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
  await FileSystem.copyAsync({ from: pngUri, to: `${dir}base.png` });
  await FileSystem.writeAsStringAsync(`${dir}spec.json`, JSON.stringify(buildWidgetSpec(doc)));
}

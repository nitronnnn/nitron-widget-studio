import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/settingsStore';

function enabled() {
  return useSettingsStore.getState().haptics;
}

export const haptic = {
  light() {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium() {
    if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  select() {
    if (enabled()) void Haptics.selectionAsync();
  },
  success() {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warn() {
    if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
};

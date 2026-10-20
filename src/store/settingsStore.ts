import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  haptics: boolean;
  /** множитель разрешения при экспорте PNG (2 | 3 | 4) */
  exportScale: number;
  setHaptics: (v: boolean) => void;
  setExportScale: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      haptics: true,
      exportScale: 3,
      setHaptics: (v) => set({ haptics: v }),
      setExportScale: (v) => set({ exportScale: v }),
    }),
    {
      name: 'nitron.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

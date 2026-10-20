import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { WidgetDoc } from '@/types/widget';
import { uid } from '@/utils/id';

interface WidgetsState {
  widgets: WidgetDoc[];
  hydrated: boolean;
  save: (doc: WidgetDoc) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  rename: (id: string, name: string) => void;
  clearAll: () => void;
  setHydrated: () => void;
}

export const useWidgetsStore = create<WidgetsState>()(
  persist(
    (set) => ({
      widgets: [],
      hydrated: false,
      save: (doc) =>
        set((s) => {
          const stamped = { ...doc, updatedAt: Date.now() };
          const idx = s.widgets.findIndex((w) => w.id === doc.id);
          if (idx === -1) return { widgets: [stamped, ...s.widgets] };
          const next = [...s.widgets];
          next[idx] = stamped;
          return { widgets: next };
        }),
      remove: (id) => set((s) => ({ widgets: s.widgets.filter((w) => w.id !== id) })),
      duplicate: (id) =>
        set((s) => {
          const src = s.widgets.find((w) => w.id === id);
          if (!src) return s;
          const copy: WidgetDoc = {
            ...src,
            id: uid('w'),
            name: `${src.name} (копия)`,
            layers: src.layers.map((l) => ({ ...l, id: uid('l') })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return { widgets: [copy, ...s.widgets] };
        }),
      rename: (id, name) =>
        set((s) => ({
          widgets: s.widgets.map((w) => (w.id === id ? { ...w, name, updatedAt: Date.now() } : w)),
        })),
      clearAll: () => set({ widgets: [] }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'nitron.widgets.v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

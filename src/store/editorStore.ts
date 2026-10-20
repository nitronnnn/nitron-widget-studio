import { create } from 'zustand';
import type { BackgroundSpec, Frame, Layer, LayerType, WidgetDoc, WidgetSizeKind } from '@/types/widget';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import { createLayer } from '@/data/layerFactory';
import { uid } from '@/utils/id';

export type PanelTab = 'layers' | 'style' | 'fx' | 'canvas';

const HISTORY_CAP = 40;
/** Серии микро-изменений (драг слайдера) сливаются в один шаг undo. */
const HISTORY_COALESCE_MS = 800;

interface EditorState {
  doc: WidgetDoc | null;
  selectedId: string | null;
  tab: PanelTab;
  past: WidgetDoc[];
  future: WidgetDoc[];
  lastPushAt: number;
  /** true во время захвата PNG — прячет сетку прозрачности и рамку выделения */
  capturing: boolean;

  open: (doc: WidgetDoc) => void;
  close: () => void;
  setTab: (tab: PanelTab) => void;
  select: (id: string | null) => void;
  setCapturing: (v: boolean) => void;

  setName: (name: string) => void;
  setSize: (size: WidgetSizeKind) => void;
  setRadius: (radius: number) => void;
  setBackground: (bg: BackgroundSpec) => void;

  addLayer: (type: LayerType) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  moveLayer: (id: string, dir: 1 | -1) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  renameLayer: (id: string, name: string) => void;
  updateLayer: (id: string, recipe: (layer: Layer) => Layer) => void;
  patchLayerProps: (id: string, patch: Record<string, unknown>) => void;
  /** Коммит после жеста: без добавления в историю на каждый кадр. */
  commitFrame: (id: string, frame: Frame, rotation: number) => void;

  undo: () => void;
  redo: () => void;
}

function withHistory(s: EditorState, next: WidgetDoc): Partial<EditorState> {
  const now = Date.now();
  const coalesce = s.past.length > 0 && now - s.lastPushAt < HISTORY_COALESCE_MS;
  const past = s.doc && !coalesce ? [...s.past, s.doc].slice(-HISTORY_CAP) : s.past;
  return {
    doc: { ...next, updatedAt: now },
    past,
    future: [],
    lastPushAt: coalesce ? s.lastPushAt : now,
  };
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  doc: null,
  selectedId: null,
  tab: 'layers',
  past: [],
  future: [],
  lastPushAt: 0,
  capturing: false,

  open: (doc) => set({ doc, selectedId: null, tab: 'layers', past: [], future: [], lastPushAt: 0, capturing: false }),
  close: () => set({ doc: null, selectedId: null, past: [], future: [], capturing: false }),
  setTab: (tab) => set({ tab }),
  select: (id) => set({ selectedId: id }),
  setCapturing: (v) => set({ capturing: v }),

  setName: (name) => {
    const s = get();
    if (!s.doc) return;
    set({ doc: { ...s.doc, name } });
  },

  setSize: (size) => {
    const s = get();
    if (!s.doc || s.doc.size === size) return;
    const from = WIDGET_SIZES[s.doc.size];
    const to = WIDGET_SIZES[size];
    const kx = to.w / from.w;
    const ky = to.h / from.h;
    const layers = s.doc.layers.map((l) => ({
      ...l,
      frame: {
        x: Math.round(l.frame.x * kx),
        y: Math.round(l.frame.y * ky),
        w: Math.max(8, Math.round(l.frame.w * kx)),
        h: Math.max(8, Math.round(l.frame.h * ky)),
      },
    }));
    set(withHistory(s, { ...s.doc, size, layers }));
  },

  setRadius: (radius) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, { ...s.doc, radius }));
  },

  setBackground: (bg) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, { ...s.doc, background: bg }));
  },

  addLayer: (type) => {
    const s = get();
    if (!s.doc) return;
    const layer = createLayer(type, s.doc.size);
    set({
      ...withHistory(s, { ...s.doc, layers: [...s.doc.layers, layer] }),
      selectedId: layer.id,
      tab: 'style',
    });
  },

  removeLayer: (id) => {
    const s = get();
    if (!s.doc) return;
    set({
      ...withHistory(s, { ...s.doc, layers: s.doc.layers.filter((l) => l.id !== id) }),
      selectedId: s.selectedId === id ? null : s.selectedId,
    });
  },

  duplicateLayer: (id) => {
    const s = get();
    if (!s.doc) return;
    const src = s.doc.layers.find((l) => l.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: uid('l'),
      name: `${src.name} 2`,
      locked: false,
      frame: { ...src.frame, x: src.frame.x + 12, y: src.frame.y + 12 },
      props: { ...src.props },
    } as Layer;
    set({
      ...withHistory(s, { ...s.doc, layers: [...s.doc.layers, copy] }),
      selectedId: copy.id,
    });
  },

  moveLayer: (id, dir) => {
    const s = get();
    if (!s.doc) return;
    const layers = [...s.doc.layers];
    const idx = layers.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= layers.length) return;
    const [item] = layers.splice(idx, 1);
    layers.splice(target, 0, item);
    set(withHistory(s, { ...s.doc, layers }));
  },

  toggleVisible: (id) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, {
      ...s.doc,
      layers: s.doc.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    }));
  },

  toggleLocked: (id) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, {
      ...s.doc,
      layers: s.doc.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    }));
  },

  renameLayer: (id, name) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, {
      ...s.doc,
      layers: s.doc.layers.map((l) => (l.id === id ? { ...l, name } : l)),
    }));
  },

  updateLayer: (id, recipe) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, {
      ...s.doc,
      layers: s.doc.layers.map((l) => (l.id === id ? recipe(l) : l)),
    }));
  },

  patchLayerProps: (id, patch) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, {
      ...s.doc,
      layers: s.doc.layers.map((l) =>
        l.id === id ? ({ ...l, props: { ...l.props, ...patch } } as Layer) : l,
      ),
    }));
  },

  commitFrame: (id, frame, rotation) => {
    const s = get();
    if (!s.doc) return;
    set(withHistory(s, {
      ...s.doc,
      layers: s.doc.layers.map((l) => (l.id === id ? { ...l, frame, rotation } : l)),
    }));
  },

  undo: () => {
    const s = get();
    if (!s.doc || s.past.length === 0) return;
    const past = [...s.past];
    const prev = past.pop()!;
    set({ doc: prev, past, future: [s.doc, ...s.future].slice(0, HISTORY_CAP) });
  },

  redo: () => {
    const s = get();
    if (!s.doc || s.future.length === 0) return;
    const [next, ...rest] = s.future;
    set({ doc: next, future: rest, past: [...s.past, s.doc].slice(-HISTORY_CAP) });
  },
}));

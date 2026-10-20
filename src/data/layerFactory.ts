import type { Layer, LayerType, WidgetDoc, WidgetSizeKind } from '@/types/widget';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import { uid } from '@/utils/id';
import { isoInDays } from '@/utils/time';

export const LAYER_META: Record<LayerType, { label: string; icon: string }> = {
  text: { label: 'Текст', icon: 'text' },
  image: { label: 'Фото', icon: 'image' },
  gif: { label: 'GIF', icon: 'film' },
  video: { label: 'Видео', icon: 'play-circle' },
  shape: { label: 'Фигура', icon: 'shapes' },
  clock: { label: 'Часы', icon: 'time' },
  date: { label: 'Дата', icon: 'calendar' },
  battery: { label: 'Батарея', icon: 'battery-half' },
  progress: { label: 'Прогресс', icon: 'remove' },
  countdown: { label: 'Отсчёт', icon: 'hourglass' },
  icon: { label: 'Иконка', icon: 'sparkles' },
};

const SAMPLE_GIF = 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif';
const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_IMAGE = 'https://picsum.photos/seed/nitron/800/800';

/** Центрирует прямоугольник на холсте данного размера. */
function centered(size: WidgetSizeKind, w: number, h: number) {
  const canvas = WIDGET_SIZES[size];
  return {
    x: Math.round((canvas.w - w) / 2),
    y: Math.round((canvas.h - h) / 2),
    w,
    h,
  };
}

const base = (size: WidgetSizeKind, w: number, h: number) => ({
  id: uid('l'),
  name: '',
  visible: true,
  locked: false,
  opacity: 1,
  frame: centered(size, w, h),
  rotation: 0,
  anim: 'none' as const,
  animSpeed: 1,
});

export function createLayer(type: LayerType, size: WidgetSizeKind): Layer {
  switch (type) {
    case 'text':
      return {
        ...base(size, 220, 44),
        type,
        name: 'Текст',
        props: {
          text: 'NITRON',
          color: '#EDF3FA',
          fontSize: 28,
          fontKey: 'system',
          bold: true,
          align: 'center',
          letterSpacing: 0,
          uppercase: false,
          glowColor: '#35E0FF',
          glowRadius: 0,
        },
      };
    case 'image':
      return {
        ...base(size, 140, 140),
        type,
        name: 'Фото',
        props: { uri: SAMPLE_IMAGE, fit: 'cover', radius: 20, borderWidth: 0, borderColor: '#35E0FF' },
      };
    case 'gif':
      return {
        ...base(size, 150, 150),
        type,
        name: 'GIF',
        props: { uri: SAMPLE_GIF, fit: 'cover', radius: 20, borderWidth: 0, borderColor: '#35E0FF', autoplay: true },
      };
    case 'video':
      return {
        ...base(size, 220, 124),
        type,
        name: 'Видео',
        props: {
          uri: SAMPLE_VIDEO, fit: 'cover', radius: 16, borderWidth: 0, borderColor: '#35E0FF',
          muted: true, loop: true, playing: true,
        },
      };
    case 'shape':
      return {
        ...base(size, 140, 140),
        type,
        name: 'Фигура',
        props: {
          shape: 'rect',
          fill: { kind: 'color', color: '#35E0FF33', gradient: { colors: ['#35E0FF', '#FF4DE3'], angle: 135 } },
          strokeWidth: 0,
          strokeColor: '#35E0FF',
          glowColor: '#35E0FF',
          glowRadius: 0,
        },
      };
    case 'clock':
      return {
        ...base(size, 260, 70),
        type,
        name: 'Часы',
        props: {
          format24: true, showSeconds: false, color: '#EDF3FA', fontSize: 52, fontKey: 'mono',
          bold: true, align: 'center', glowColor: '#35E0FF', glowRadius: 12,
        },
      };
    case 'date':
      return {
        ...base(size, 240, 30),
        type,
        name: 'Дата',
        props: {
          pattern: 'D MMMM, dd', color: '#97A3B6', fontSize: 18, fontKey: 'system',
          bold: false, align: 'center', uppercase: true,
        },
      };
    case 'battery':
      return {
        ...base(size, 120, 120),
        type,
        name: 'Батарея',
        props: { style: 'ring', color: '#3DFFA2', trackColor: '#232C3F', fontSize: 24, fontKey: 'mono', showPercent: true },
      };
    case 'progress':
      return {
        ...base(size, 260, 14),
        type,
        name: 'Прогресс',
        props: { value: 0.62, color: '#35E0FF', colorEnd: '#FF4DE3', useGradient: true, trackColor: '#232C3F', angle: 0 },
      };
    case 'countdown':
      return {
        ...base(size, 300, 90),
        type,
        name: 'Отсчёт',
        props: {
          targetISO: isoInDays(7), label: 'ДО ЗАПУСКА', color: '#EDF3FA',
          accentColor: '#35E0FF', fontSize: 34, fontKey: 'mono',
        },
      };
    case 'icon':
      return {
        ...base(size, 64, 64),
        type,
        name: 'Иконка',
        props: { name: 'planet', color: '#35E0FF', glowColor: '#35E0FF', glowRadius: 14 },
      };
  }
}

export function createEmptyDoc(size: WidgetSizeKind, name = 'Новый виджет'): WidgetDoc {
  return {
    id: uid('w'),
    name,
    size,
    radius: 28,
    background: { kind: 'color', color: '#0D1017' },
    layers: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

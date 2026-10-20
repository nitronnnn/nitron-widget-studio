import type { BackgroundSpec, Layer, WidgetDoc, WidgetSizeKind } from '@/types/widget';
import { uid } from '@/utils/id';
import { isoInDays } from '@/utils/time';

export type PresetCategory = 'Часы' | 'Медиа' | 'Система' | 'Арт';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  size: WidgetSizeKind;
  build: () => WidgetDoc;
}

const GIF = 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif';
const VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

/** Дистрибутивный Omit: сохраняет дискриминированное объединение слоёв. */
type LayerSeed = Layer extends infer T ? (T extends Layer ? Omit<T, 'id'> : never) : never;

function mk(size: WidgetSizeKind, name: string, background: BackgroundSpec, seeds: LayerSeed[], radius = 28): WidgetDoc {
  return {
    id: uid('w'),
    name,
    size,
    radius,
    background,
    layers: seeds.map((s) => ({ ...s, id: uid('l') }) as Layer),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function L<T extends Layer['type']>(
  type: T,
  name: string,
  frame: { x: number; y: number; w: number; h: number },
  props: Extract<Layer, { type: T }>['props'],
  extra: Partial<Pick<Layer, 'opacity' | 'rotation' | 'anim' | 'animSpeed'>> = {},
): LayerSeed {
  return {
    type,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    rotation: 0,
    anim: 'none',
    animSpeed: 1,
    ...extra,
    frame,
    props,
  } as LayerSeed;
}

export const PRESETS: Preset[] = [
  {
    id: 'neon-clock',
    name: 'Неоновые часы',
    description: 'Моноширинные часы с циановым свечением',
    category: 'Часы',
    size: 'medium',
    build: () =>
      mk('medium', 'Неоновые часы', { kind: 'color', color: '#0B0E15' }, [
        L('date', 'Дата', { x: 0, y: 26, w: 360, h: 20 }, {
          pattern: 'dd, D MMMM', color: '#97A3B6', fontSize: 13, fontKey: 'system', bold: false, align: 'center', uppercase: true,
        }),
        L('clock', 'Часы', { x: 0, y: 52, w: 360, h: 66 }, {
          format24: true, showSeconds: false, color: '#EDF3FA', fontSize: 54, fontKey: 'mono',
          bold: true, align: 'center', glowColor: '#35E0FF', glowRadius: 16,
        }),
        L('shape', 'Линия', { x: 150, y: 134, w: 60, h: 4 }, {
          shape: 'pill',
          fill: { kind: 'gradient', color: '#35E0FF', gradient: { colors: ['#35E0FF', '#FF4DE3'], angle: 0 } },
          strokeWidth: 0, strokeColor: '#35E0FF', glowColor: '#35E0FF', glowRadius: 10,
        }),
      ]),
  },
  {
    id: 'minimal-clock',
    name: 'Минимал',
    description: 'Прозрачный фон — часы парят над обоями',
    category: 'Часы',
    size: 'small',
    build: () =>
      mk('small', 'Минимал', { kind: 'transparent' }, [
        L('clock', 'Часы', { x: 0, y: 48, w: 170, h: 58 }, {
          format24: true, showSeconds: false, color: '#EDF3FA', fontSize: 42, fontKey: 'system',
          bold: true, align: 'center', glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('date', 'Дата', { x: 0, y: 112, w: 170, h: 20 }, {
          pattern: 'D MMMM', color: '#97A3B6', fontSize: 13, fontKey: 'system', bold: false, align: 'center', uppercase: true,
        }),
      ], 0),
  },
  {
    id: 'gif-booth',
    name: 'GIF Booth',
    description: 'Живой GIF во весь виджет с подписью',
    category: 'Медиа',
    size: 'medium',
    build: () =>
      mk('medium', 'GIF Booth', { kind: 'color', color: '#06070B' }, [
        L('gif', 'GIF', { x: 0, y: 0, w: 360, h: 170 }, {
          uri: GIF, fit: 'cover', radius: 24, borderWidth: 0, borderColor: '#35E0FF', autoplay: true,
        }),
        L('shape', 'Затемнение', { x: 0, y: 70, w: 360, h: 100 }, {
          shape: 'rect',
          fill: { kind: 'gradient', color: '#06070B00', gradient: { colors: ['#06070B00', '#06070BE6'], angle: 90 } },
          strokeWidth: 0, strokeColor: '#35E0FF', glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('text', 'Подпись', { x: 18, y: 112, w: 300, h: 34 }, {
          text: 'ORBIT MODE', color: '#EDF3FA', fontSize: 24, fontKey: 'system', bold: true,
          align: 'left', letterSpacing: 1, uppercase: true, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('text', 'Тег', { x: 18, y: 144, w: 200, h: 16 }, {
          text: 'GIF • LOOP', color: '#35E0FF', fontSize: 11, fontKey: 'mono', bold: false,
          align: 'left', letterSpacing: 2, uppercase: true, glowColor: '#35E0FF', glowRadius: 8,
        }),
      ]),
  },
  {
    id: 'vhs-recorder',
    name: 'VHS Рекордер',
    description: 'Видео-виджет с индикатором записи',
    category: 'Медиа',
    size: 'medium',
    build: () =>
      mk('medium', 'VHS Рекордер', { kind: 'color', color: '#06070B' }, [
        L('video', 'Видео', { x: 0, y: 0, w: 360, h: 170 }, {
          uri: VIDEO, fit: 'cover', radius: 24, borderWidth: 0, borderColor: '#35E0FF', muted: true, loop: true, playing: true,
        }),
        L('shape', 'Точка REC', { x: 18, y: 20, w: 12, h: 12 }, {
          shape: 'circle',
          fill: { kind: 'color', color: '#FF5C6C', gradient: { colors: ['#FF5C6C', '#FF5C6C'], angle: 0 } },
          strokeWidth: 0, strokeColor: '#FF5C6C', glowColor: '#FF5C6C', glowRadius: 12,
        }, { anim: 'blink', animSpeed: 1.4 }),
        L('text', 'REC', { x: 38, y: 12, w: 70, h: 26 }, {
          text: 'REC', color: '#FF5C6C', fontSize: 16, fontKey: 'mono', bold: true,
          align: 'left', letterSpacing: 2, uppercase: true, glowColor: '#FF5C6C', glowRadius: 8,
        }),
        L('text', 'PLAY', { x: 16, y: 136, w: 120, h: 22 }, {
          text: 'PLAY  ▶', color: '#EDF3FACC', fontSize: 13, fontKey: 'mono', bold: false,
          align: 'left', letterSpacing: 1, uppercase: true, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('date', 'Таймкод', { x: 216, y: 138, w: 128, h: 20 }, {
          pattern: 'DD.MM.YY', color: '#EDF3FA99', fontSize: 12, fontKey: 'mono', bold: false, align: 'right', uppercase: false,
        }),
      ]),
  },
  {
    id: 'music-player',
    name: 'Плеер',
    description: 'Обложка, прогресс и неоновый градиент',
    category: 'Медиа',
    size: 'medium',
    build: () =>
      mk('medium', 'Плеер', { kind: 'gradient', gradient: { colors: ['#141926', '#0B0E15'], angle: 135 } }, [
        L('image', 'Обложка', { x: 16, y: 30, w: 110, h: 110 }, {
          uri: 'https://picsum.photos/seed/nitron-music/400/400', fit: 'cover', radius: 18, borderWidth: 1, borderColor: '#35E0FF66',
        }),
        L('text', 'Трек', { x: 142, y: 42, w: 200, h: 26 }, {
          text: 'Midnight Drive', color: '#EDF3FA', fontSize: 19, fontKey: 'system', bold: true,
          align: 'left', letterSpacing: 0, uppercase: false, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('text', 'Артист', { x: 142, y: 70, w: 200, h: 18 }, {
          text: 'Synthwave • Live', color: '#97A3B6', fontSize: 13, fontKey: 'system', bold: false,
          align: 'left', letterSpacing: 0, uppercase: false, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('progress', 'Прогресс', { x: 142, y: 102, w: 178, h: 6 }, {
          value: 0.45, color: '#35E0FF', colorEnd: '#FF4DE3', useGradient: true, trackColor: '#232C3F', angle: 0,
        }),
        L('text', 'Время', { x: 142, y: 116, w: 178, h: 14 }, {
          text: '1:24  /  3:07', color: '#5B6678', fontSize: 10, fontKey: 'mono', bold: false,
          align: 'left', letterSpacing: 1, uppercase: false, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('icon', 'Play', { x: 314, y: 62, w: 34, h: 34 }, {
          name: 'play', color: '#EDF3FA', glowColor: '#35E0FF', glowRadius: 10,
        }),
      ]),
  },
  {
    id: 'battery-ring',
    name: 'Кольцо батареи',
    description: 'Живой заряд устройства на прозрачном фоне',
    category: 'Система',
    size: 'small',
    build: () =>
      mk('small', 'Кольцо батареи', { kind: 'transparent' }, [
        L('battery', 'Батарея', { x: 25, y: 25, w: 120, h: 120 }, {
          style: 'ring', color: '#3DFFA2', trackColor: '#232C3F', fontSize: 24, fontKey: 'mono', showPercent: true,
        }),
      ], 0),
  },
  {
    id: 'countdown-ny',
    name: 'Обратный отсчёт',
    description: 'Дни, часы, минуты и секунды до события',
    category: 'Система',
    size: 'medium',
    build: () =>
      mk('medium', 'Обратный отсчёт', { kind: 'gradient', gradient: { colors: ['#1A0B2E', '#06070B'], angle: 160 } }, [
        L('text', 'Метка', { x: 0, y: 26, w: 360, h: 18 }, {
          text: 'ДО ЗАПУСКА', color: '#FF4DE3', fontSize: 12, fontKey: 'system', bold: true,
          align: 'center', letterSpacing: 4, uppercase: true, glowColor: '#FF4DE3', glowRadius: 10,
        }),
        L('countdown', 'Отсчёт', { x: 0, y: 50, w: 360, h: 90 }, {
          targetISO: isoInDays(12), label: '', color: '#EDF3FA', accentColor: '#35E0FF', fontSize: 40, fontKey: 'mono',
        }),
      ]),
  },
  {
    id: 'quote-card',
    name: 'Цитата',
    description: 'Стеклянная карточка с акцентной чертой',
    category: 'Арт',
    size: 'small',
    build: () =>
      mk('small', 'Цитата', { kind: 'color', color: '#141926E6' }, [
        L('shape', 'Черта', { x: 18, y: 32, w: 4, h: 76 }, {
          shape: 'pill',
          fill: { kind: 'gradient', color: '#35E0FF', gradient: { colors: ['#35E0FF', '#35E0FF00'], angle: 90 } },
          strokeWidth: 0, strokeColor: '#35E0FF', glowColor: '#35E0FF', glowRadius: 8,
        }),
        L('text', 'Цитата', { x: 32, y: 26, w: 122, h: 104 }, {
          text: 'Дисциплина сильнее мотивации.', color: '#EDF3FA', fontSize: 15, fontKey: 'serif', bold: false,
          align: 'left', letterSpacing: 0, uppercase: false, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('text', 'Автор', { x: 32, y: 136, w: 122, h: 16 }, {
          text: '— NITRON', color: '#5B6678', fontSize: 10, fontKey: 'mono', bold: false,
          align: 'left', letterSpacing: 2, uppercase: true, glowColor: '#35E0FF', glowRadius: 0,
        }),
      ]),
  },
  {
    id: 'crypto-ticker',
    name: 'Крипто-тикер',
    description: 'Курс, изменение и шкала дня',
    category: 'Система',
    size: 'medium',
    build: () =>
      mk('medium', 'Крипто-тикер', { kind: 'color', color: '#0B0E15' }, [
        L('icon', 'Монета', { x: 18, y: 20, w: 28, h: 28 }, {
          name: 'logo-bitcoin', color: '#FFC24D', glowColor: '#FFC24D', glowRadius: 10,
        }),
        L('text', 'Пара', { x: 54, y: 22, w: 170, h: 24 }, {
          text: 'BTC / USDT', color: '#EDF3FA', fontSize: 16, fontKey: 'system', bold: true,
          align: 'left', letterSpacing: 0.5, uppercase: true, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('text', 'Курс', { x: 16, y: 52, w: 240, h: 46 }, {
          text: '$97 241', color: '#3DFFA2', fontSize: 36, fontKey: 'mono', bold: true,
          align: 'left', letterSpacing: 0, uppercase: false, glowColor: '#3DFFA2', glowRadius: 12,
        }),
        L('text', 'Изменение', { x: 18, y: 104, w: 140, h: 18 }, {
          text: '▲ +2.4%', color: '#3DFFA2', fontSize: 13, fontKey: 'mono', bold: false,
          align: 'left', letterSpacing: 0, uppercase: false, glowColor: '#3DFFA2', glowRadius: 0,
        }),
        L('text', 'Объём', { x: 240, y: 104, w: 104, h: 16 }, {
          text: 'VOL 24H', color: '#5B6678', fontSize: 10, fontKey: 'mono', bold: false,
          align: 'right', letterSpacing: 1, uppercase: true, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('progress', 'Шкала', { x: 16, y: 134, w: 328, h: 8 }, {
          value: 0.7, color: '#35E0FF', colorEnd: '#FF4DE3', useGradient: true, trackColor: '#232C3F', angle: 0,
        }),
      ]),
  },
  {
    id: 'weather-glass',
    name: 'Погода',
    description: 'Температура крупно, глубокий синий градиент',
    category: 'Система',
    size: 'medium',
    build: () =>
      mk('medium', 'Погода', { kind: 'gradient', gradient: { colors: ['#12233D', '#0B0E15'], angle: 120 } }, [
        L('icon', 'Иконка', { x: 270, y: 36, w: 72, h: 72 }, {
          name: 'partly-sunny', color: '#FFC24D', glowColor: '#FFC24D', glowRadius: 16,
        }),
        L('text', 'Температура', { x: 20, y: 34, w: 180, h: 68 }, {
          text: '−3°', color: '#EDF3FA', fontSize: 58, fontKey: 'light', bold: false,
          align: 'left', letterSpacing: -1, uppercase: false, glowColor: '#35E0FF', glowRadius: 0,
        }),
        L('text', 'Город', { x: 22, y: 110, w: 220, h: 20 }, {
          text: 'Екатеринбург • снег', color: '#97A3B6', fontSize: 14, fontKey: 'system', bold: false,
          align: 'left', letterSpacing: 0, uppercase: false, glowColor: '#35E0FF', glowRadius: 0,
        }),
      ]),
  },
  {
    id: 'streak-fire',
    name: 'Стрик',
    description: 'Пламя и счётчик дней подряд',
    category: 'Арт',
    size: 'small',
    build: () =>
      mk('small', 'Стрик', { kind: 'color', color: '#0B0E15' }, [
        L('icon', 'Пламя', { x: 55, y: 16, w: 60, h: 60 }, {
          name: 'flame', color: '#FF4DE3', glowColor: '#FF4DE3', glowRadius: 20,
        }, { anim: 'pulse', animSpeed: 1.2 }),
        L('text', 'Счётчик', { x: 0, y: 82, w: 170, h: 52 }, {
          text: '12', color: '#EDF3FA', fontSize: 44, fontKey: 'system', bold: true,
          align: 'center', letterSpacing: 0, uppercase: false, glowColor: '#FF4DE3', glowRadius: 14,
        }),
        L('text', 'Подпись', { x: 0, y: 136, w: 170, h: 16 }, {
          text: 'дней подряд', color: '#5B6678', fontSize: 11, fontKey: 'system', bold: false,
          align: 'center', letterSpacing: 2, uppercase: true, glowColor: '#35E0FF', glowRadius: 0,
        }),
      ]),
  },
  {
    id: 'photo-alpha',
    name: 'Фото-рамка',
    description: 'Прозрачный холст — фото парит на обоях',
    category: 'Арт',
    size: 'small',
    build: () =>
      mk('small', 'Фото-рамка', { kind: 'transparent' }, [
        L('shape', 'Ореол', { x: 7, y: 7, w: 156, h: 156 }, {
          shape: 'ring',
          fill: { kind: 'color', color: '#35E0FF00', gradient: { colors: ['#35E0FF', '#FF4DE3'], angle: 0 } },
          strokeWidth: 2, strokeColor: '#35E0FF99', glowColor: '#35E0FF', glowRadius: 16,
        }),
        L('image', 'Фото', { x: 13, y: 13, w: 144, h: 144 }, {
          uri: 'https://picsum.photos/seed/nitron-frame/500/500', fit: 'cover', radius: 26, borderWidth: 0, borderColor: '#35E0FF',
        }),
      ], 0),
  },
];

export const PRESET_CATEGORIES: PresetCategory[] = ['Часы', 'Медиа', 'Система', 'Арт'];

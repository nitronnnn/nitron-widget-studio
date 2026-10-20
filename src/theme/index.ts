import { Platform, TextStyle } from 'react-native';
import type { FontKey } from '@/types/widget';

/** Палитра Nitron — тёмная, холодная, с неоновым цианом и магентой. */
export const colors = {
  bg: '#06070B',
  surface: '#0D1017',
  surface2: '#141926',
  surface3: '#1C2333',
  border: '#232C3F',
  borderSoft: '#1A2130',

  text: '#EDF3FA',
  textDim: '#97A3B6',
  textFaint: '#5B6678',

  accent: '#35E0FF',
  accentSoft: '#35E0FF26',
  accent2: '#FF4DE3',
  mint: '#3DFFA2',
  amber: '#FFC24D',
  danger: '#FF5C6C',

  checkerA: '#14161C',
  checkerB: '#0B0D12',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

/** Платформенные семейства шрифтов для слоёв. */
export function fontFor(key: FontKey): string | undefined {
  switch (key) {
    case 'mono':
      return Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined });
    case 'serif':
      return Platform.select({ ios: 'Georgia', android: 'serif', default: undefined });
    case 'rounded':
      return Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: undefined });
    case 'condensed':
      return Platform.select({ ios: 'Avenir Next Condensed', android: 'sans-serif-condensed', default: undefined });
    case 'light':
      return Platform.select({ ios: 'System', android: 'sans-serif-light', default: undefined });
    case 'system':
    default:
      return undefined;
  }
}

export const FONT_OPTIONS: { key: FontKey; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'mono', label: 'Mono' },
  { key: 'serif', label: 'Serif' },
  { key: 'rounded', label: 'Rounded' },
  { key: 'condensed', label: 'Condensed' },
  { key: 'light', label: 'Light' },
];

export const text = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 } as TextStyle,
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 } as TextStyle,
  section: { fontSize: 13, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' } as TextStyle,
  body: { fontSize: 15, fontWeight: '400' } as TextStyle,
  bodySemibold: { fontSize: 15, fontWeight: '600' } as TextStyle,
  caption: { fontSize: 12, fontWeight: '500' } as TextStyle,
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** RN 0.88 убрал StyleSheet.absoluteFillObject из типов — локальная замена. */
export const ABS_FILL = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

/** Неоновая тень для карточек и акцентов. */
export function neonGlow(color: string, radius = 18) {
  return {
    shadowColor: color,
    shadowOpacity: 0.55,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  } as const;
}

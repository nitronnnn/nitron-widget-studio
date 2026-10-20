import type { WidgetSizeKind } from '@/types/widget';

export interface WidgetSizeSpec {
  w: number;
  h: number;
  label: string;
  grid: string;
}

/** Логические размеры холста в pt (приближены к реальным слотам домашнего экрана). */
export const WIDGET_SIZES: Record<WidgetSizeKind, WidgetSizeSpec> = {
  small: { w: 170, h: 170, label: 'Малый', grid: '2 × 2' },
  medium: { w: 360, h: 170, label: 'Средний', grid: '4 × 2' },
  large: { w: 360, h: 380, label: 'Большой', grid: '4 × 4' },
};

export const SIZE_ORDER: WidgetSizeKind[] = ['small', 'medium', 'large'];

/** Множители экспорта PNG. */
export const EXPORT_SCALES = [2, 3, 4] as const;

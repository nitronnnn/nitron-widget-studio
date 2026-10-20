import { WIDGET_SIZES } from '@/constants/widgetSizes';
import type { Layer, WidgetDoc } from '@/types/widget';

/**
 * Спека для нативного Android-виджета.
 * Живые слои (часы/дата/отсчёт/батарея) не попадают в base.png —
 * их рисует Kotlin-рендерер при каждом обновлении виджета.
 */

const LIVE_TYPES: ReadonlySet<string> = new Set(['clock', 'date', 'battery', 'countdown']);

export function isLiveLayer(layer: Layer): boolean {
  return LIVE_TYPES.has(layer.type);
}

/** Переводим токены нашего форматтера в java.text.SimpleDateFormat. */
export function toJavaPattern(pattern: string): string {
  return pattern.replace(/MMMM|MMM|YYYY|YY|HH|H|hh|h|mm|m|ss|s|DD|D|dd|A|a/g, (token) => {
    switch (token) {
      case 'YYYY':
        return 'yyyy';
      case 'YY':
        return 'yy';
      case 'DD':
        return 'dd';
      case 'D':
        return 'd';
      case 'dd':
        return 'EEE';
      case 'A':
        return 'a';
      default:
        return token;
    }
  });
}

export interface NativeLiveLayer {
  op: 'clock' | 'date' | 'battery' | 'countdown';
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  alpha: number;
  size: number;
  color: string;
  font: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  ls: number;
  glow: string;
  glowR: number;
  format24?: boolean;
  showSeconds?: boolean;
  jpattern?: string;
  showPercent?: boolean;
  style?: string;
  trackColor?: string;
  accentColor?: string;
  targetMs?: number;
  label?: string;
}

export interface NativeWidgetSpec {
  w: number;
  h: number;
  radius: number;
  base: string;
  live: NativeLiveLayer[];
}

export function buildWidgetSpec(doc: WidgetDoc): NativeWidgetSpec {
  const size = WIDGET_SIZES[doc.size];
  const live: NativeLiveLayer[] = [];

  for (const layer of doc.layers) {
    if (!layer.visible || !isLiveLayer(layer)) continue;
    const f = layer.frame;
    const base = {
      x: f.x,
      y: f.y,
      w: f.w,
      h: f.h,
      rot: layer.rotation,
      alpha: layer.opacity,
      ls: 0,
      glow: '#00000000',
      glowR: 0,
    };

    if (layer.type === 'clock') {
      const p = layer.props;
      live.push({
        ...base,
        op: 'clock',
        size: p.fontSize,
        color: p.color,
        font: p.fontKey,
        bold: p.bold,
        align: p.align,
        glow: p.glowColor,
        glowR: p.glowRadius,
        format24: p.format24,
        showSeconds: p.showSeconds,
      });
    } else if (layer.type === 'date') {
      const p = layer.props;
      live.push({
        ...base,
        op: 'date',
        size: p.fontSize,
        color: p.color,
        font: p.fontKey,
        bold: p.bold,
        align: p.align,
        jpattern: toJavaPattern(p.pattern),
      });
    } else if (layer.type === 'battery') {
      const p = layer.props;
      live.push({
        ...base,
        op: 'battery',
        size: p.fontSize,
        color: p.color,
        font: p.fontKey,
        bold: true,
        align: 'center',
        showPercent: p.showPercent,
        style: p.style,
        trackColor: p.trackColor,
      });
    } else if (layer.type === 'countdown') {
      const p = layer.props;
      live.push({
        ...base,
        op: 'countdown',
        size: p.fontSize,
        color: p.color,
        font: p.fontKey,
        bold: true,
        align: 'center',
        accentColor: p.accentColor,
        targetMs: Date.parse(p.targetISO) || 0,
        label: p.label,
      });
    }
  }

  return { w: size.w, h: size.h, radius: doc.radius, base: 'base.png', live };
}

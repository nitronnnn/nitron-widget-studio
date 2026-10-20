import { Ionicons } from '@expo/vector-icons';
import { WIDGET_SIZES } from '@/constants/widgetSizes';
import type { Layer, WidgetDoc } from '@/types/widget';

/**
 * Спека для нативного Android-виджета.
 * Живые слои (часы/дата/отсчёт/батарея) не попадают в base.png —
 * их рисует Kotlin-рендерер при каждом обновлении виджета.
 */

const LIVE_TYPES: ReadonlySet<string> = new Set(['clock', 'date', 'battery', 'countdown']);
const MEDIA_TYPES: ReadonlySet<string> = new Set(['gif', 'video']);

export function isLiveLayer(layer: Layer): boolean {
  return LIVE_TYPES.has(layer.type);
}

/** GIF и видео нельзя «запечь» в PNG — их проигрывает нативный сервис кадров. */
export function isMediaLayer(layer: Layer): boolean {
  return MEDIA_TYPES.has(layer.type);
}

/**
 * Слой нужно рисовать нативно, а не запекать в base.png:
 * часы/дата/отсчёт/батарея (динамика) + анимированный текст.
 */
export function needsNativeRendering(layer: Layer): boolean {
  if (isLiveLayer(layer)) return true;
  if (layer.anim === 'none') return false;
  return layer.type === 'text' || layer.type === 'icon';
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
  op: 'clock' | 'date' | 'battery' | 'countdown' | 'text' | 'icon';
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
  /** текст для op='text' — анимированный текстовый слой */
  text?: string;
  /** codepoint глифа Ionicons для op='icon' */
  glyph?: number;
  anim?: string;
  animSpeed?: number;
}

export interface NativeWidgetSpec {
  w: number;
  h: number;
  radius: number;
  base: string;
  live: NativeLiveLayer[];
  media: NativeMediaLayer[];
  animated: boolean;
}

export interface NativeMediaLayer {
  kind: 'gif' | 'video';
  /** путь относительно nitron_widgets/ */
  file: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  opacity: number;
  radius: number;
  fit: string;
  anim: string;
  animSpeed: number;
}

/** Медиа-слои для нативного плеера. Файлы копируются в widgetHost. */
export function buildMediaLayers(doc: WidgetDoc, fileNames: Record<string, string>): NativeMediaLayer[] {
  const media: NativeMediaLayer[] = [];
  for (const layer of doc.layers) {
    if (!layer.visible || !isMediaLayer(layer)) continue;
    const file = fileNames[layer.id];
    if (!file) continue;
    const props = layer.props as { fit: string; radius: number };
    media.push({
      kind: layer.type === 'gif' ? 'gif' : 'video',
      file,
      x: layer.frame.x,
      y: layer.frame.y,
      w: layer.frame.w,
      h: layer.frame.h,
      rot: layer.rotation,
      opacity: layer.opacity,
      radius: props.radius ?? 0,
      fit: props.fit ?? 'cover',
      anim: layer.anim,
      animSpeed: layer.animSpeed,
    });
  }
  return media;
}

export function buildWidgetSpec(
  doc: WidgetDoc,
  media: NativeMediaLayer[] = [],
): NativeWidgetSpec {
  const size = WIDGET_SIZES[doc.size];
  const live: NativeLiveLayer[] = [];

  for (const layer of doc.layers) {
    if (!layer.visible || !needsNativeRendering(layer)) continue;
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
      anim: layer.anim,
      animSpeed: layer.animSpeed,
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
    } else if (layer.type === 'text') {
      const p = layer.props;
      live.push({
        ...base,
        op: 'text',
        text: p.uppercase ? p.text.toUpperCase() : p.text,
        size: p.fontSize,
        color: p.color,
        font: p.fontKey,
        bold: p.bold,
        align: p.align,
        ls: p.letterSpacing,
        glow: p.glowColor,
        glowR: p.glowRadius,
      });
    } else if (layer.type === 'icon') {
      const p = layer.props;
      const glyph = (Ionicons.glyphMap as Record<string, number>)[p.name];
      if (!glyph) continue;
      live.push({
        ...base,
        op: 'icon',
        glyph,
        size: Math.min(f.w, f.h),
        color: p.color,
        font: 'system',
        bold: false,
        align: 'center',
        glow: p.glowColor,
        glowR: p.glowRadius,
      });
    }
  }

  const animatedMedia = media.length > 0;
  const animatedText = live.some((l) => !!l.anim && l.anim !== 'none');

  return {
    w: size.w,
    h: size.h,
    radius: doc.radius,
    base: 'base.png',
    live,
    media,
    animated: animatedMedia || animatedText,
  };
}

/**
 * Работа с цветом. Формат хранения: #RRGGBB или #RRGGBBAA.
 */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Hsva {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
  a: number; // 0..1
}

const to2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');

/** Парсит #rgb / #rrggbb / #rrggbbaa. Невалидный ввод → null. */
export function hexToRgba(hex: string): Rgba | null {
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) h += 'ff';
  if (!/^[0-9a-fA-F]{8}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  };
}

/** Собирает hex; альфа ff опускается. */
export function rgbaToHex({ r, g, b, a }: Rgba): string {
  const base = `#${to2(r)}${to2(g)}${to2(b)}`;
  const alpha = clamp01(a);
  return alpha >= 0.999 ? base : `${base}${to2(alpha * 255)}`;
}

/** Возвращает тот же цвет с заменённым альфа-каналом. */
export function withAlpha(hex: string, alpha: number): string {
  const c = hexToRgba(hex) ?? { r: 255, g: 255, b: 255, a: 1 };
  return rgbaToHex({ ...c, a: clamp01(alpha) });
}

/** Только альфа цвета (0..1); для невалидного ввода — 1. */
export function alphaOf(hex: string): number {
  return hexToRgba(hex)?.a ?? 1;
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0, gp = 0, bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
}

export function hexToHsva(hex: string): Hsva {
  const c = hexToRgba(hex) ?? { r: 255, g: 255, b: 255, a: 1 };
  return { ...rgbToHsv(c.r, c.g, c.b), a: c.a };
}

export function hsvaToHex({ h, s, v, a }: Hsva): string {
  const { r, g, b } = hsvToRgb(((h % 360) + 360) % 360, clamp01(s), clamp01(v));
  return rgbaToHex({ r, g, b, a: clamp01(a) });
}

/** Относительная яркость — чтобы решать, ставить ли светлый текст поверх цвета. */
export function luminance(hex: string): number {
  const c = hexToRgba(hex);
  if (!c) return 0;
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** Набор быстрых свотчей для пикера. */
export const SWATCHES = [
  '#EDF3FA', '#97A3B6', '#5B6678', '#06070B',
  '#35E0FF', '#2D9CDB', '#7C6CFF', '#FF4DE3',
  '#FF5C6C', '#FF8A4D', '#FFC24D', '#F6FF6E',
  '#3DFFA2', '#2DE08A', '#35E0FF80', '#FF4DE380',
  '#FFFFFF00', '#06070BCC', '#141926E6', '#1C2333',
];

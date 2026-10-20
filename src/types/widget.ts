/**
 * Nitron WidgetStudio — модель данных виджета.
 * Цвета везде хранятся как hex: #RRGGBB или #RRGGBBAA (альфа-канал).
 * React Native нативно понимает 8-значный hex.
 */

export type WidgetSizeKind = 'small' | 'medium' | 'large';

export type LayerType =
  | 'text'
  | 'image'
  | 'gif'
  | 'video'
  | 'shape'
  | 'clock'
  | 'date'
  | 'battery'
  | 'progress'
  | 'countdown'
  | 'icon';

export type ShapeKind = 'rect' | 'pill' | 'circle' | 'ring' | 'triangle' | 'star' | 'line';
export type AnimKind = 'none' | 'pulse' | 'glow' | 'float' | 'spin' | 'slide' | 'blink';
export type FitKind = 'cover' | 'contain' | 'fill';
export type FontKey = 'system' | 'mono' | 'serif' | 'rounded' | 'condensed' | 'light';
export type AlignKind = 'left' | 'center' | 'right';

export interface GradientSpec {
  colors: string[];
  /** угол в градусах: 0 = слева направо, 90 = сверху вниз */
  angle: number;
}

export interface FillSpec {
  kind: 'color' | 'gradient';
  color: string;
  gradient: GradientSpec;
}

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  /** 0..1 — альфа-канал всего слоя */
  opacity: number;
  frame: Frame;
  /** градусы по часовой */
  rotation: number;
  anim: AnimKind;
  /** 0.25..3 — множитель скорости анимации */
  animSpeed: number;
}

export interface TextProps {
  text: string;
  color: string;
  fontSize: number;
  fontKey: FontKey;
  bold: boolean;
  align: AlignKind;
  letterSpacing: number;
  uppercase: boolean;
  glowColor: string;
  glowRadius: number;
}

export interface MediaProps {
  uri: string;
  fit: FitKind;
  radius: number;
  borderWidth: number;
  borderColor: string;
}

export interface GifProps extends MediaProps {
  autoplay: boolean;
}

export interface VideoProps extends MediaProps {
  muted: boolean;
  loop: boolean;
  playing: boolean;
}

export interface ShapeProps {
  shape: ShapeKind;
  fill: FillSpec;
  strokeWidth: number;
  strokeColor: string;
  glowColor: string;
  glowRadius: number;
}

export interface ClockProps {
  format24: boolean;
  showSeconds: boolean;
  color: string;
  fontSize: number;
  fontKey: FontKey;
  bold: boolean;
  align: AlignKind;
  glowColor: string;
  glowRadius: number;
}

export interface DateProps {
  pattern: string;
  color: string;
  fontSize: number;
  fontKey: FontKey;
  bold: boolean;
  align: AlignKind;
  uppercase: boolean;
}

export interface BatteryProps {
  style: 'ring' | 'bar' | 'text';
  color: string;
  trackColor: string;
  fontSize: number;
  fontKey: FontKey;
  showPercent: boolean;
}

export interface ProgressProps {
  /** 0..1 */
  value: number;
  color: string;
  colorEnd: string;
  useGradient: boolean;
  trackColor: string;
  angle: number;
}

export interface CountdownProps {
  targetISO: string;
  label: string;
  color: string;
  accentColor: string;
  fontSize: number;
  fontKey: FontKey;
}

export interface IconProps {
  /** имя иконки из Ionicons */
  name: string;
  color: string;
  glowColor: string;
  glowRadius: number;
}

export type Layer = BaseLayer &
  (
    | { type: 'text'; props: TextProps }
    | { type: 'image'; props: MediaProps }
    | { type: 'gif'; props: GifProps }
    | { type: 'video'; props: VideoProps }
    | { type: 'shape'; props: ShapeProps }
    | { type: 'clock'; props: ClockProps }
    | { type: 'date'; props: DateProps }
    | { type: 'battery'; props: BatteryProps }
    | { type: 'progress'; props: ProgressProps }
    | { type: 'countdown'; props: CountdownProps }
    | { type: 'icon'; props: IconProps }
  );

export type BackgroundSpec =
  | { kind: 'transparent' }
  | { kind: 'color'; color: string }
  | { kind: 'gradient'; gradient: GradientSpec }
  | { kind: 'image'; uri: string; fit: FitKind; dim: number };

export interface WidgetDoc {
  id: string;
  name: string;
  size: WidgetSizeKind;
  /** радиус скругления всего виджета */
  radius: number;
  background: BackgroundSpec;
  /** слои снизу вверх */
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
}

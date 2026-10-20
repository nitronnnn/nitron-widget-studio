import React, { useEffect, useId, useState } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useBatteryLevel } from 'expo-battery';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Polygon, Rect, Stop } from 'react-native-svg';
import type {
  BatteryProps,
  ClockProps,
  CountdownProps,
  DateProps,
  FillSpec,
  GifProps,
  IconProps,
  Layer,
  MediaProps,
  ProgressProps,
  ShapeProps,
  TextProps,
  VideoProps,
} from '@/types/widget';
import { colors, fontFor } from '@/theme';
import { countdownParts, formatPattern } from '@/utils/time';
import { angleToPoints } from './gradientMath';

type Scaled = { scale: number };

/** Тикающие часы/таймеры. */
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function Placeholder({ icon, scale }: { icon: string; scale: number }) {
  return (
    <View style={[styles.fill, styles.placeholder, { borderRadius: 10 * scale }]}>
      <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={24 * scale} color={colors.textFaint} />
    </View>
  );
}

function glowStyle(color: string, radius: number, scale: number): TextStyle {
  if (radius <= 0) return {};
  return { textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: radius * scale };
}

// ─── Текст ───────────────────────────────────────────────────────────────────

function TextLayer({ props: p, scale }: { props: TextProps } & Scaled) {
  return (
    <View style={[styles.fill, styles.centerV, alignOf(p.align)]}>
      <Text
        numberOfLines={3}
        style={{
          color: p.color,
          fontSize: p.fontSize * scale,
          fontFamily: fontFor(p.fontKey),
          fontWeight: p.bold ? '700' : '400',
          textAlign: p.align,
          letterSpacing: p.letterSpacing * scale,
          lineHeight: p.fontSize * scale * 1.15,
          ...glowStyle(p.glowColor, p.glowRadius, scale),
        }}
      >
        {p.uppercase ? p.text.toUpperCase() : p.text}
      </Text>
    </View>
  );
}

function alignOf(align: 'left' | 'center' | 'right') {
  return align === 'left' ? styles.aiStart : align === 'right' ? styles.aiEnd : styles.aiCenter;
}

// ─── Медиа ───────────────────────────────────────────────────────────────────

function ImageLayer({ props: p, scale }: { props: MediaProps } & Scaled) {
  if (!p.uri) return <Placeholder icon="image" scale={scale} />;
  return (
    <View
      style={[
        styles.fill,
        {
          borderRadius: p.radius * scale,
          overflow: 'hidden',
          borderWidth: p.borderWidth * scale,
          borderColor: p.borderColor,
        },
      ]}
    >
      <Image source={{ uri: p.uri }} style={styles.fill} contentFit={p.fit} transition={0} cachePolicy="memory-disk" />
    </View>
  );
}

function GifLayer({ props: p, scale }: { props: GifProps } & Scaled) {
  if (!p.uri) return <Placeholder icon="film" scale={scale} />;
  return (
    <View
      style={[
        styles.fill,
        {
          borderRadius: p.radius * scale,
          overflow: 'hidden',
          borderWidth: p.borderWidth * scale,
          borderColor: p.borderColor,
        },
      ]}
    >
      <Image
        source={{ uri: p.uri }}
        style={styles.fill}
        contentFit={p.fit}
        transition={0}
        autoplay={p.autoplay}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

function VideoLayer({ props: p, scale }: { props: VideoProps } & Scaled) {
  const player = useVideoPlayer(p.uri || null, (pl) => {
    pl.loop = p.loop;
    pl.muted = p.muted;
    if (p.playing) pl.play();
  });

  useEffect(() => {
    /* eslint-disable react-hooks/immutability -- expo-video плеер управляется мутациями по дизайну API */
    player.loop = p.loop;
    player.muted = p.muted;
    if (p.playing) player.play();
    else player.pause();
    /* eslint-enable react-hooks/immutability */
  }, [player, p.loop, p.muted, p.playing]);

  if (!p.uri) return <Placeholder icon="videocam" scale={scale} />;
  return (
    <View
      style={[
        styles.fill,
        {
          borderRadius: p.radius * scale,
          overflow: 'hidden',
          borderWidth: p.borderWidth * scale,
          borderColor: p.borderColor,
          backgroundColor: '#000',
        },
      ]}
    >
      <VideoView
        player={player}
        style={styles.fill}
        contentFit={p.fit}
        nativeControls={false}
        surfaceType="textureView"
      />
    </View>
  );
}

// ─── Фигуры (SVG) ────────────────────────────────────────────────────────────

function starPoints(cx: number, cy: number, outer: number, inner: number, spikes = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

function ShapeFill({ fill, id }: { fill: FillSpec; id: string }) {
  if (fill.kind !== 'gradient') return null;
  const { start, end } = angleToPoints(fill.gradient.angle);
  return (
    <Defs>
      <SvgGradient id={id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
        {fill.gradient.colors.map((c, i) => (
          <Stop key={i} offset={fill.gradient.colors.length > 1 ? i / (fill.gradient.colors.length - 1) : 0} stopColor={c} />
        ))}
      </SvgGradient>
    </Defs>
  );
}

function ShapeLayer({ layer, scale }: { layer: Extract<Layer, { type: 'shape' }> } & Scaled) {
  const p: ShapeProps = layer.props;
  const raw = useId();
  const gid = `g${raw.replace(/[^a-zA-Z0-9]/g, '')}${layer.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const minSide = Math.max(1, Math.min(layer.frame.w, layer.frame.h));
  const sw = (p.strokeWidth / minSide) * 100;
  const fill = p.fill.kind === 'gradient' ? `url(#${gid})` : p.fill.color;
  const stroke = p.strokeWidth > 0 ? p.strokeColor : 'transparent';
  const glow =
    p.glowRadius > 0
      ? { shadowColor: p.glowColor, shadowOpacity: 0.9, shadowRadius: p.glowRadius * scale, shadowOffset: { width: 0, height: 0 }, elevation: 6 }
      : {};

  const common = { fill, stroke, strokeWidth: sw } as const;

  return (
    <View style={[styles.fill, glow]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ShapeFill fill={p.fill} id={gid} />
        {p.shape === 'rect' && <Rect x={sw / 2} y={sw / 2} width={100 - sw} height={100 - sw} rx={6} {...common} />}
        {p.shape === 'pill' && <Rect x={sw / 2} y={sw / 2} width={100 - sw} height={100 - sw} rx={50} {...common} />}
        {p.shape === 'circle' && <Circle cx={50} cy={50} r={50 - sw / 2} {...common} />}
        {p.shape === 'ring' && <Circle cx={50} cy={50} r={50 - Math.max(sw, 4) / 2} fill="none" stroke={p.strokeWidth > 0 ? p.strokeColor : p.fill.color} strokeWidth={Math.max(sw, 4)} />}
        {p.shape === 'triangle' && <Polygon points={`50,${3 + sw} ${97 - sw},${97 - sw / 2} ${3 + sw},${97 - sw / 2}`} {...common} />}
        {p.shape === 'star' && <Polygon points={starPoints(50, 50, 48 - sw, 20)} {...common} />}
        {p.shape === 'line' && (
          <Rect x={0} y={50 - Math.max(sw, 2) / 2} width={100} height={Math.max(sw, 2)} rx={Math.max(sw, 2) / 2} fill={p.fill.kind === 'gradient' ? `url(#${gid})` : p.fill.color} />
        )}
      </Svg>
    </View>
  );
}

// ─── Живые данные ────────────────────────────────────────────────────────────

function ClockLayer({ props: p, scale }: { props: ClockProps } & Scaled) {
  const now = useNow(p.showSeconds ? 1000 : 15000);
  const pattern = p.format24
    ? p.showSeconds ? 'HH:mm:ss' : 'HH:mm'
    : p.showSeconds ? 'hh:mm:ss A' : 'hh:mm A';
  return (
    <View style={[styles.fill, styles.centerV, alignOf(p.align)]}>
      <Text
        style={{
          color: p.color,
          fontSize: p.fontSize * scale,
          fontFamily: fontFor(p.fontKey),
          fontWeight: p.bold ? '700' : '400',
          textAlign: p.align,
          includeFontPadding: false,
          ...glowStyle(p.glowColor, p.glowRadius, scale),
        }}
      >
        {formatPattern(new Date(now), pattern)}
      </Text>
    </View>
  );
}

function DateLayer({ props: p, scale }: { props: DateProps } & Scaled) {
  const now = useNow(30000);
  const text = formatPattern(new Date(now), p.pattern);
  return (
    <View style={[styles.fill, styles.centerV, alignOf(p.align)]}>
      <Text
        style={{
          color: p.color,
          fontSize: p.fontSize * scale,
          fontFamily: fontFor(p.fontKey),
          fontWeight: p.bold ? '700' : '400',
          textAlign: p.align,
          letterSpacing: 0.5 * scale,
        }}
      >
        {p.uppercase ? text.toUpperCase() : text}
      </Text>
    </View>
  );
}

function BatteryLayer({ props: p, layer, scale }: { props: BatteryProps; layer: Extract<Layer, { type: 'battery' }> } & Scaled) {
  const raw = useBatteryLevel();
  const level = raw >= 0 ? Math.min(1, raw) : 0.75;
  const pct = Math.round(level * 100);

  if (p.style === 'text') {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={{ color: p.color, fontSize: p.fontSize * scale, fontFamily: fontFor(p.fontKey), fontWeight: '700' }}>
          {pct}%
        </Text>
      </View>
    );
  }

  if (p.style === 'bar') {
    return (
      <View style={[styles.fill, styles.centerV]}>
        {p.showPercent && (
          <Text style={{ color: p.color, fontSize: p.fontSize * scale, fontFamily: fontFor(p.fontKey), fontWeight: '700', marginBottom: 6 * scale }}>
            {pct}%
          </Text>
        )}
        <View style={{ width: '100%', height: Math.max(6 * scale, layer.frame.h * scale * 0.18), borderRadius: 99, backgroundColor: p.trackColor, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: p.color, borderRadius: 99 }} />
        </View>
      </View>
    );
  }

  // ring
  const C = 2 * Math.PI * 40;
  return (
    <View style={styles.fill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={40} stroke={p.trackColor} strokeWidth={9} fill="none" />
        <Circle
          cx={50}
          cy={50}
          r={40}
          stroke={p.color}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={C * (1 - level)}
          rotation={-90}
          origin="50,50"
        />
      </Svg>
      {p.showPercent && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={{ color: p.color, fontSize: p.fontSize * scale, fontFamily: fontFor(p.fontKey), fontWeight: '700' }}>
            {pct}%
          </Text>
        </View>
      )}
    </View>
  );
}

function ProgressLayer({ props: p, layer, scale }: { props: ProgressProps; layer: Extract<Layer, { type: 'progress' }> } & Scaled) {
  const r = (layer.frame.h * scale) / 2;
  const pct = `${Math.round(Math.min(1, Math.max(0, p.value)) * 100)}%` as const;
  const { start, end } = angleToPoints(p.angle);
  return (
    <View style={[styles.fill, { borderRadius: r, backgroundColor: p.trackColor, overflow: 'hidden' }]}>
      {p.useGradient ? (
        <LinearGradient colors={[p.color, p.colorEnd]} start={start} end={end} style={{ width: pct, height: '100%' }} />
      ) : (
        <View style={{ width: pct, height: '100%', backgroundColor: p.color }} />
      )}
    </View>
  );
}

function CountdownLayer({ props: p, scale }: { props: CountdownProps } & Scaled) {
  const now = useNow(1000);
  const parts = countdownParts(p.targetISO, now);
  const cells: [number, string][] = [
    [parts.days, 'дн'],
    [parts.hours, 'час'],
    [parts.mins, 'мин'],
    [parts.secs, 'сек'],
  ];
  return (
    <View style={[styles.fill, styles.centerV]}>
      {!!p.label && (
        <Text
          style={{
            color: p.accentColor,
            fontSize: p.fontSize * 0.3 * scale,
            fontFamily: fontFor(p.fontKey),
            letterSpacing: 3 * scale,
            textAlign: 'center',
            marginBottom: 6 * scale,
          }}
        >
          {p.label.toUpperCase()}
        </Text>
      )}
      <View style={styles.countRow}>
        {cells.map(([v, label]) => (
          <View key={label} style={styles.center}>
            <Text
              style={{
                color: parts.done ? colors.textFaint : p.color,
                fontSize: p.fontSize * scale,
                fontFamily: fontFor(p.fontKey),
                fontWeight: '700',
                fontVariant: ['tabular-nums'],
              }}
            >
              {String(v).padStart(2, '0')}
            </Text>
            <Text
              style={{
                color: p.accentColor,
                fontSize: Math.max(8, p.fontSize * 0.28) * scale,
                fontFamily: fontFor(p.fontKey),
                letterSpacing: 2 * scale,
                marginTop: 2 * scale,
              }}
            >
              {label.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function IconLayer({ props: p, layer, scale }: { props: IconProps; layer: Extract<Layer, { type: 'icon' }> } & Scaled) {
  const size = Math.min(layer.frame.w, layer.frame.h) * scale * 0.92;
  return (
    <View style={[styles.fill, styles.center]}>
      <Ionicons
        name={p.name as React.ComponentProps<typeof Ionicons>['name']}
        size={size}
        color={p.color}
        style={glowStyle(p.glowColor, p.glowRadius, scale)}
      />
    </View>
  );
}

// ─── Диспетчер ───────────────────────────────────────────────────────────────

export function LayerView({ layer, scale }: { layer: Layer; scale: number }) {
  switch (layer.type) {
    case 'text':
      return <TextLayer props={layer.props} scale={scale} />;
    case 'image':
      return <ImageLayer props={layer.props} scale={scale} />;
    case 'gif':
      return <GifLayer props={layer.props} scale={scale} />;
    case 'video':
      return <VideoLayer props={layer.props} scale={scale} />;
    case 'shape':
      return <ShapeLayer layer={layer} scale={scale} />;
    case 'clock':
      return <ClockLayer props={layer.props} scale={scale} />;
    case 'date':
      return <DateLayer props={layer.props} scale={scale} />;
    case 'battery':
      return <BatteryLayer props={layer.props} layer={layer} scale={scale} />;
    case 'progress':
      return <ProgressLayer props={layer.props} layer={layer} scale={scale} />;
    case 'countdown':
      return <CountdownLayer props={layer.props} scale={scale} />;
    case 'icon':
      return <IconLayer props={layer.props} layer={layer} scale={scale} />;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerV: { justifyContent: 'center' },
  aiStart: { alignItems: 'flex-start' },
  aiCenter: { alignItems: 'center' },
  aiEnd: { alignItems: 'flex-end' },
  countRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});

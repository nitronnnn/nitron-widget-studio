/**
 * Угол градиента (0 = →, 90 = ↓, градусы по часовой) в точки start/end
 * для expo-linear-gradient и координаты для SVG.
 */
export function angleToPoints(angle: number): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  const rad = ((angle % 360) * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return {
    start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 },
    end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 },
  };
}

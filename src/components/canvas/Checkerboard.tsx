import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { colors } from '@/theme';

interface Props {
  /** размер клетки в текущем масштабе холста */
  cell?: number;
}

/** Шахматная подложка — визуальная индикация прозрачности (альфа-канала). */
export function Checkerboard({ cell = 12 }: Props) {
  const raw = useId();
  const id = `chk${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const half = cell / 2;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id={id} patternUnits="userSpaceOnUse" width={cell} height={cell}>
          <Rect x={0} y={0} width={cell} height={cell} fill={colors.checkerA} />
          <Rect x={half} y={0} width={half} height={half} fill={colors.checkerB} />
          <Rect x={0} y={half} width={half} height={half} fill={colors.checkerB} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

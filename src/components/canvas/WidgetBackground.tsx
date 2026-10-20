import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { BackgroundSpec } from '@/types/widget';
import { angleToPoints } from '@/components/layers/gradientMath';

interface Props {
  background: BackgroundSpec;
  scale?: number;
}

/** Фон виджета: цвет / градиент / изображение. Прозрачный обрабатывает canvas. */
export function WidgetBackground({ background, scale = 1 }: Props) {
  switch (background.kind) {
    case 'transparent':
      return null;
    case 'color':
      return <View style={[StyleSheet.absoluteFill, { backgroundColor: background.color }]} />;
    case 'gradient': {
      const { start, end } = angleToPoints(background.gradient.angle);
      return (
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={background.gradient.colors as [string, string, ...string[]]}
          start={start}
          end={end}
        />
      );
    }
    case 'image':
      return (
        <>
          <Image
            source={{ uri: background.uri }}
            style={StyleSheet.absoluteFill}
            contentFit={background.fit}
            transition={0}
          />
          {background.dim > 0 && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: '#06070B', opacity: Math.min(1, Math.max(0, background.dim)) },
              ]}
            />
          )}
        </>
      );
  }
}

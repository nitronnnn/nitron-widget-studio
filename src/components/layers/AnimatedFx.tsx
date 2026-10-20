import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { AnimKind } from '@/types/widget';

interface Props {
  anim: AnimKind;
  /** 0.25..3 */
  speed: number;
  scale: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Циклические FX-анимации слоя: pulse / glow / float / spin / slide / blink. */
export function AnimatedFx({ anim, speed, scale, children, style }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (anim === 'none') {
      t.value = 0;
      return;
    }
    const base = 1500 / Math.max(0.25, speed);
    if (anim === 'spin') {
      t.value = 0;
      t.value = withRepeat(withTiming(1, { duration: 2400 / speed, easing: Easing.linear }), -1, false);
    } else if (anim === 'blink') {
      t.value = withRepeat(withTiming(1, { duration: 620 / speed, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      t.value = withRepeat(withTiming(1, { duration: base, easing: Easing.inOut(Easing.quad) }), -1, true);
    }
    return () => cancelAnimation(t);
  }, [anim, speed, t]);

  const animated = useAnimatedStyle((): ViewStyle => {
    const v = t.value;
    switch (anim) {
      case 'pulse':
        return { transform: [{ scale: 1 + v * 0.06 }] };
      case 'glow':
        return { opacity: 1 - v * 0.45 };
      case 'float':
        return { transform: [{ translateY: -6 * scale * v }] };
      case 'spin':
        return { transform: [{ rotate: `${v * 360}deg` }] };
      case 'slide':
        return { transform: [{ translateX: 8 * scale * v }] };
      case 'blink':
        return { opacity: 1 - v * 0.9 };
      default:
        return {};
    }
  }, [anim, scale]);

  return <Animated.View style={[{ flex: 1 }, style, animated]}>{children}</Animated.View>;
}

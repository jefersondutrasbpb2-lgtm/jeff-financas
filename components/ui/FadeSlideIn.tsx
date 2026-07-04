import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface FadeSlideInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: object;
}

export function FadeSlideIn({
  children,
  delay = 0,
  duration = 480,
  distance = 22,
  style,
}: FadeSlideInProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: ease }));
    translateY.value = withDelay(delay, withTiming(0, { duration, easing: ease }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
}

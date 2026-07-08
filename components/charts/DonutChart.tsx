import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface DonutSegment {
  pct: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  innerRadiusRatio?: number;
  gap?: number;
  selectedIndex?: number | null;
  onSegmentPress?: (index: number) => void;
}

function AnimatedSegment({
  cx, cy, radius, strokeWidth, segLength, circumference, rotationDeg, color, selected, onPress,
}: {
  cx: number; cy: number; radius: number; strokeWidth: number;
  segLength: number; circumference: number; rotationDeg: number;
  color: string; selected: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.12 : 1,
      useNativeDriver: Platform.OS !== 'web',
      friction: 6,
      tension: 120,
    }).start();
  }, [selected]);

  // On web, Animated.View wrapping SVG elements doesn't work well.
  // Use strokeWidth scaling instead.
  const boost = selected ? strokeWidth * 0.22 : 0;
  const effectiveStroke = strokeWidth + boost;
  const effectiveRadius = radius - boost / 2;
  const effectiveCircumference = 2 * Math.PI * effectiveRadius;
  const ratio = segLength / circumference;
  const effectiveSegLength = Math.max(ratio * effectiveCircumference - 0.3, 0);

  return (
    <G onPress={onPress}>
      <Circle
        cx={cx}
        cy={cy}
        r={effectiveRadius}
        stroke={color}
        strokeWidth={effectiveStroke}
        strokeDasharray={`${effectiveSegLength} ${effectiveCircumference}`}
        strokeLinecap="butt"
        fill="none"
        opacity={selected ? 1 : 0.85}
        transform={`rotate(${rotationDeg} ${cx} ${cy})`}
      />
      {/* Larger invisible hit area */}
      <Circle
        cx={cx}
        cy={cy}
        r={effectiveRadius}
        stroke="transparent"
        strokeWidth={effectiveStroke + 12}
        strokeDasharray={`${effectiveSegLength} ${effectiveCircumference}`}
        fill="none"
        transform={`rotate(${rotationDeg} ${cx} ${cy})`}
      />
    </G>
  );
}

export function DonutChart({
  segments,
  size = 96,
  innerRadiusRatio = 27 / 48,
  gap = 0.055,
  selectedIndex = null,
  onSegmentPress,
}: DonutChartProps) {
  const strokeWidth = (size / 2) * (1 - innerRadiusRatio);
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = -Math.PI / 2;
  const computed = segments.map((seg) => {
    const fraction = seg.pct / 100;
    const segLength = Math.max(fraction * circumference - gap * radius, 0);
    const rotationDeg = (cumulativeAngle * 180) / Math.PI;
    cumulativeAngle += fraction * 2 * Math.PI;
    return { segLength, rotationDeg, color: seg.color, fraction };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {computed.map((c, i) => (
          <AnimatedSegment
            key={i}
            cx={size / 2}
            cy={size / 2}
            radius={radius}
            strokeWidth={strokeWidth}
            segLength={c.segLength}
            circumference={circumference}
            rotationDeg={c.rotationDeg}
            color={c.color}
            selected={selectedIndex === i}
            onPress={() => onSegmentPress?.(i)}
          />
        ))}
      </Svg>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSegment {
  pct: number; // 0-100
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  innerRadiusRatio?: number;
  gap?: number; // radians
}

export function DonutChart({ segments, size = 96, innerRadiusRatio = 27 / 48, gap = 0.055 }: DonutChartProps) {
  const strokeWidth = (size / 2) * (1 - innerRadiusRatio);
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = -Math.PI / 2; // start at top

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const fraction = seg.pct / 100;
          const segLength = Math.max(fraction * circumference - gap * radius, 0);
          const rotationDeg = (cumulativeAngle * 180) / Math.PI;
          cumulativeAngle += fraction * 2 * Math.PI;

          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segLength} ${circumference}`}
              strokeLinecap="butt"
              fill="none"
              transform={`rotate(${rotationDeg} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
    </View>
  );
}

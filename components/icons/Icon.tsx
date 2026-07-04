import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'receipt'
  | 'tag'
  | 'chartPulse'
  | 'bell'
  | 'gear'
  | 'plus'
  | 'search'
  | 'filter'
  | 'eye'
  | 'eyeOff'
  | 'arrowUp'
  | 'arrowDown'
  | 'close'
  | 'chevronLeft'
  | 'chevronRight'
  | 'trendUp'
  | 'clockCircle'
  | 'spark'
  | 'info'
  | 'logo'
  | 'wallet'
  | 'utensils'
  | 'car'
  | 'film'
  | 'devicePhone'
  | 'heartPulse'
  | 'bag'
  | 'briefcase'
  | 'laptop'
  | 'sparkles'
  | 'boltBadge'
  | 'lightbulb'
  | 'trash'
  | 'pencil'
  | 'check'
  | 'paperPlane'
  | 'copy'
  | 'logout'
  | 'trash'
  | 'image'
  | 'upload';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Hand-drawn icon set in a consistent rounded-geometric style (duotone-leaning
 * line icons), used in place of a generic stock icon font for a more
 * deliberate, premium feel across the app.
 */
export function Icon({ name, size = 20, color = '#e8e8ff', strokeWidth = 1.8 }: IconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 11.5 12 4l8 7.5" {...common} />
          <Path d="M6 10v8.5a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V10" {...common} />
        </Svg>
      );

    case 'receipt':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M6 3.5h12a.5.5 0 0 1 .5.5v16.2c0 .4-.45.65-.78.43l-1.7-1.13a.7.7 0 0 0-.78 0l-1.46.97a.7.7 0 0 1-.78 0l-1.46-.97a.7.7 0 0 0-.78 0l-1.46.97a.7.7 0 0 1-.78 0l-1.46-.97a.7.7 0 0 0-.78 0l-1.7 1.13c-.33.22-.78-.03-.78-.43V4a.5.5 0 0 1 .5-.5Z"
            {...common}
          />
          <Path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" {...common} />
        </Svg>
      );

    case 'tag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M11.6 3.6 19 4l.4 7.4a1.6 1.6 0 0 1-.47 1.2l-7.5 7.5a1.6 1.6 0 0 1-2.26 0l-5.3-5.3a1.6 1.6 0 0 1 0-2.27l7.5-7.5a1.6 1.6 0 0 1 .22-.43Z"
            {...common}
          />
          <Circle cx={14.7} cy={9.3} r={1.4} fill={color} stroke="none" />
        </Svg>
      );

    case 'chartPulse':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 18 8 8l3.2 5.5L14 9l2 4.5L21 6" {...common} />
          <Circle cx={21} cy={6} r={1.3} fill={color} stroke="none" />
        </Svg>
      );

    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M18 8.5a6 6 0 0 0-12 0c0 6.2-3 8.5-3 8.5h18s-3-2.3-3-8.5" {...common} />
          <Path d="M13.7 21a2 2 0 0 1-3.4 0" {...common} />
        </Svg>
      );

    case 'gear':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={3} {...common} />
          <Path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            {...common}
          />
        </Svg>
      );

    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth + 0.4} strokeLinecap="round" />
        </Svg>
      );

    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={10.5} cy={10.5} r={6.5} {...common} />
          <Path d="M19.5 19.5 15.6 15.6" {...common} />
        </Svg>
      );

    case 'filter':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 6h16M7.5 12h9M10.5 18h3" {...common} />
          <Circle cx={7.5} cy={6} r={1.6} fill="white" stroke={color} strokeWidth={strokeWidth} />
          <Circle cx={16.5} cy={12} r={1.6} fill="white" stroke={color} strokeWidth={strokeWidth} />
          <Circle cx={12} cy={18} r={1.6} fill="white" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );

    case 'eye':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z" {...common} />
          <Circle cx={12} cy={12} r={3} {...common} />
        </Svg>
      );

    case 'eyeOff':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M1.5 12S5 5.5 12 5.5c1.6 0 3 .33 4.2.87M22.5 12S19 18.5 12 18.5c-1.6 0-3-.33-4.2-.87" {...common} />
          <Path d="M9.7 9.8a3 3 0 0 0 4.2 4.2" {...common} />
          <Path d="M3 3l18 18" {...common} />
        </Svg>
      );

    case 'arrowUp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 19V5M6 11l6-6 6 6" {...common} />
        </Svg>
      );

    case 'arrowDown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14M6 13l6 6 6-6" {...common} />
        </Svg>
      );

    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 6l12 12M18 6 6 18" {...common} />
        </Svg>
      );

    case 'chevronLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M15 5 8 12l7 7" {...common} />
        </Svg>
      );

    case 'chevronRight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 5l7 7-7 7" {...common} />
        </Svg>
      );

    case 'trendUp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 17 9.5 10.5l4 4L21 6.5" {...common} />
          <Path d="M15.5 6.5H21V12" {...common} />
        </Svg>
      );

    case 'clockCircle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7.5V12l3.2 1.9" {...common} />
        </Svg>
      );

    case 'spark':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 3.2 13.6 9l5.4 1.6-5.4 1.6L12 18l-1.6-5.8L5 10.6 10.4 9 12 3.2Z"
            {...common}
            fill={`${color}22`}
          />
        </Svg>
      );

    case 'info':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 11v5.2" {...common} />
          <Circle cx={12} cy={8} r={0.9} fill={color} stroke="none" />
        </Svg>
      );

    case 'wallet':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3} y={6.5} width={18} height={12} rx={2.6} {...common} />
          <Path d="M3 10.5h18" {...common} />
          <Circle cx={16.5} cy={14.5} r={1.3} fill={color} stroke="none" />
        </Svg>
      );

    case 'logo':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 3 4 7v6c0 4 3.4 6.8 8 8 4.6-1.2 8-4 8-8V7l-8-4Z"
            fill={`${color}22`}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke={color} strokeWidth={strokeWidth + 0.3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'utensils':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M7 3v7.2a2 2 0 0 1-2 2H4.5V3M7 3v18M5.5 3v6.5" {...common} />
          <Path d="M11.5 3v8.5a2.2 2.2 0 0 0 2.2 2.2h0V3" {...common} />
          <Path d="M13.7 13.7V21" {...common} />
        </Svg>
      );

    case 'car':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M4.5 16V12l1.7-4.6a2 2 0 0 1 1.9-1.3h7.8a2 2 0 0 1 1.9 1.3L19.5 12v4"
            {...common}
          />
          <Path d="M3.5 16h17v2.5a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1V17H6.9v1.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V16Z" {...common} />
          <Circle cx={7.5} cy={13.3} r={1.1} fill={color} stroke="none" />
          <Circle cx={16.5} cy={13.3} r={1.1} fill={color} stroke="none" />
        </Svg>
      );

    case 'film':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3} y={5} width={18} height={14} rx={2.4} {...common} />
          <Path d="M9 5v14M15 5v14M3 9.5h3M18 9.5h3M3 14.5h3M18 14.5h3" {...common} />
        </Svg>
      );

    case 'devicePhone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={6.2} y={2.5} width={11.6} height={19} rx={3} {...common} />
          <Path d="M10.3 5.3h3.4" {...common} />
          <Circle cx={12} cy={18.2} r={1.1} fill={color} stroke="none" />
        </Svg>
      );

    case 'heartPulse':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 19.5 5 13.2a4.6 4.6 0 0 1-1.4-3.3A4.4 4.4 0 0 1 8 5.5a5 5 0 0 1 4 2 5 5 0 0 1 4-2 4.4 4.4 0 0 1 4.4 4.4c0 1.3-.5 2.4-1.4 3.3L12 19.5Z"
            {...common}
          />
          <Path d="M6.5 11.2h2.3l1.4-2.4 1.7 4.2 1.2-1.8h2.6" {...common} />
        </Svg>
      );

    case 'bag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M8 8V6.2a4 4 0 0 1 8 0V8" {...common} />
          <Path d="M5.6 8h12.8l.9 11a2 2 0 0 1-2 2.2H6.7a2 2 0 0 1-2-2.2l.9-11Z" {...common} />
        </Svg>
      );

    case 'briefcase':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3} y={7.5} width={18} height={12} rx={2.4} {...common} />
          <Path d="M8.2 7.5V6a2.2 2.2 0 0 1 2.2-2.2h3.2A2.2 2.2 0 0 1 15.8 6v1.5" {...common} />
          <Path d="M3 13h18M10.6 13v1.4h2.8V13" {...common} />
        </Svg>
      );

    case 'laptop':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={5} y={4.5} width={14} height={9.5} rx={1.6} {...common} />
          <Path d="M2.5 18.5h19l-1.6-2.7H4.1L2.5 18.5Z" {...common} />
        </Svg>
      );

    case 'sparkles':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M11 4 12.3 8.7 17 10l-4.7 1.3L11 16l-1.3-4.7L5 10l4.7-1.3L11 4Z" {...common} fill={`${color}22`} />
          <Path d="M18 13.5 18.7 16l2.5.7-2.5.7-.7 2.5-.7-2.5-2.5-.7 2.5-.7.7-2.5Z" {...common} fill={`${color}22`} />
        </Svg>
      );

    case 'boltBadge':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={9.2} {...common} />
          <Path d="M13 7.2 9 13h3l-1 4.4 5-6.8h-3.2L13 7.2Z" fill={color} stroke="none" />
        </Svg>
      );

    case 'lightbulb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 18.5h6M9.5 21h5" {...common} />
          <Path
            d="M12 3a6.3 6.3 0 0 0-3.6 11.4c.5.36.8.95.8 1.6v.5h5.6v-.5c0-.65.3-1.24.8-1.6A6.3 6.3 0 0 0 12 3Z"
            {...common}
          />
        </Svg>
      );

    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4.5 7h15M9.5 7V5.2a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2V7" {...common} />
          <Path d="M6.5 7l.8 12.2a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5L17.5 7" {...common} />
          <Path d="M10 11v6M14 11v6" {...common} />
        </Svg>
      );

    case 'pencil':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 20l.9-3.9 11-11a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5l-11 11L4 20Z" {...common} />
          <Path d="M14.5 6.1l3.4 3.4" {...common} />
        </Svg>
      );

    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 12.5 9.5 17 19 6.5" stroke={color} strokeWidth={strokeWidth + 0.3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'paperPlane':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M21 3 11 13M21 3 14.5 21l-3.5-8L3 9.5 21 3Z" {...common} />
        </Svg>
      );

    case 'copy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={8.5} y={8.5} width={11.5} height={11.5} rx={2.2} {...common} />
          <Path d="M5.5 15.5h-1a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...common} />
        </Svg>
      );

    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...common} />
          <Path d="M16 17l5-5-5-5" {...common} />
          <Path d="M21 12H9" {...common} />
        </Svg>
      );

    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 6h18" {...common} />
          <Path d="M8 6V4h8v2" {...common} />
          <Path d="M19 6l-1 14H6L5 6" {...common} />
          <Path d="M10 11v6" {...common} />
          <Path d="M14 11v6" {...common} />
        </Svg>
      );

    case 'image':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x="3" y="3" width="18" height="18" rx="3" {...common} />
          <Circle cx="8.5" cy="8.5" r="1.5" {...common} />
          <Path d="M21 15l-5-5L5 21" {...common} />
        </Svg>
      );

    case 'upload':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...common} />
          <Path d="M17 8l-5-5-5 5" {...common} />
          <Path d="M12 3v12" {...common} />
        </Svg>
      );

    default:
      return null;
  }
}

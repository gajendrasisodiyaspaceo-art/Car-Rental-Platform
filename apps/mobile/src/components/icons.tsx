import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { colors } from '../theme/tokens';

// Side-profile car silhouette — used as image fallback in CarCard.
interface CarSilhouetteProps {
  width?: number;
  height?: number;
  color?: string;
}

export function CarSilhouette({
  width = 120,
  height = 60,
  color = colors.muted,
}: CarSilhouetteProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 100">
      {/* Body */}
      <Path
        d="M20 65 L30 65 Q32 55 40 50 L70 35 Q80 28 95 28 L140 28 Q155 28 165 38 L178 55 Q185 58 188 65 L20 65 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Roof */}
      <Path
        d="M72 50 L82 38 Q90 30 100 30 L138 30 Q148 30 155 38 L165 50 Z"
        fill={color}
        opacity={0.5}
      />
      {/* Rear wheel */}
      <Circle cx={55} cy={68} r={14} fill={color} opacity={0.9} />
      <Circle cx={55} cy={68} r={7} fill={colors.surface} />
      {/* Front wheel */}
      <Circle cx={158} cy={68} r={14} fill={color} opacity={0.9} />
      <Circle cx={158} cy={68} r={7} fill={colors.surface} />
      {/* Undercarriage line */}
      <Path
        d="M20 65 L188 65"
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.4}
      />
    </Svg>
  );
}

export type IconName =
  | 'home'
  | 'map'
  | 'heart'
  | 'heart-filled'
  | 'profile'
  | 'search'
  | 'location'
  | 'grid'
  | 'speed'
  | 'fuel'
  | 'gear'
  | 'seat'
  | 'arrow-up-right'
  | 'back'
  | 'star'
  | 'three-sixty'
  | 'bell'
  | 'calendar'
  | 'swap';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Single SVG icon component. Stroke-based, 24x24 viewBox, clean simple paths.
export function Icon({ name, size = 24, color = colors.text, strokeWidth = 2 }: IconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  const svg = (children: React.ReactNode) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {children}
    </Svg>
  );

  switch (name) {
    case 'home':
      return svg(
        <Path d="M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5" {...common} />,
      );
    case 'map':
      return svg(
        <>
          <Path d="M9 3 3 5.5V21l6-2.5 6 2.5 6-2.5V3l-6 2.5L9 3Z" {...common} />
          <Line x1={9} y1={3} x2={9} y2={18.5} {...common} />
          <Line x1={15} y1={5.5} x2={15} y2={21} {...common} />
        </>,
      );
    case 'heart':
      return svg(
        <Path
          d="M12 20s-7-4.6-9.3-9.1C1.3 8.1 2.7 5 5.8 5 7.7 5 9 6.2 12 9c3-2.8 4.3-4 6.2-4 3.1 0 4.5 3.1 3.1 5.9C19 15.4 12 20 12 20Z"
          {...common}
        />,
      );
    case 'heart-filled':
      return svg(
        <Path
          d="M12 20s-7-4.6-9.3-9.1C1.3 8.1 2.7 5 5.8 5 7.7 5 9 6.2 12 9c3-2.8 4.3-4 6.2-4 3.1 0 4.5 3.1 3.1 5.9C19 15.4 12 20 12 20Z"
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />,
      );
    case 'profile':
      return svg(
        <>
          <Circle cx={12} cy={8} r={4} {...common} />
          <Path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" {...common} />
        </>,
      );
    case 'search':
      return svg(
        <>
          <Circle cx={11} cy={11} r={7} {...common} />
          <Line x1={16.5} y1={16.5} x2={21} y2={21} {...common} />
        </>,
      );
    case 'location':
      return svg(
        <>
          <Path d="M12 22c4-4.5 7-8 7-11a7 7 0 1 0-14 0c0 3 3 6.5 7 11Z" {...common} />
          <Circle cx={12} cy={11} r={2.5} {...common} />
        </>,
      );
    case 'grid':
      return svg(
        <>
          <Rect x={3} y={3} width={7} height={7} rx={2} {...common} />
          <Rect x={14} y={3} width={7} height={7} rx={2} {...common} />
          <Rect x={3} y={14} width={7} height={7} rx={2} {...common} />
          <Rect x={14} y={14} width={7} height={7} rx={2} {...common} />
        </>,
      );
    case 'speed':
      return svg(
        <>
          <Path d="M4 16a8 8 0 1 1 16 0" {...common} />
          <Line x1={12} y1={16} x2={15.5} y2={11.5} {...common} />
          <Circle cx={12} cy={16} r={1.4} fill={color} stroke={color} />
        </>,
      );
    case 'fuel':
      return svg(
        <>
          <Path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12" {...common} />
          <Line x1={8} y1={8} x2={12} y2={8} {...common} />
          <Path d="M15 8h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 1.5 1.5A1.5 1.5 0 0 0 23 16V9l-3-3" {...common} />
        </>,
      );
    case 'gear':
      return svg(
        <>
          <Circle cx={12} cy={12} r={3} {...common} />
          <Path
            d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
            {...common}
          />
        </>,
      );
    case 'seat':
      return svg(
        <Path d="M6 4v8a3 3 0 0 0 3 3h6M6 19h11M18 19V9a3 3 0 0 0-3-3" {...common} />,
      );
    case 'arrow-up-right':
      return svg(
        <>
          <Line x1={7} y1={17} x2={17} y2={7} {...common} />
          <Polyline points="8 7 17 7 17 16" {...common} />
        </>,
      );
    case 'back':
      return svg(
        <>
          <Line x1={20} y1={12} x2={5} y2={12} {...common} />
          <Polyline points="11 5 4 12 11 19" {...common} />
        </>,
      );
    case 'star':
      return svg(
        <Path
          d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"
          fill={color}
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />,
      );
    case 'three-sixty':
      return svg(
        <>
          <Path d="M3 12c0-2.8 4-5 9-5s9 2.2 9 5-4 5-9 5" {...common} />
          <Polyline points="13 19 9 17 13 15" {...common} />
        </>,
      );
    case 'bell':
      return svg(
        <Path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.5 21a2 2 0 0 0 3 0"
          {...common}
        />,
      );
    case 'calendar':
      return svg(
        <>
          <Rect x={3} y={4.5} width={18} height={17} rx={3} {...common} />
          <Line x1={3} y1={9.5} x2={21} y2={9.5} {...common} />
          <Line x1={8} y1={2.5} x2={8} y2={6.5} {...common} />
          <Line x1={16} y1={2.5} x2={16} y2={6.5} {...common} />
        </>,
      );
    case 'swap':
      return svg(
        <>
          <Polyline points="7 4 3 8 7 12" {...common} />
          <Line x1={3} y1={8} x2={20} y2={8} {...common} />
          <Polyline points="17 12 21 16 17 20" {...common} />
          <Line x1={21} y1={16} x2={4} y2={16} {...common} />
        </>,
      );
    default:
      return svg(<Circle cx={12} cy={12} r={9} {...common} />);
  }
}

export default Icon;

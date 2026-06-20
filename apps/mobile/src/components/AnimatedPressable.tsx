import { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  children?: React.ReactNode;
}

// Single animated Pressable node: the passed `style` (layout: flexDirection,
// align, dimensions, overflow) AND the press scale live on the SAME element, so
// children inherit the intended layout (no wrapper that breaks rows/sizing).
const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export default function AnimatedPressable({
  onPressIn,
  onPressOut,
  style,
  children,
  activeScale = 0.97,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <AnimatedPressableBase
      onPressIn={(e) => {
        Animated.spring(scale, {
          toValue: activeScale,
          friction: 9,
          tension: 50,
          useNativeDriver: true,
        }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }).start();
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}

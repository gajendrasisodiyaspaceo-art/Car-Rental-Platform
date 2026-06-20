import { useEffect, useRef } from 'react';
import {
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// Returns an Animated style that fades in (opacity 0→1) and slides up (translateY 12→0)
// on mount. Stagger multiple elements by passing a unique index.
export function useEntrance(index = 0): {
  opacity: Animated.AnimatedInterpolation<number>;
  transform: { translateY: Animated.AnimatedInterpolation<number> }[];
} {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 300,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return { opacity, transform: [{ translateY }] };
}

// Convenience wrapper — renders children inside an Animated.View with entrance animation.
interface EntranceProps {
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Entrance({ index = 0, style, children }: EntranceProps) {
  const entranceStyle = useEntrance(index);
  return (
    <Animated.View style={[entranceStyle, style]}>
      {children}
    </Animated.View>
  );
}

export default useEntrance;

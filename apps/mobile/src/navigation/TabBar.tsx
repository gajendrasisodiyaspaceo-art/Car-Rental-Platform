import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AnimatedPressable from '../components/AnimatedPressable';
import { Icon, type IconName } from '../components/icons';
import { colors, radius, shadow, spacing } from '../theme/tokens';

const TAB_ICONS: Record<string, IconName> = {
  HomeTab: 'home',
  MapTab: 'map',
  FavoritesTab: 'heart',
  ProfileTab: 'profile',
};

// Animates the lime active pill per-tab: scale 0.6->1, opacity 0->1 on focus.
function useActivePill(focused: boolean) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.6)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 9,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 0.6,
          friction: 10,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, scale, opacity]);

  return { scale, opacity };
}

// Floating dark tab bar with a lime active pill.
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const iconName = TAB_ICONS[route.name] ?? 'home';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              iconName={iconName}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabItemProps {
  focused: boolean;
  iconName: IconName;
  onPress: () => void;
}

function TabItem({ focused, iconName, onPress }: TabItemProps) {
  const { scale, opacity } = useActivePill(focused);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={styles.item}
      activeScale={0.93}
      hitSlop={6}
      accessibilityRole="button"
    >
      {/* Animated lime pill behind the icon */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          styles.pill,
          { opacity, transform: [{ scale }] },
        ]}
      />
      <Icon
        name={focused && iconName === 'heart' ? 'heart-filled' : iconName}
        size={22}
        color={focused ? colors.onAccent : colors.muted}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    ...shadow.raised,
  },
  item: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginHorizontal: spacing.xs,
  },
  pill: {
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});

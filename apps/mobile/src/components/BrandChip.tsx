import { StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '../theme/tokens';
import AnimatedPressable from './AnimatedPressable';
import type { IconName } from './icons';

interface BrandChipProps {
  // Primary prop used by new code — brand name shown as uppercase wordmark
  brand?: string;
  // Legacy alias — HomeScreen passes label; both are accepted
  label?: string;
  selected?: boolean;
  onPress: () => void;
  // icon is accepted for backward compat with HomeScreen but not rendered
  icon?: IconName;
}

// Horizontal wordmark pill: JAGUAR / VOLVO / NISSAN style.
// Selected = white pill with near-black bold text.
// Unselected = dark surface pill with muted text + subtle border.
export default function BrandChip({
  brand,
  label,
  selected = false,
  onPress,
}: BrandChipProps) {
  const wordmark = (brand ?? label ?? '').toUpperCase();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillSelected : styles.pillUnselected]}
      activeScale={0.95}
      accessibilityRole="button"
    >
      <Text
        style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}
        numberOfLines={1}
      >
        {wordmark}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  pillSelected: {
    backgroundColor: colors.white,
  },
  pillUnselected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: font.size.sm,
    fontFamily: font.bold,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  textSelected: {
    color: colors.onAccent,
  },
  textUnselected: {
    color: colors.muted,
  },
});

import { StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '../theme/tokens';
import AnimatedPressable from './AnimatedPressable';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

// Pill filter chip with a selected (lime) state.
export default function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      activeScale={0.95}
      accessibilityRole="button"
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontFamily: font.medium,
    fontWeight: '500',
  },
  labelSelected: { color: colors.onAccent },
});

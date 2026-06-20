import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius, spacing } from '../theme/tokens';
import { Icon, type IconName } from './icons';
import AnimatedPressable from './AnimatedPressable';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  leadingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  chevrons?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Lime pill button with dark text, optional circular leading icon + trailing chevrons.
export default function PrimaryButton({
  label,
  onPress,
  leadingIcon,
  loading = false,
  disabled = false,
  chevrons = false,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, isDisabled && styles.disabled, style]}
      activeScale={0.97}
      accessibilityRole="button"
    >
      {leadingIcon && (
        <View style={styles.iconCircle}>
          <Icon name={leadingIcon} size={18} color={colors.accent} />
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
      {chevrons && !loading && (
        <View style={styles.chevrons}>
          <Icon name="arrow-up-right" size={18} color={colors.onAccent} />
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
    gap: spacing.md,
  },
  disabled: { opacity: 0.45 },
  label: {
    color: colors.onAccent,
    fontSize: font.size.lg,
    fontFamily: font.bold,
    fontWeight: '700',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.onAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevrons: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(19,21,12,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

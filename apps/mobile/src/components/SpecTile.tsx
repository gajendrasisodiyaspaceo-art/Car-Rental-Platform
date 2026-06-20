import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme/tokens';
import { Icon, type IconName } from './icons';

interface SpecTileProps {
  icon: IconName;
  label: string;
  value: string;
}

// Icon + label + value tile used in vehicle spec grids.
export default function SpecTile({ icon, label, value }: SpecTileProps) {
  return (
    <View style={styles.tile}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={20} color={colors.accent} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.raised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    minWidth: 92,
  },
  iconWrap: { marginBottom: spacing.xs },
  label: {
    color: colors.muted,
    fontSize: font.size.xs,
    fontFamily: font.regular,
  },
  value: {
    color: colors.text,
    fontSize: font.size.md,
    fontFamily: font.bold,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

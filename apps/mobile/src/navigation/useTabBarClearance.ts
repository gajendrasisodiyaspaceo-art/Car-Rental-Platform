import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/tokens';
import { TAB_BAR_HEIGHT } from './TabBar';

// Bottom space the floating tab bar reserves. Mirrors the bar's own paddingBottom
// math (Math.max(insets.bottom, spacing.lg)) so content always clears it, plus a
// small gap. Use on tab-root / list screens that KEEP the bar.
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, spacing.lg) + spacing.md;
}

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFavorites } from '../hooks/useFavorites';
import PrimaryButton from '../components/PrimaryButton';
import SpecTile from '../components/SpecTile';
import { Icon, CarSilhouette } from '../components/icons';
import { Entrance } from '../hooks/useEntrance';
import { colors, font, radius, shadow, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_PANEL_H = 280;
const IMAGE_INSET = 20;

const PLACEHOLDER_DESC =
  'A refined driving machine built for both comfort and efficiency. Engineered for those who demand presence on the road without sacrificing fuel economy.';

export default function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicle } = route.params;
  const [imgFailed, setImgFailed] = useState(!vehicle.images[0]);
  const [expanded, setExpanded] = useState(false);
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(vehicle._id);

  // Hero panel entrance — fade + scale from 0.96 → 1
  const heroProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroProgress, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [heroProgress]);

  const heroOpacity = heroProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const heroScale = heroProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const specs = [
    vehicle.seats != null
      ? { icon: 'seat' as const, label: 'Passengers', value: `${vehicle.seats}` }
      : null,
    { icon: 'gear' as const, label: 'Transmission', value: vehicle.transmission },
    { icon: 'fuel' as const, label: 'Fuel type', value: vehicle.fuelType },
    vehicle.year != null
      ? { icon: 'speed' as const, label: 'Year', value: `${vehicle.year}` }
      : null,
  ].filter(Boolean) as { icon: 'seat' | 'gear' | 'fuel' | 'speed'; label: string; value: string }[];

  const hasRating = Boolean(vehicle.rating && vehicle.rating.count > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── LIME HERO PANEL ── fades + scales in on mount */}
        <Animated.View
          style={[
            styles.heroPanel,
            { opacity: heroOpacity, transform: [{ scale: heroScale }] },
          ]}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Icon name="back" size={20} color={colors.onAccent} />
          </Pressable>

          <Pressable
            onPress={() => toggle(vehicle._id)}
            style={styles.heartBtn}
            hitSlop={8}
          >
            <Icon
              name={fav ? 'heart-filled' : 'heart'}
              size={20}
              color={fav ? colors.onAccent : colors.onAccent}
            />
          </Pressable>

          {imgFailed ? (
            <View style={[styles.heroImage, styles.heroFallback]}>
              <CarSilhouette width={240} height={130} />
            </View>
          ) : (
            <Image
              source={{ uri: vehicle.images[0] }}
              style={styles.heroImage}
              resizeMode="contain"
              onError={() => setImgFailed(true)}
            />
          )}

          <View style={styles.threeSixtyBtn}>
            <Icon name="three-sixty" size={18} color={colors.text} />
          </View>
        </Animated.View>

        {/* ── CONTENT BODY ── each section staggers in */}
        <View style={styles.body}>
          {/* Name + rating — index 0 */}
          <Entrance index={0}>
            <View style={styles.nameRow}>
              <Text style={styles.vehicleName} numberOfLines={2}>
                {vehicle.name}
              </Text>
              {hasRating && (
                <View style={styles.ratingBadge}>
                  <Icon name="star" size={13} color={colors.gold} />
                  <Text style={styles.ratingNum}>
                    {vehicle.rating!.average.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            {hasRating && (
              <Text style={styles.reviewCount}>
                {vehicle.rating!.count} reviews
              </Text>
            )}
          </Entrance>

          {/* Price — index 1 */}
          <Entrance index={1}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {vehicle.currency} {vehicle.pricing.daily}
              </Text>
              <Text style={styles.perDay}> / day</Text>
            </View>
          </Entrance>

          {/* Description — index 2 */}
          <Entrance index={2} style={styles.descBlock}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text
              style={styles.descText}
              numberOfLines={expanded ? undefined : 3}
            >
              {PLACEHOLDER_DESC}
            </Text>
            <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
              <Text style={styles.readMore}>
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          </Entrance>

          {/* Specifications grid — index 3 */}
          {specs.length > 0 && (
            <Entrance index={3} style={styles.specsBlock}>
              <Text style={styles.sectionLabel}>Specifications</Text>
              <View style={styles.specsGrid}>
                {specs.map((s) => (
                  <View key={s.label} style={styles.specCell}>
                    <SpecTile icon={s.icon} label={s.label} value={s.value} />
                  </View>
                ))}
              </View>
            </Entrance>
          )}

          {/* Features list — index 4 */}
          {vehicle.features.length > 0 && (
            <Entrance index={4} style={styles.featuresBlock}>
              <Text style={styles.sectionLabel}>Features</Text>
              <View style={styles.featuresWrap}>
                {vehicle.features.map((f) => (
                  <View key={f} style={styles.featurePill}>
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </Entrance>
          )}

          {/* Weekly / monthly pricing — index 5 */}
          {(vehicle.pricing.weekly != null || vehicle.pricing.monthly != null) && (
            <Entrance index={5} style={styles.altPricingBlock}>
              <Text style={styles.sectionLabel}>Pricing options</Text>
              <View style={styles.altPricingRow}>
                {vehicle.pricing.weekly != null && (
                  <View style={styles.altPriceCard}>
                    <Text style={styles.altPriceLabel}>Weekly</Text>
                    <Text style={styles.altPriceValue}>
                      {vehicle.currency} {vehicle.pricing.weekly}
                    </Text>
                  </View>
                )}
                {vehicle.pricing.monthly != null && (
                  <View style={styles.altPriceCard}>
                    <Text style={styles.altPriceLabel}>Monthly</Text>
                    <Text style={styles.altPriceValue}>
                      {vehicle.currency} {vehicle.pricing.monthly}
                    </Text>
                  </View>
                )}
              </View>
            </Entrance>
          )}
        </View>
      </ScrollView>

      {/* ── STICKY BOOK BUTTON — entrance index 6, slightly delayed so it lands after content */}
      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <Entrance index={6}>
          <PrimaryButton
            label="Book this vehicle"
            chevrons
            onPress={() => navigation.navigate('BookingConfig', { vehicle })}
            style={styles.bookBtn}
          />
        </Entrance>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // ── Hero panel ──
  heroPanel: {
    width: SCREEN_W,
    height: HERO_PANEL_H,
    backgroundColor: colors.accent,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    left: IMAGE_INSET,
    right: IMAGE_INSET,
    top: 52,
    bottom: IMAGE_INSET,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(19,21,12,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(19,21,12,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  threeSixtyBtn: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.xl,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadow.card,
  },

  // ── Content body ──
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.xxl,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  vehicleName: {
    flex: 1,
    color: colors.text,
    fontSize: font.size.xxxl,
    fontFamily: font.display,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  ratingNum: {
    color: colors.text,
    fontSize: font.size.md,
    fontFamily: font.bold,
    fontWeight: '700',
  },
  reviewCount: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontFamily: font.regular,
    marginTop: -spacing.lg,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    color: colors.accent,
    fontSize: font.size.xxl,
    fontFamily: font.display,
    fontWeight: '700',
  },
  perDay: {
    color: colors.muted,
    fontSize: font.size.md,
    fontFamily: font.regular,
  },

  // Description
  descBlock: { gap: spacing.sm },
  sectionLabel: {
    color: colors.muted,
    fontSize: font.size.xs,
    fontFamily: font.medium,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  descText: {
    color: colors.text,
    fontSize: font.size.md,
    fontFamily: font.regular,
    lineHeight: 24,
  },
  readMore: {
    color: colors.accent,
    fontSize: font.size.sm,
    fontFamily: font.medium,
    fontWeight: '500',
    marginTop: spacing.xs,
  },

  // Specs
  specsBlock: { gap: spacing.md },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  specCell: {
    flex: 1,
    minWidth: '44%',
  },

  // Features
  featuresBlock: { gap: spacing.md },
  featuresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featurePill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.raised,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    color: colors.text,
    fontSize: font.size.sm,
    fontFamily: font.medium,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Alt pricing
  altPricingBlock: { gap: spacing.md },
  altPricingRow: { flexDirection: 'row', gap: spacing.md },
  altPriceCard: {
    flex: 1,
    backgroundColor: colors.raised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  altPriceLabel: {
    color: colors.muted,
    fontSize: font.size.xs,
    fontFamily: font.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  altPriceValue: {
    color: colors.text,
    fontSize: font.size.lg,
    fontFamily: font.bold,
    fontWeight: '700',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bookBtn: {
    width: '100%',
  },
});

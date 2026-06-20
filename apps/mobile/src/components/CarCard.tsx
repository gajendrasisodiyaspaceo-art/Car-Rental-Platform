import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '../theme/tokens';
import { Icon, CarSilhouette } from './icons';
import AnimatedPressable from './AnimatedPressable';
import type { Vehicle } from '../types';

interface CarCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  variant?: 'grid' | 'wide';
}

// Rich dark car card. On image error renders a CarSilhouette fallback — no random photos.
export default function CarCard({
  vehicle,
  onPress,
  favorite = false,
  onToggleFavorite,
  variant = 'grid',
}: CarCardProps) {
  const [imgError, setImgError] = useState(false);
  const uri = vehicle.images[0];
  const isWide = variant === 'wide';

  return (
    <AnimatedPressable
      style={[styles.card, isWide && styles.cardWide]}
      onPress={onPress}
      activeScale={0.97}
    >
      <View style={[styles.imageWrap, isWide && styles.imageWrapWide]}>
        {uri && !imgError ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.fallback}>
            <CarSilhouette width={isWide ? 100 : 120} height={isWide ? 50 : 60} />
          </View>
        )}
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            style={styles.heartBtn}
          >
            <Icon
              name={favorite ? 'heart-filled' : 'heart'}
              size={18}
              color={favorite ? colors.accent : colors.text}
            />
          </Pressable>
        )}
      </View>

      <View style={[styles.body, isWide && styles.bodyWide]}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {vehicle.name}
          </Text>
          {vehicle.rating && (
            <View style={styles.ratingRow}>
              <Icon name="star" size={13} color={colors.gold} />
              <Text style={styles.ratingText}>
                {vehicle.rating.average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {vehicle.seats ? `${vehicle.seats} Passengers` : 'Passengers N/A'} ·{' '}
          {vehicle.transmission}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.price}>
            {vehicle.currency} {vehicle.pricing.daily}
            <Text style={styles.perDay}> /day</Text>
          </Text>
          <View style={styles.arrowBtn}>
            <Icon name="arrow-up-right" size={18} color={colors.onAccent} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardWide: { flexDirection: 'row' },
  imageWrap: {
    width: '100%',
    height: 140,
    backgroundColor: colors.raised,
  },
  imageWrapWide: { width: 130, height: 'auto' },
  image: { width: '100%', height: '100%' },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(14,15,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.md, gap: spacing.xs },
  bodyWide: { flex: 1, justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: font.size.lg,
    fontFamily: font.display,
    fontWeight: '700',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: {
    color: colors.text,
    fontSize: font.size.sm,
    fontFamily: font.medium,
    fontWeight: '500',
  },
  meta: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontFamily: font.regular,
    textTransform: 'capitalize',
  },
  footerRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: colors.text,
    fontSize: font.size.lg,
    fontFamily: font.bold,
    fontWeight: '700',
  },
  perDay: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontFamily: font.regular,
    fontWeight: '400',
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

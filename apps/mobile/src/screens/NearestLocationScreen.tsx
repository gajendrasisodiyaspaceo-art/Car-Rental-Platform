import { useEffect, useRef } from 'react';
import {
  Animated,
  type DimensionValue,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchVehicles } from '../store/vehiclesSlice';
import { useFavorites } from '../hooks/useFavorites';
import CarCard from '../components/CarCard';
import { Icon } from '../components/icons';
import { colors, font, radius, shadow, spacing } from '../theme/tokens';
import { useTabBarClearance } from '../navigation/useTabBarClearance';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NearestLocation'>;

const PIN_DATA = [
  { id: '1', x: '22%', y: '38%', dist: '0.8 km', label: 'Downtown' },
  { id: '2', x: '55%', y: '22%', dist: '2.5 km', label: 'Midtown' },
  { id: '3', x: '72%', y: '52%', dist: '4.1 km', label: 'Airport' },
  { id: '4', x: '38%', y: '62%', dist: '1.3 km', label: 'Mall' },
];

function MapMock() {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.mapContainer}>
      {/* Dark tiled background pattern */}
      <View style={styles.gridOverlay} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {/* Horizontal grid lines */}
          {[...Array(12)].map((_, i) => (
            <Line
              key={`h${i}`}
              x1="0"
              y1={`${(i + 1) * 8.33}%`}
              x2="100%"
              y2={`${(i + 1) * 8.33}%`}
              stroke={colors.border}
              strokeWidth="1"
              opacity="0.4"
            />
          ))}
          {/* Vertical grid lines */}
          {[...Array(8)].map((_, i) => (
            <Line
              key={`v${i}`}
              x1={`${(i + 1) * 12.5}%`}
              y1="0"
              x2={`${(i + 1) * 12.5}%`}
              y2="100%"
              stroke={colors.border}
              strokeWidth="1"
              opacity="0.4"
            />
          ))}
          {/* Route roads */}
          <Path
            d="M 80 300 Q 160 200 260 180 Q 340 160 420 120"
            stroke={colors.raised}
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 80 300 Q 160 200 260 180 Q 340 160 420 120"
            stroke={colors.border}
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 80 300 Q 160 200 260 180 Q 340 160 420 120"
            stroke={colors.accent}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="10,8"
            opacity="0.85"
          />
          {/* Secondary road */}
          <Path
            d="M 160 380 Q 200 300 260 180"
            stroke={colors.raised}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 160 380 Q 200 300 260 180"
            stroke={colors.border}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          {/* Block shapes */}
          <Path
            d="M 120 240 h 50 v 40 h -50 z"
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth="1"
            opacity="0.7"
          />
          <Path
            d="M 300 140 h 60 v 50 h -60 z"
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth="1"
            opacity="0.7"
          />
          <Path
            d="M 340 260 h 40 v 55 h -40 z"
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth="1"
            opacity="0.7"
          />
          <Path
            d="M 60 160 h 45 v 35 h -45 z"
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth="1"
            opacity="0.5"
          />
          {/* Car pins */}
          {PIN_DATA.map((pin) => (
            <Circle
              key={pin.id}
              cx={pin.x}
              cy={pin.y}
              r="12"
              fill={colors.accent}
              opacity="0.9"
            />
          ))}
          {/* User dot */}
          <Circle cx="50%" cy="75%" r="8" fill={colors.accent} opacity="1" />
          <Circle cx="50%" cy="75%" r="16" fill={colors.accent} opacity="0.2" />
        </Svg>
      </View>

      {/* Pin overlays with labels */}
      {PIN_DATA.map((pin) => (
        <View
          key={pin.id}
          style={[styles.pinLabel, { left: pin.x as DimensionValue, top: pin.y as DimensionValue }]}
        >
          <View style={styles.pinBubble}>
            <Icon name="location" size={10} color={colors.onAccent} />
            <Text style={styles.pinText}>{pin.dist}</Text>
          </View>
        </View>
      ))}

      {/* Pulsing user location */}
      <View style={styles.userLocContainer}>
        <Animated.View style={[styles.userLocPulse, { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.userLocDot} />
      </View>

      {/* Map controls */}
      <View style={styles.mapControls}>
        <Pressable style={styles.controlBtn}>
          <Text style={styles.controlBtnText}>+</Text>
        </Pressable>
        <View style={styles.controlDivider} />
        <Pressable style={styles.controlBtn}>
          <Text style={styles.controlBtnText}>−</Text>
        </Pressable>
      </View>

      {/* Locate me button */}
      <Pressable style={styles.locateBtn}>
        <Icon name="location" size={18} color={colors.accent} />
      </Pressable>

      {/* Gradient fade at bottom */}
      <View style={styles.mapFade} pointerEvents="none" />
    </View>
  );
}

export default function NearestLocationScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const status = useAppSelector((s) => s.vehicles.status);
  const { isFavorite, toggle } = useFavorites();
  const tabBarClearance = useTabBarClearance();

  useEffect(() => {
    if (vehicles.length === 0) {
      dispatch(fetchVehicles());
    }
  }, [dispatch, vehicles.length]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearest Location</Text>
        <View style={styles.headerPill}>
          <Icon name="location" size={14} color={colors.accent} />
          <Text style={styles.headerPillText}>Live</Text>
        </View>
      </View>

      {/* Map */}
      <MapMock />

      {/* Nearby badges strip */}
      <View style={styles.nearbyStrip}>
        {PIN_DATA.map((pin) => (
          <View key={pin.id} style={styles.nearbyChip}>
            <View style={styles.nearbyDot} />
            <Text style={styles.nearbyChipText}>{pin.label}</Text>
            <Text style={styles.nearbyDist}>{pin.dist}</Text>
          </View>
        ))}
      </View>

      {/* Section label */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Available Nearby</Text>
        {status === 'loading' && (
          <Text style={styles.loadingText}>Loading...</Text>
        )}
      </View>

      {/* Horizontal car list */}
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carListContent}
        style={[styles.carList, { marginBottom: tabBarClearance }]}
        renderItem={({ item }) => (
          <View style={styles.carCardWrap}>
            <CarCard
              vehicle={item}
              favorite={isFavorite(item._id)}
              onToggleFavorite={() => toggle(item._id)}
              onPress={() =>
                navigation.navigate('VehicleDetail', { vehicle: item })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          status !== 'loading' ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No vehicles found nearby</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: font.size.xxl,
    fontFamily: font.display,
    fontWeight: '700',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  headerPillText: {
    color: colors.accent,
    fontSize: font.size.sm,
    fontFamily: font.medium,
    fontWeight: '500',
  },

  mapContainer: {
    marginHorizontal: spacing.xl,
    height: 240,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  pinLabel: {
    position: 'absolute',
    transform: [{ translateX: -28 }, { translateY: -40 }],
  },
  pinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    ...shadow.accent,
  },
  pinText: {
    color: colors.onAccent,
    fontSize: font.size.xs,
    fontFamily: font.bold,
    fontWeight: '700',
  },

  userLocContainer: {
    position: 'absolute',
    bottom: '25%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  userLocDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.onAccent,
  },

  mapControls: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    backgroundColor: colors.raised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  controlBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    color: colors.text,
    fontSize: font.size.xl,
    fontFamily: font.medium,
    lineHeight: 22,
  },
  controlDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  locateBtn: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },

  mapFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(14,15,12,0.55)',
  },

  nearbyStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  nearbyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  nearbyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  nearbyChipText: {
    color: colors.text,
    fontSize: font.size.xs,
    fontFamily: font.medium,
    fontWeight: '500',
  },
  nearbyDist: {
    color: colors.muted,
    fontSize: font.size.xs,
    fontFamily: font.regular,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.size.lg,
    fontFamily: font.display,
    fontWeight: '700',
  },
  loadingText: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontFamily: font.regular,
  },

  carList: { flexGrow: 0 },
  carListContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  carCardWrap: { width: 220 },

  emptyWrap: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: font.size.md,
    fontFamily: font.regular,
  },
});

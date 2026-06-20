import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchVehicles, type VehicleFilters } from '../store/vehiclesSlice';
import { useFavorites } from '../hooks/useFavorites';
import CarCard from '../components/CarCard';
import FilterChip from '../components/FilterChip';
import { Icon } from '../components/icons';
import { Entrance } from '../hooks/useEntrance';
import { colors, font, radius, spacing } from '../theme/tokens';
import type { Vehicle } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CarList'>;

type FilterKey = 'all' | 'automatic' | 'hybrid' | 'electric';

interface FilterOption {
  key: FilterKey;
  label: string;
  filters: VehicleFilters;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All', filters: {} },
  { key: 'automatic', label: 'Automatic', filters: { transmission: 'automatic' } },
  { key: 'hybrid', label: 'Hybrid', filters: { fuelType: 'hybrid' } },
  { key: 'electric', label: 'Electric', filters: { fuelType: 'electric' } },
];

export default function CarListScreen({ route, navigation }: Props) {
  const title = route.params?.title ?? 'Nearest Cars';
  const initialFilter = route.params?.filter ?? {};

  const dispatch = useAppDispatch();
  const { items: vehicles, status } = useAppSelector((s) => s.vehicles);
  const { isFavorite, toggle } = useFavorites();

  const resolveInitialKey = (): FilterKey => {
    const f = initialFilter;
    if (f?.transmission === 'automatic') return 'automatic';
    if (f?.fuelType === 'hybrid') return 'hybrid';
    if (f?.fuelType === 'electric') return 'electric';
    return 'all';
  };

  const [activeKey, setActiveKey] = useState<FilterKey>(resolveInitialKey);

  const loadVehicles = useCallback(
    (key: FilterKey) => {
      const opt = FILTER_OPTIONS.find((o) => o.key === key)!;
      void dispatch(fetchVehicles(opt.filters));
    },
    [dispatch],
  );

  useEffect(() => {
    loadVehicles(activeKey);
  }, [activeKey, loadVehicles]);

  const handleFilterPress = (key: FilterKey) => {
    setActiveKey(key);
  };

  const handleCardPress = (vehicle: Vehicle) => {
    navigation.navigate('VehicleDetail', { vehicle });
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Vehicle; index: number }) => (
      <Entrance index={index}>
        <CarCard
          vehicle={item}
          variant="wide"
          favorite={isFavorite(item._id)}
          onToggleFavorite={() => toggle(item._id)}
          onPress={() => handleCardPress(item)}
        />
      </Entrance>
    ),
    [isFavorite, toggle],
  );

  const keyExtractor = (item: Vehicle) => item._id;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Icon name="back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable style={styles.searchBtn} hitSlop={8}>
          <Icon name="search" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <FlatList
          data={FILTER_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(o) => o.key}
          contentContainerStyle={styles.filtersContent}
          ItemSeparatorComponent={() => <View style={styles.filterSep} />}
          renderItem={({ item }) => (
            <FilterChip
              key={item.key}
              label={item.label}
              selected={activeKey === item.key}
              onPress={() => handleFilterPress(item.key)}
            />
          )}
        />
      </View>

      {/* Section label row */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Select Your Car</Text>
        <Text style={styles.seeAll}>
          {status === 'idle' ? `${vehicles.length} available` : 'See all'}
        </Text>
      </View>

      {/* List */}
      {status === 'loading' ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🚗</Text>
          <Text style={styles.emptyTitle}>No cars found</Text>
          <Text style={styles.emptyBody}>
            Try a different filter to find available vehicles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.listSep} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: font.size.xl,
    fontFamily: font.display,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filters
  filtersWrap: {
    paddingBottom: spacing.lg,
  },
  filtersContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterSep: { width: spacing.sm },

  // Section row
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.size.lg,
    fontFamily: font.display,
    fontWeight: '700',
  },
  seeAll: {
    color: colors.accent,
    fontSize: font.size.sm,
    fontFamily: font.medium,
    fontWeight: '500',
  },

  // Loading / empty
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: font.size.xl,
    fontFamily: font.display,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: font.size.md,
    fontFamily: font.regular,
    textAlign: 'center',
    lineHeight: 22,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xxxl,
  },
  listSep: { height: spacing.md },
});

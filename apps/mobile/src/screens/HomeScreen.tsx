import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTabBarClearance } from '../navigation/useTabBarClearance';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchVehicles } from '../store/vehiclesSlice';
import { fetchCategories } from '../store/categoriesSlice';
import CarCard from '../components/CarCard';
import BrandChip from '../components/BrandChip';
import FilterChip from '../components/FilterChip';
import PrimaryButton from '../components/PrimaryButton';
import { Entrance } from '../hooks/useEntrance';
import { Icon } from '../components/icons';
import { colors, font, radius, spacing, shadow } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import type { Vehicle } from '../types';
import useFavorites from '../hooks/useFavorites';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ─── Static brand data ─────────────────────────────────────────────────────
const BRANDS = [
  { label: 'All', icon: 'grid' as const },
  { label: 'Jaguar', icon: 'speed' as const },
  { label: 'Volvo', icon: 'gear' as const },
  { label: 'Nissan', icon: 'fuel' as const },
  { label: 'Honda', icon: 'seat' as const },
];

const DROP_OFF_TABS = ['Same Drop-Off', 'Different'] as const;
type DropOffTab = (typeof DROP_OFF_TABS)[number];

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

const dayAfterTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d;
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return <Text style={sectionStyles.label}>{children}</Text>;
}

const sectionStyles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: font.size.sm,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
});

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.vehicles);
  const user = useAppSelector((s) => s.auth.user);
  const { items: categories } = useAppSelector((s) => s.categories);
  const { isFavorite, toggle } = useFavorites();
  const insets = useSafeAreaInsets();
  const tabBarClearance = useTabBarClearance();

  // ── Filter state (preserve existing logic) ──
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [transmission, setTransmission] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Location / date state ──
  const [dropOffTab, setDropOffTab] = useState<DropOffTab>('Same Drop-Off');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropOffLocation, setDropOffLocation] = useState('');
  const [fromDate, setFromDate] = useState<Date>(tomorrow());
  const [toDate, setToDate] = useState<Date>(dayAfterTomorrow());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Existing fetch logic — preserved verbatim ──
  const buildAndFetch = useCallback(
    (overrides: {
      q?: string;
      categoryId?: string | null;
      tx?: string | null;
      fuel?: string | null;
      min?: string;
      max?: string;
    } = {}) => {
      const q = overrides.q !== undefined ? overrides.q : query;
      const cat = overrides.categoryId !== undefined ? overrides.categoryId : selectedCategory;
      const tx = overrides.tx !== undefined ? overrides.tx : transmission;
      const fuel = overrides.fuel !== undefined ? overrides.fuel : fuelType;
      const min = overrides.min !== undefined ? overrides.min : minPrice;
      const max = overrides.max !== undefined ? overrides.max : maxPrice;

      dispatch(
        fetchVehicles({
          ...(q.trim() ? { q: q.trim() } : {}),
          ...(cat ? { categoryId: cat } : {}),
          ...(tx ? { transmission: tx } : {}),
          ...(fuel ? { fuelType: fuel } : {}),
          ...(min !== '' && !isNaN(Number(min)) ? { minPrice: Number(min) } : {}),
          ...(max !== '' && !isNaN(Number(max)) ? { maxPrice: Number(max) } : {}),
        }),
      );
    },
    [dispatch, query, selectedCategory, transmission, fuelType, minPrice, maxPrice],
  );

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      buildAndFetch({ q: text });
    }, 400);
  };

  const handleCategoryToggle = (id: string) => {
    const next = selectedCategory === id ? null : id;
    setSelectedCategory(next);
    buildAndFetch({ categoryId: next });
  };

  const handleTransmissionToggle = (value: string) => {
    const next = transmission === value ? null : value;
    setTransmission(next);
    buildAndFetch({ tx: next });
  };

  const handleFuelToggle = (value: string) => {
    const next = fuelType === value ? null : value;
    setFuelType(next);
    buildAndFetch({ fuel: next });
  };

  const handleApplyPrice = () => {
    buildAndFetch({ min: minPrice, max: maxPrice });
  };

  const handleClearAll = () => {
    setQuery('');
    setSelectedCategory(null);
    setTransmission(null);
    setFuelType(null);
    setMinPrice('');
    setMaxPrice('');
    dispatch(fetchVehicles());
  };

  const sortedItems = useMemo<Vehicle[]>(() => items, [items]);

  const hasActiveFilters =
    query.trim() !== '' ||
    selectedCategory !== null ||
    transmission !== null ||
    fuelType !== null ||
    minPrice !== '' ||
    maxPrice !== '';

  // ── User display helpers ──
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const cityDisplay = 'San Francisco';

  // ── Search Car action ──
  const handleSearchCar = () => {
    navigation.navigate('CarList', {
      filter: {
        ...(transmission ? { transmission } : {}),
        ...(fuelType ? { fuelType } : {}),
        ...(minPrice !== '' && !isNaN(Number(minPrice)) ? { minPrice: Number(minPrice) } : {}),
        ...(maxPrice !== '' && !isNaN(Number(maxPrice)) ? { maxPrice: Number(maxPrice) } : {}),
      },
      title: 'Search Results',
    });
  };

  // ─── List header ────────────────────────────────────────────────────────
  const ListHeader = (
    <View style={[styles.listHeader, { paddingTop: insets.top + spacing.md }]}>
      {/* ── Top bar ── */}
      <Entrance index={0}>
        <View style={styles.topBar}>
          <Pressable style={styles.topBarLeft}>
            <View style={styles.gridIconWrap}>
              <Icon name="grid" size={20} color={colors.text} />
            </View>
            <View style={styles.locationBlock}>
              <Text style={styles.locationLabel}>Your Location</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={13} color={colors.accent} />
                <Text style={styles.locationCity}>{cityDisplay}</Text>
              </View>
            </View>
          </Pressable>

          {/* Avatar */}
          <View style={styles.avatar}>
            {user?.name ? (
              <Text style={styles.avatarText}>{userInitial}</Text>
            ) : (
              <Icon name="profile" size={20} color={colors.onAccent} />
            )}
          </View>
        </View>
      </Entrance>

      {/* ── Top brands ── */}
      <Entrance index={1}>
        <View style={styles.section}>
          <SectionLabel>Top Brands</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsRow}
          >
            {BRANDS.map((b) => (
              <BrandChip
                key={b.label}
                brand={b.label}
                selected={selectedBrand === b.label}
                onPress={() => setSelectedBrand(b.label)}
              />
            ))}
          </ScrollView>
        </View>
      </Entrance>

      {/* ── Select Location card ── */}
      <Entrance index={2}>
      <View style={styles.locationCard}>
        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {DROP_OFF_TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, dropOffTab === tab && styles.tabBtnActive]}
              onPress={() => setDropOffTab(tab)}
            >
              <Text style={[styles.tabLabel, dropOffTab === tab && styles.tabLabelActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Pick-Up field */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldIconWrap}>
            <Icon name="location" size={16} color={colors.accent} />
          </View>
          <TextInput
            style={styles.fieldInput}
            placeholder="Pick-up location"
            placeholderTextColor={colors.muted}
            value={pickupLocation}
            onChangeText={setPickupLocation}
            returnKeyType="next"
          />
        </View>

        {/* Swap button between pick-up and drop-off */}
        {dropOffTab === 'Different' && (
          <>
            <Pressable
              style={styles.swapBtn}
              onPress={() => {
                const tmp = pickupLocation;
                setPickupLocation(dropOffLocation);
                setDropOffLocation(tmp);
              }}
            >
              <Icon name="swap" size={18} color={colors.accent} />
            </Pressable>

            {/* Drop-Off field */}
            <View style={[styles.fieldRow, styles.fieldRowTop]}>
              <View style={styles.fieldIconWrap}>
                <Icon name="location" size={16} color={colors.muted} />
              </View>
              <TextInput
                style={styles.fieldInput}
                placeholder="Drop-off location"
                placeholderTextColor={colors.muted}
                value={dropOffLocation}
                onChangeText={setDropOffLocation}
                returnKeyType="done"
              />
            </View>
          </>
        )}

        {/* Date fields row */}
        <View style={styles.dateRow}>
          {/* From date */}
          <Pressable
            style={[styles.dateField, styles.dateFieldHalf]}
            onPress={() => {
              setShowToPicker(false);
              setShowFromPicker((v) => !v);
            }}
          >
            <View style={styles.fieldIconWrap}>
              <Icon name="calendar" size={15} color={colors.accent} />
            </View>
            <View style={styles.dateLabelBlock}>
              <Text style={styles.dateLabelMeta}>From</Text>
              <Text style={styles.dateLabelValue}>{fmt(fromDate)}</Text>
            </View>
          </Pressable>

          <View style={styles.dateDivider} />

          {/* To date */}
          <Pressable
            style={[styles.dateField, styles.dateFieldHalf]}
            onPress={() => {
              setShowFromPicker(false);
              setShowToPicker((v) => !v);
            }}
          >
            <View style={styles.fieldIconWrap}>
              <Icon name="calendar" size={15} color={colors.accent} />
            </View>
            <View style={styles.dateLabelBlock}>
              <Text style={styles.dateLabelMeta}>To</Text>
              <Text style={styles.dateLabelValue}>{fmt(toDate)}</Text>
            </View>
          </Pressable>
        </View>

        {/* Inline date pickers */}
        {showFromPicker && (
          <DateTimePicker
            value={fromDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={new Date()}
            onChange={(_e, d) => {
              if (Platform.OS === 'android') setShowFromPicker(false);
              if (d) {
                setFromDate(d);
                if (d >= toDate) {
                  const next = new Date(d);
                  next.setDate(d.getDate() + 1);
                  setToDate(next);
                }
              }
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={fromDate}
            onChange={(_e, d) => {
              if (Platform.OS === 'android') setShowToPicker(false);
              if (d) setToDate(d);
            }}
          />
        )}

        {/* Search Car button */}
        <Entrance index={3}>
          <PrimaryButton
            label="Search Car"
            onPress={handleSearchCar}
            style={styles.searchCarBtn}
          />
        </Entrance>
      </View>
      </Entrance>

      {/* ── Available cars heading + filter controls ── */}
      <View style={styles.section}>
        <View style={styles.carsHeadingRow}>
          <Text style={styles.carsHeading}>Available Cars</Text>
          <Pressable
            style={[styles.filterToggleBtn, filtersOpen && styles.filterToggleBtnActive]}
            onPress={() => setFiltersOpen((v) => !v)}
          >
            <Icon name="grid" size={14} color={filtersOpen ? colors.onAccent : colors.text} />
            <Text style={[styles.filterToggleText, filtersOpen && styles.filterToggleTextActive]}>
              Filters
            </Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search make, model…"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            onSubmitEditing={() => buildAndFetch({})}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); buildAndFetch({ q: '' }); }}>
              <Text style={styles.clearX}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category chips ── */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catChipsRow}
        >
          {categories.map((cat) => (
            <FilterChip
              key={cat._id}
              label={cat.name}
              selected={selectedCategory === cat._id}
              onPress={() => handleCategoryToggle(cat._id)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Collapsible filter panel ── */}
      {filtersOpen && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterSectionLabel}>Transmission</Text>
          <View style={styles.filterChipsRow}>
            {['automatic', 'manual'].map((opt) => (
              <FilterChip
                key={opt}
                label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                selected={transmission === opt}
                onPress={() => handleTransmissionToggle(opt)}
              />
            ))}
          </View>

          <Text style={[styles.filterSectionLabel, { marginTop: spacing.md }]}>Fuel Type</Text>
          <View style={styles.filterChipsRow}>
            {['petrol', 'diesel', 'electric', 'hybrid'].map((opt) => (
              <FilterChip
                key={opt}
                label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                selected={fuelType === opt}
                onPress={() => handleFuelToggle(opt)}
              />
            ))}
          </View>

          <Text style={[styles.filterSectionLabel, { marginTop: spacing.md }]}>
            Daily price range
          </Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
              onBlur={handleApplyPrice}
            />
            <Text style={styles.priceSep}>—</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
              onBlur={handleApplyPrice}
            />
            <Pressable style={styles.applyBtn} onPress={handleApplyPrice}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Active filters badge ── */}
      {hasActiveFilters && (
        <View style={styles.activeRow}>
          <Text style={styles.activeText}>Filters active</Text>
          <Pressable onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarClearance }]}
      data={sortedItems}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl
          refreshing={status === 'loading'}
          onRefresh={() => buildAndFetch({})}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        status !== 'loading' ? (
          <View style={styles.empty}>
            <Icon name="search" size={36} color={colors.border} />
            <Text style={styles.emptyText}>No cars match your search.</Text>
            <Text style={styles.emptyHint}>Try adjusting the filters or dates above.</Text>
          </View>
        ) : null
      }
      numColumns={1}
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <CarCard
            vehicle={item}
            variant="wide"
            favorite={isFavorite(item._id)}
            onToggleFavorite={() => toggle(item._id)}
            onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
          />
        </View>
      )}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
  },
  listHeader: {
    gap: 0,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  gridIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBlock: { gap: 1 },
  locationLabel: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationCity: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: font.size.md,
    fontWeight: '700',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accent,
  },
  avatarText: {
    color: colors.onAccent,
    fontFamily: font.bold,
    fontSize: font.size.lg,
    fontWeight: '700',
  },

  // ── Sections ──
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  brandsRow: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },

  // ── Location card ──
  locationCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.raised,
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: font.size.sm,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.onAccent,
    fontWeight: '700',
    fontFamily: font.bold,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
    gap: spacing.sm,
  },
  fieldRowTop: {
    marginTop: -spacing.xs,
  },
  fieldIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInput: {
    flex: 1,
    color: colors.text,
    fontFamily: font.regular,
    fontSize: font.size.md,
  },

  swapBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -spacing.xs,
  },

  dateRow: {
    flexDirection: 'row',
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateFieldHalf: {
    flex: 1,
  },
  dateDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  dateLabelBlock: {
    gap: 1,
  },
  dateLabelMeta: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.xs,
  },
  dateLabelValue: {
    color: colors.text,
    fontFamily: font.medium,
    fontSize: font.size.sm,
    fontWeight: '500',
  },

  searchCarBtn: {
    marginTop: spacing.xs,
    ...shadow.accent,
  },

  // ── Cars section ──
  carsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  carsHeading: {
    color: colors.text,
    fontFamily: font.display,
    fontSize: font.size.xl,
    fontWeight: '700',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterToggleBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterToggleText: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: font.size.sm,
  },
  filterToggleTextActive: {
    color: colors.onAccent,
    fontWeight: '700',
    fontFamily: font.bold,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: font.regular,
    fontSize: font.size.md,
  },
  clearX: {
    color: colors.muted,
    fontSize: font.size.md,
    paddingHorizontal: spacing.xs,
  },

  catChipsRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingRight: spacing.xl + spacing.sm,
    marginBottom: spacing.lg,
  },

  // ── Filter panel ──
  filterPanel: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  filterSectionLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: font.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.raised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: font.regular,
    fontSize: font.size.md,
  },
  priceSep: {
    color: colors.muted,
    fontSize: font.size.lg,
  },
  applyBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  applyBtnText: {
    color: colors.onAccent,
    fontFamily: font.bold,
    fontSize: font.size.sm,
    fontWeight: '700',
  },

  // ── Active filter row ──
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  activeText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.sm,
  },
  clearText: {
    color: colors.accent,
    fontFamily: font.bold,
    fontSize: font.size.sm,
    fontWeight: '700',
  },

  // ── Car list items ──
  cardWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },

  // ── Empty state ──
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: font.size.lg,
    fontWeight: '700',
  },
  emptyHint: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
  },
});

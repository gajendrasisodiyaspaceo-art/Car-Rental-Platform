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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchVehicles } from '../store/vehiclesSlice';
import { fetchCategories } from '../store/categoriesSlice';
import VehicleCard from '../components/VehicleCard';
import type { RootStackParamList } from '../navigation/types';
import type { Vehicle } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const TRANSMISSION_OPTIONS = ['automatic', 'manual'] as const;
const FUEL_OPTIONS = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
type SortOrder = 'none' | 'asc' | 'desc';

export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.vehicles);
  const { items: categories } = useAppSelector((s) => s.categories);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [transmission, setTransmission] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setSortOrder('none');
    dispatch(fetchVehicles());
  };

  const sortedItems = useMemo<Vehicle[]>(() => {
    if (sortOrder === 'none') return items;
    return [...items].sort((a, b) =>
      sortOrder === 'asc'
        ? a.pricing.daily - b.pricing.daily
        : b.pricing.daily - a.pricing.daily,
    );
  }, [items, sortOrder]);

  const hasActiveFilters =
    query.trim() !== '' ||
    selectedCategory !== null ||
    transmission !== null ||
    fuelType !== null ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sortOrder !== 'none';

  const ListHeader = (
    <View>
      <Text style={styles.heading}>Available vehicles</Text>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicles..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={handleQueryChange}
          returnKeyType="search"
          onSubmitEditing={() => buildAndFetch({})}
        />
      </View>

      {/* Category chips */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat._id}
              style={[styles.chip, selectedCategory === cat._id && styles.chipActive]}
              onPress={() => handleCategoryToggle(cat._id)}
            >
              <Text
                style={[styles.chipText, selectedCategory === cat._id && styles.chipTextActive]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Filters + Sort row */}
      <View style={styles.controlsRow}>
        <Pressable
          style={[styles.controlBtn, filtersOpen && styles.controlBtnActive]}
          onPress={() => setFiltersOpen((v) => !v)}
        >
          <Text style={[styles.controlBtnText, filtersOpen && styles.controlBtnTextActive]}>
            Filters {filtersOpen ? '▲' : '▼'}
          </Text>
        </Pressable>

        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Price:</Text>
          {(['none', 'asc', 'desc'] as SortOrder[]).map((opt) => (
            <Pressable
              key={opt}
              style={[styles.sortChip, sortOrder === opt && styles.chipActive]}
              onPress={() => setSortOrder(opt)}
            >
              <Text style={[styles.chipText, sortOrder === opt && styles.chipTextActive]}>
                {opt === 'none' ? 'Any' : opt === 'asc' ? '↑ Low' : '↓ High'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Collapsible filter panel */}
      {filtersOpen && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterSection}>Transmission</Text>
          <View style={styles.filterChips}>
            {TRANSMISSION_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.chip, transmission === opt && styles.chipActive]}
                onPress={() => handleTransmissionToggle(opt)}
              >
                <Text
                  style={[styles.chipText, transmission === opt && styles.chipTextActive]}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSection}>Fuel type</Text>
          <View style={styles.filterChips}>
            {FUEL_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.chip, fuelType === opt && styles.chipActive]}
                onPress={() => handleFuelToggle(opt)}
              >
                <Text style={[styles.chipText, fuelType === opt && styles.chipTextActive]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSection}>Daily price range</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
              onBlur={handleApplyPrice}
            />
            <Text style={styles.priceSep}>–</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor="#94a3b8"
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

      {/* Active filters summary + clear */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.activeFiltersText}>Filters active</Text>
          <Pressable onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={sortedItems}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl
          refreshing={status === 'loading'}
          onRefresh={() => buildAndFetch({})}
        />
      }
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        status !== 'loading' ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No vehicles match your search.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <VehicleCard
          vehicle={item}
          onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16 },
  heading: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 12 },

  searchRow: { marginBottom: 12 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  chipsScroll: { marginBottom: 10 },
  chipsContent: { gap: 8, paddingRight: 4 },

  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#4f46e5' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  controlBtn: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
  },
  controlBtnActive: { backgroundColor: '#4f46e5' },
  controlBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  controlBtnTextActive: { color: '#fff' },

  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  sortChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e2e8f0',
  },

  filterPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  filterSection: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 6,
  },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceSep: { color: '#94a3b8', fontSize: 16 },
  applyBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  activeFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  activeFiltersText: { fontSize: 12, color: '#64748b' },
  clearText: { fontSize: 12, color: '#4f46e5', fontWeight: '700' },

  empty: { paddingVertical: 64, alignItems: 'center' },
  emptyText: { color: '#94a3b8' },
});

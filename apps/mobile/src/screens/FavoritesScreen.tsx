import { useEffect } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchVehicles } from '../store/vehiclesSlice';
import { useFavorites } from '../hooks/useFavorites';
import Screen from '../components/Screen';
import CarCard from '../components/CarCard';
import PrimaryButton from '../components/PrimaryButton';
import { Icon } from '../components/icons';
import { colors, font, radius, spacing } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

function EmptyFavorites({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Icon name="heart" size={40} color={colors.muted} />
      </View>
      <Text style={styles.emptyTitle}>No favourites yet</Text>
      <Text style={styles.emptySubtitle}>
        Save vehicles you love and find them here instantly.
      </Text>
      <PrimaryButton
        label="Browse Cars"
        onPress={onBrowse}
        leadingIcon="grid"
        chevrons
        style={styles.browseCta}
      />
    </View>
  );
}

export default function FavoritesScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const allVehicles = useAppSelector((s) => s.vehicles.items);
  const status = useAppSelector((s) => s.vehicles.status);
  const { ids, isFavorite, toggle } = useFavorites();

  useEffect(() => {
    if (allVehicles.length === 0 && ids.length > 0) {
      dispatch(fetchVehicles());
    }
  }, [dispatch, allVehicles.length, ids.length]);

  const favVehicles = allVehicles.filter((v) => ids.includes(v._id));

  const header = (
    <View style={styles.headerWrap}>
      <Text style={styles.headerTitle}>Favorites</Text>
      {ids.length > 0 && (
        <View style={styles.countPill}>
          <Text style={styles.countText}>{ids.length}</Text>
        </View>
      )}
    </View>
  );

  const handleBrowse = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  if (status === 'loading' && favVehicles.length === 0) {
    return (
      <Screen header={header} padded>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading your saved cars...</Text>
        </View>
      </Screen>
    );
  }

  if (ids.length === 0) {
    return (
      <Screen header={header} padded>
        <EmptyFavorites onBrowse={handleBrowse} />
      </Screen>
    );
  }

  return (
    <Screen header={header} padded={false}>
      <FlatList
        data={favVehicles}
        keyExtractor={(v) => v._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <CarCard
              vehicle={item}
              variant="wide"
              favorite={isFavorite(item._id)}
              onToggleFavorite={() => toggle(item._id)}
              onPress={() =>
                navigation.navigate('VehicleDetail', { vehicle: item })
              }
            />
          </View>
        )}
        ListHeaderComponent={
          favVehicles.length < ids.length ? (
            <View style={styles.syncNote}>
              <Icon name="bell" size={13} color={colors.muted} />
              <Text style={styles.syncNoteText}>
                {ids.length - favVehicles.length} saved{' '}
                {ids.length - favVehicles.length === 1 ? 'car' : 'cars'} not loaded yet
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineText}>
              Your saved vehicles couldn't be found.
            </Text>
            <Pressable onPress={() => dispatch(fetchVehicles())} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  countPill: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  countText: {
    color: colors.onAccent,
    fontSize: font.size.xs,
    fontFamily: font.bold,
    fontWeight: '700',
  },

  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.xs,
  },
  separator: { height: spacing.md },
  cardWrap: {},

  syncNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  syncNoteText: {
    color: colors.muted,
    fontSize: font.size.sm,
    fontFamily: font.regular,
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.muted,
    fontSize: font.size.md,
    fontFamily: font.regular,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: font.size.xl,
    fontFamily: font.display,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: font.size.md,
    fontFamily: font.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  browseCta: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },

  emptyInline: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyInlineText: {
    color: colors.muted,
    fontSize: font.size.md,
    fontFamily: font.regular,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.accent,
    fontSize: font.size.sm,
    fontFamily: font.bold,
    fontWeight: '700',
  },
});

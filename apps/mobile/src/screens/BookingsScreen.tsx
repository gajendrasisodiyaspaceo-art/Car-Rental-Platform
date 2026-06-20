import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import type { Booking, Vehicle } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { colors, font, radius, spacing, shadow } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: 'rgba(244,196,48,0.18)', fg: colors.warning },
  confirmed: { bg: 'rgba(123,224,138,0.18)', fg: colors.success },
  preparing: { bg: 'rgba(127,183,255,0.18)', fg: colors.info },
  ready: { bg: 'rgba(210,243,76,0.18)', fg: colors.accent },
  active: { bg: 'rgba(127,183,255,0.18)', fg: colors.info },
  completed: { bg: 'rgba(155,160,141,0.18)', fg: colors.muted },
  cancelled: { bg: 'rgba(255,107,94,0.18)', fg: colors.danger },
};

export default function BookingsScreen({ navigation }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebooking, setRebooking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRebook = useCallback(async (booking: Booking) => {
    const vehicleId =
      typeof booking.vehicleId === 'object' ? booking.vehicleId?._id : booking.vehicleId;
    if (!vehicleId) {
      Alert.alert('Error', 'Vehicle information is unavailable.');
      return;
    }
    setRebooking(booking._id);
    try {
      const { data } = await api.get(`/vehicles/${vehicleId}`);
      const vehicle = data.data as Vehicle;
      navigation.navigate('BookingConfig', { vehicle });
    } catch {
      Alert.alert('Error', 'Could not load vehicle details. Please try again.');
    } finally {
      setRebooking(null);
    }
  }, [navigation]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={bookings}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={load}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      ListEmptyComponent={
        !loading ? <Text style={styles.empty}>No bookings yet.</Text> : null
      }
      renderItem={({ item }) => {
        const name =
          typeof item.vehicleId === 'object' ? item.vehicleId?.name : 'Vehicle';
        const color = STATUS_COLORS[item.status];
        const isTerminal = item.status === 'completed' || item.status === 'cancelled';
        return (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
          >
            <View style={styles.row}>
              <Text style={styles.name}>{name}</Text>
              <Text
                style={[
                  styles.badge,
                  color ? { backgroundColor: color.bg, color: color.fg } : null,
                ]}
              >
                {item.status}
              </Text>
            </View>
            <Text style={styles.meta}>
              {new Date(item.startDate).toLocaleDateString()} –{' '}
              {new Date(item.endDate).toLocaleDateString()} · {item.plan}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.total}>
                {item.pricing.currency} {item.pricing.total}
              </Text>
              {isTerminal && (
                <Pressable
                  style={[styles.rebookBtn, rebooking === item._id && styles.rebookBtnDisabled]}
                  onPress={() => handleRebook(item)}
                  disabled={rebooking === item._id}
                  hitSlop={8}
                >
                  <Text style={styles.rebookText}>
                    {rebooking === item._id ? 'Loading…' : 'Rebook'}
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardPressed: { opacity: 0.8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: {
    fontSize: font.size.lg,
    fontFamily: font.bold,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  meta: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.sm,
    marginTop: spacing.sm,
    textTransform: 'capitalize',
  },
  total: {
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.md,
    color: colors.accent,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  rebookBtn: {
    backgroundColor: 'rgba(210,243,76,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  rebookBtnDisabled: { opacity: 0.45 },
  rebookText: {
    color: colors.accent,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.sm,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.md,
    marginTop: spacing.xxxl * 2,
  },
  badge: {
    fontSize: font.size.xs,
    fontFamily: font.medium,
    color: colors.muted,
    backgroundColor: colors.raised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
});

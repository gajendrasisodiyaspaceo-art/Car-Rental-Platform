import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import type { Booking, Vehicle } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Bookings'>;

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  confirmed: { bg: '#dcfce7', fg: '#166534' },
  active: { bg: '#dbeafe', fg: '#1e40af' },
  completed: { bg: '#e2e8f0', fg: '#475569' },
  pending: { bg: '#fef9c3', fg: '#854d0e' },
  preparing: { bg: '#dbeafe', fg: '#1e3a8a' },
  ready: { bg: '#ede9fe', fg: '#5b21b6' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' },
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
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={
        !loading ? <Text style={styles.empty}>No bookings yet.</Text> : null
      }
      renderItem={({ item }) => {
        const vehicleName =
          typeof item.vehicleId === 'object' ? item.vehicleId?.name : 'Vehicle';
        const color = STATUS_COLORS[item.status];
        const isTerminal = item.status === 'completed' || item.status === 'cancelled';
        return (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
          >
            <View style={styles.row}>
              <Text style={styles.name}>{vehicleName}</Text>
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
  list: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 6, textTransform: 'capitalize' },
  total: { fontWeight: '700', color: '#4f46e5' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  rebookBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  rebookBtnDisabled: { backgroundColor: '#e2e8f0' },
  rebookText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 64 },
  badge: {
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
});

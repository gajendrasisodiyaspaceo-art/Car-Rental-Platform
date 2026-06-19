import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import type { Booking } from '../types';
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

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
            <Text style={styles.total}>
              {item.pricing.currency} {item.pricing.total}
            </Text>
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
  total: { marginTop: 8, fontWeight: '700', color: '#4f46e5' },
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

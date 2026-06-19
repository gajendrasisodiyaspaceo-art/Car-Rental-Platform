import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import type { Booking } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

function vehicleName(booking: Booking): string {
  if (booking.vehicleId && typeof booking.vehicleId === 'object') {
    return booking.vehicleId.name;
  }
  return 'Vehicle';
}

export default function CheckoutScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data.data as Booking);
      } catch {
        Alert.alert('Error', 'Could not load booking details.');
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [bookingId]);

  const onConfirm = async () => {
    setPaying(true);
    try {
      await api.post(`/bookings/${bookingId}/pay`, { method: 'cash_on_delivery' });
      Alert.alert('Booking confirmed!', 'Your booking is confirmed. Pay on delivery.', [
        {
          text: 'View bookings',
          onPress: () => navigation.navigate('Bookings'),
        },
      ]);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Payment failed', msg ?? 'Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not load booking.</Text>
      </View>
    );
  }

  const p = booking.pricing;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Checkout</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{vehicleName(booking)}</Text>
        <Text style={styles.meta}>
          {new Date(booking.startDate).toLocaleDateString()} –{' '}
          {new Date(booking.endDate).toLocaleDateString()} · {booking.plan}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Price breakdown</Text>
        <Row label="Base" value={`${p.currency} ${p.base.toFixed(2)}`} />
        {p.extras > 0 && <Row label="Extras" value={`${p.currency} ${p.extras.toFixed(2)}`} />}
        {p.discount > 0 && (
          <Row label="Discount" value={`−${p.currency} ${p.discount.toFixed(2)}`} valueStyle={styles.discountText} />
        )}
        <Row label="Tax" value={`${p.currency} ${p.tax.toFixed(2)}`} />
        {p.lateFee > 0 && <Row label="Late fee" value={`${p.currency} ${p.lateFee.toFixed(2)}`} />}
        <View style={styles.divider} />
        <Row label="Total" value={`${p.currency} ${p.total.toFixed(2)}`} total />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment method</Text>
        <View style={styles.methodRow}>
          <View style={styles.methodDot} />
          <Text style={styles.methodLabel}>Cash on delivery</Text>
        </View>
      </View>

      <Pressable style={[styles.button, paying && styles.buttonDisabled]} onPress={onConfirm} disabled={paying}>
        <Text style={styles.buttonText}>{paying ? 'Processing…' : 'Confirm booking'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  total,
  valueStyle,
}: {
  label: string;
  value: string;
  total?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, total && styles.rowLabelTotal]}>{label}</Text>
      <Text style={[styles.rowValue, total && styles.rowValueTotal, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#94a3b8' },
  heading: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4, textTransform: 'capitalize' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { color: '#64748b', fontSize: 14 },
  rowValue: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  rowLabelTotal: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  rowValueTotal: { color: '#4f46e5', fontWeight: '800', fontSize: 16 },
  discountText: { color: '#16a34a' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    borderWidth: 3,
    borderColor: '#c7d2fe',
  },
  methodLabel: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

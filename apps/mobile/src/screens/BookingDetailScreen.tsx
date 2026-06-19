import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import type { Booking } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fef9c3', fg: '#854d0e' },
  confirmed: { bg: '#dcfce7', fg: '#166534' },
  preparing: { bg: '#dbeafe', fg: '#1e3a8a' },
  ready: { bg: '#ede9fe', fg: '#5b21b6' },
  active: { bg: '#dbeafe', fg: '#1e40af' },
  completed: { bg: '#e2e8f0', fg: '#475569' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' },
  rejected: { bg: '#fee2e2', fg: '#991b1b' },
};

const CANCELLABLE = new Set(['pending', 'confirmed', 'preparing', 'ready']);

function vehicleName(booking: Booking): string {
  if (booking.vehicleId && typeof booking.vehicleId === 'object') {
    return booking.vehicleId.name;
  }
  return 'Vehicle';
}

export default function BookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickupCode, setPickupCode] = useState('');
  const [returnCode, setReturnCode] = useState('');
  const [redeemingPickup, setRedeemingPickup] = useState(false);
  const [redeemingReturn, setRedeemingReturn] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data.data as Booking);
    } catch {
      Alert.alert('Error', 'Could not load booking.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const redeemPickup = async () => {
    setRedeemingPickup(true);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/redeem-otp`, { code: pickupCode });
      setBooking(data.data as Booking);
      setPickupCode('');
      Alert.alert('Picked up!', 'Enjoy your ride.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Invalid code', msg ?? 'Please check the pickup code.');
    } finally {
      setRedeemingPickup(false);
    }
  };

  const redeemReturn = async () => {
    setRedeemingReturn(true);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/redeem-return-otp`, { code: returnCode });
      setBooking(data.data as Booking);
      setReturnCode('');
      Alert.alert('Returned!', 'Thank you for your booking.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Invalid code', msg ?? 'Please check the return code.');
    } finally {
      setRedeemingReturn(false);
    }
  };

  const cancel = () => {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const { data } = await api.post(`/bookings/${bookingId}/cancel`);
            setBooking(data.data as Booking);
          } catch (err: unknown) {
            const msg =
              err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            Alert.alert('Error', msg ?? 'Could not cancel booking.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
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
        <Text style={styles.errorText}>Booking not found.</Text>
      </View>
    );
  }

  const p = booking.pricing;
  const statusColor = STATUS_COLORS[booking.status];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{vehicleName(booking)}</Text>
        <Text
          style={[
            styles.badge,
            statusColor ? { backgroundColor: statusColor.bg, color: statusColor.fg } : null,
          ]}
        >
          {booking.status}
        </Text>
      </View>

      <Text style={styles.meta}>
        {new Date(booking.startDate).toLocaleDateString()} –{' '}
        {new Date(booking.endDate).toLocaleDateString()} · {booking.plan}
      </Text>

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

      {booking.status === 'ready' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Enter pickup code</Text>
          <Text style={styles.hint}>Get the pickup code from the service provider.</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Pickup code"
            value={pickupCode}
            onChangeText={setPickupCode}
            autoCapitalize="characters"
          />
          <Pressable
            style={[styles.actionButton, redeemingPickup && styles.buttonDisabled]}
            onPress={redeemPickup}
            disabled={redeemingPickup}
          >
            <Text style={styles.actionButtonText}>
              {redeemingPickup ? 'Redeeming…' : 'Confirm pickup'}
            </Text>
          </Pressable>
        </View>
      )}

      {booking.status === 'active' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Enter return code</Text>
          <Text style={styles.hint}>Get the return code from the service provider.</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Return code"
            value={returnCode}
            onChangeText={setReturnCode}
            autoCapitalize="characters"
          />
          <Pressable
            style={[styles.actionButton, redeemingReturn && styles.buttonDisabled]}
            onPress={redeemReturn}
            disabled={redeemingReturn}
          >
            <Text style={styles.actionButtonText}>
              {redeemingReturn ? 'Redeeming…' : 'Confirm return'}
            </Text>
          </Pressable>
        </View>
      )}

      {booking.status === 'completed' && (
        <Pressable
          style={styles.reviewButton}
          onPress={() => navigation.navigate('Review', { bookingId })}
        >
          <Text style={styles.reviewButtonText}>Leave a review</Text>
        </Pressable>
      )}

      {CANCELLABLE.has(booking.status) && (
        <Pressable
          style={[styles.cancelButton, cancelling && styles.buttonDisabled]}
          onPress={cancel}
          disabled={cancelling}
        >
          <Text style={styles.cancelButtonText}>
            {cancelling ? 'Cancelling…' : 'Cancel booking'}
          </Text>
        </Pressable>
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8 },
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
  meta: { color: '#64748b', fontSize: 14, textTransform: 'capitalize', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { color: '#64748b', fontSize: 14 },
  rowValue: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  rowLabelTotal: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  rowValueTotal: { color: '#4f46e5', fontWeight: '800', fontSize: 16 },
  discountText: { color: '#16a34a' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  hint: { color: '#64748b', fontSize: 13, marginBottom: 10 },
  codeInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  reviewButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
    marginBottom: 12,
  },
  cancelButtonText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});

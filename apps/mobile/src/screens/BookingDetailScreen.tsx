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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import type { Booking } from '../types';
import { colors, font, radius, spacing, shadow } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: 'rgba(244,196,48,0.18)', fg: colors.warning },
  confirmed: { bg: 'rgba(123,224,138,0.18)', fg: colors.success },
  preparing: { bg: 'rgba(127,183,255,0.18)', fg: colors.info },
  ready: { bg: 'rgba(210,243,76,0.18)', fg: colors.accent },
  active: { bg: 'rgba(127,183,255,0.18)', fg: colors.info },
  completed: { bg: 'rgba(155,160,141,0.18)', fg: colors.muted },
  cancelled: { bg: 'rgba(255,107,94,0.18)', fg: colors.danger },
  rejected: { bg: 'rgba(255,107,94,0.18)', fg: colors.danger },
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
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color={colors.accent} />
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
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
            placeholderTextColor={colors.muted}
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
            placeholderTextColor={colors.muted}
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
          style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
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
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  errorText: { color: colors.muted, fontFamily: font.regular, fontSize: font.size.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: font.size.xl,
    fontFamily: font.display,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
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
  meta: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.sm,
    textTransform: 'capitalize',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  sectionTitle: {
    fontSize: font.size.md,
    fontFamily: font.bold,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  rowLabel: { color: colors.muted, fontFamily: font.regular, fontSize: font.size.sm },
  rowValue: { color: colors.text, fontFamily: font.medium, fontSize: font.size.sm },
  rowLabelTotal: { color: colors.text, fontFamily: font.bold, fontWeight: '700', fontSize: font.size.md },
  rowValueTotal: { color: colors.accent, fontFamily: font.bold, fontWeight: '700', fontSize: font.size.md },
  discountText: { color: colors.success },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  hint: { color: colors.muted, fontFamily: font.regular, fontSize: font.size.sm, marginBottom: spacing.md },
  codeInput: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: font.size.md,
    fontFamily: font.medium,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.onAccent,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.md,
  },
  buttonDisabled: { opacity: 0.45 },
  reviewButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  reviewButtonText: {
    color: colors.accent,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.md,
  },
  cancelButton: {
    backgroundColor: colors.transparent,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.md,
  },
  cancelButtonDisabled: { opacity: 0.45 },
  cancelButtonText: {
    color: colors.danger,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.md,
  },
});

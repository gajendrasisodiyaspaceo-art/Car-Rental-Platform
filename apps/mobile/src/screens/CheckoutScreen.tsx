import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import type { Booking } from '../types';
import { colors, spacing, radius, font } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

function vehicleName(booking: Booking): string {
  if (booking.vehicleId && typeof booking.vehicleId === 'object') {
    return booking.vehicleId.name;
  }
  return 'Vehicle';
}

export default function CheckoutScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color={colors.accent} />
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
    >
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

      <PrimaryButton
        label={paying ? 'Processing…' : 'Confirm booking'}
        onPress={onConfirm}
        loading={paying}
        disabled={paying}
        chevrons
        style={styles.button}
      />
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
  heading: {
    fontSize: font.size.xxl,
    fontFamily: font.display,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: font.size.lg, fontFamily: font.bold, fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, marginTop: spacing.xs, textTransform: 'capitalize', fontSize: font.size.sm },
  sectionTitle: {
    fontSize: font.size.md,
    fontFamily: font.bold,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  rowLabel: { color: colors.muted, fontSize: font.size.sm },
  rowValue: { color: colors.text, fontSize: font.size.sm, fontFamily: font.medium, fontWeight: '600' },
  rowLabelTotal: { color: colors.text, fontFamily: font.bold, fontWeight: '700', fontSize: font.size.md },
  rowValueTotal: { color: colors.accent, fontFamily: font.bold, fontWeight: '800', fontSize: font.size.md },
  discountText: { color: colors.success },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.onAccent,
  },
  methodLabel: { fontSize: font.size.md, fontFamily: font.bold, color: colors.text, fontWeight: '600' },
  button: { marginTop: spacing.sm },
});

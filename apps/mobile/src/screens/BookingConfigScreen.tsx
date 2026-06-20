import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import type { Booking } from '../types';
import { colors, spacing, radius, font } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfig'>;

type Plan = 'daily' | 'weekly' | 'monthly';

const EXTRAS_CATALOG: { key: string; label: string; pricePerDay: number }[] = [
  { key: 'gps', label: 'GPS', pricePerDay: 5 },
  { key: 'child_seat', label: 'Child seat', pricePerDay: 7 },
  { key: 'additional_driver', label: 'Additional driver', pricePerDay: 10 },
  { key: 'insurance', label: 'Insurance', pricePerDay: 15 },
];

const DISCOUNT_RATES: Record<string, number> = {
  WELCOME10: 0.1,
  SUMMER20: 0.2,
};

function diffDays(start: Date, end: Date): number {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

function calcBase(dailyRate: number, weekly: number | undefined, monthly: number | undefined, plan: Plan, days: number): number {
  if (plan === 'weekly' && weekly) return (weekly / 7) * days;
  if (plan === 'monthly' && monthly) return (monthly / 30) * days;
  return dailyRate * days;
}

export default function BookingConfigScreen({ route, navigation }: Props) {
  const { vehicle } = route.params;

  const tomorrow = new Date(Date.now() + 86_400_000);
  const dayAfter = new Date(Date.now() + 2 * 86_400_000);

  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(dayAfter);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [plan, setPlan] = useState<Plan>('daily');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const days = diffDays(startDate, endDate);
  const baseAmount = calcBase(vehicle.pricing.daily, vehicle.pricing.weekly, vehicle.pricing.monthly, plan, days);
  const extrasAmount = selectedExtras.reduce((sum, key) => {
    const item = EXTRAS_CATALOG.find((e) => e.key === key);
    return sum + (item ? item.pricePerDay * days : 0);
  }, 0);
  const discountRate = DISCOUNT_RATES[discountCode.toUpperCase()] ?? 0;
  const discountAmount = baseAmount * discountRate;
  const taxAmount = (baseAmount + extrasAmount - discountAmount) * 0.05;
  const total = baseAmount + extrasAmount - discountAmount + taxAmount;

  useEffect(() => {
    if (endDate <= startDate) {
      setEndDate(new Date(startDate.getTime() + 86_400_000));
    }
  }, [startDate]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      setCheckingAvail(true);
      try {
        const { data } = await api.get(`/vehicles/${vehicle._id}/availability`, {
          params: { from: startDate.toISOString(), to: endDate.toISOString() },
        });
        if (!cancelled) setAvailable(data.data?.available ?? true);
      } catch {
        if (!cancelled) setAvailable(null);
      } finally {
        if (!cancelled) setCheckingAvail(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [startDate, endDate, vehicle._id]);

  const toggleExtra = (key: string) => {
    setSelectedExtras((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key],
    );
  };

  const handleStartChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowStart(false);
    if (date) setStartDate(date);
  };

  const handleEndChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowEnd(false);
    if (date) setEndDate(date);
  };

  const onContinue = async () => {
    if (available === false) {
      Alert.alert('Unavailable', 'The vehicle is not available for the selected dates.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: {
        vehicleId: string;
        startDate: string;
        endDate: string;
        plan: Plan;
        extras?: string[];
        discountCode?: string;
      } = {
        vehicleId: vehicle._id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        plan,
      };
      if (selectedExtras.length) payload.extras = selectedExtras;
      if (discountCode.trim()) payload.discountCode = discountCode.trim().toUpperCase();

      const { data } = await api.post('/bookings', payload);
      const booking = data.data as Booking;
      navigation.navigate('Checkout', { bookingId: booking._id });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Booking failed', msg ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAvailability = () => {
    if (checkingAvail) return <Text style={styles.availChecking}>Checking availability…</Text>;
    if (available === true) return <Text style={styles.availOk}>Available for selected dates</Text>;
    if (available === false) return <Text style={styles.availNo}>Not available for selected dates</Text>;
    return null;
  };

  const plans: Plan[] = ['daily', 'weekly', 'monthly'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Select dates</Text>

      <View style={styles.dateRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>From</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowStart(true)}>
            <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
          </Pressable>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>To</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowEnd(true)}>
            <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
          </Pressable>
        </View>
      </View>

      {showStart && (
        <DateTimePicker
          value={startDate}
          mode="date"
          minimumDate={new Date()}
          onChange={handleStartChange}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      )}
      {showEnd && (
        <DateTimePicker
          value={endDate}
          mode="date"
          minimumDate={new Date(startDate.getTime() + 86_400_000)}
          onChange={handleEndChange}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      )}

      <Text style={styles.daysText}>{days} day{days !== 1 ? 's' : ''}</Text>
      {renderAvailability()}

      <Text style={[styles.sectionTitle, styles.mt20]}>Rental plan</Text>
      <View style={styles.chipRow}>
        {plans.map((p) => (
          <Pressable
            key={p}
            style={[styles.chip, plan === p && styles.chipActive]}
            onPress={() => setPlan(p)}
          >
            <Text style={[styles.chipText, plan === p && styles.chipTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, styles.mt20]}>Extras</Text>
      <View style={styles.chipRow}>
        {EXTRAS_CATALOG.map((item) => {
          const active = selectedExtras.includes(item.key);
          return (
            <Pressable
              key={item.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleExtra(item.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.label} +${item.pricePerDay}/day
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, styles.mt20]}>Discount code</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. WELCOME10"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
        value={discountCode}
        onChangeText={setDiscountCode}
      />

      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>Estimated price</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Base ({plan}, {days}d)</Text>
          <Text style={styles.breakdownValue}>{vehicle.currency} {baseAmount.toFixed(2)}</Text>
        </View>
        {extrasAmount > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Extras</Text>
            <Text style={styles.breakdownValue}>{vehicle.currency} {extrasAmount.toFixed(2)}</Text>
          </View>
        )}
        {discountAmount > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Discount ({Math.round(discountRate * 100)}%)</Text>
            <Text style={[styles.breakdownValue, styles.discount]}>
              −{vehicle.currency} {discountAmount.toFixed(2)}
            </Text>
          </View>
        )}
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Tax (5%)</Text>
          <Text style={styles.breakdownValue}>{vehicle.currency} {taxAmount.toFixed(2)}</Text>
        </View>
        <View style={[styles.breakdownRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{vehicle.currency} {total.toFixed(2)}</Text>
        </View>
      </View>

      <PrimaryButton
        label={submitting ? 'Creating booking…' : 'Continue to checkout'}
        onPress={onContinue}
        loading={submitting}
        disabled={submitting || available === false}
        chevrons
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl + 8 },
  sectionTitle: {
    fontSize: font.size.md,
    fontFamily: font.bold,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  mt20: { marginTop: spacing.xl },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  dateBlock: { flex: 1 },
  dateLabel: {
    fontSize: font.size.xs,
    fontFamily: font.medium,
    color: colors.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateButton: {
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  dateText: {
    color: colors.text,
    fontFamily: font.medium,
    fontWeight: '600',
    fontSize: font.size.md,
  },
  daysText: { marginTop: spacing.sm, color: colors.muted, fontSize: font.size.sm },
  availChecking: { color: colors.muted, fontSize: font.size.sm, marginTop: spacing.xs },
  availOk: { color: colors.success, fontSize: font.size.sm, marginTop: spacing.xs, fontFamily: font.bold, fontWeight: '600' },
  availNo: { color: colors.danger, fontSize: font.size.sm, marginTop: spacing.xs, fontFamily: font.bold, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    backgroundColor: colors.raised,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: font.size.sm, fontFamily: font.bold, fontWeight: '600' },
  chipTextActive: { color: colors.onAccent },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.lg,
    fontSize: font.size.md,
    fontFamily: font.medium,
    color: colors.text,
  },
  breakdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownTitle: {
    fontSize: font.size.md,
    fontFamily: font.bold,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  breakdownLabel: { color: colors.muted, fontSize: font.size.sm },
  breakdownValue: { color: colors.text, fontSize: font.size.sm, fontFamily: font.medium, fontWeight: '600' },
  discount: { color: colors.success },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.md },
  totalLabel: { fontSize: font.size.lg, fontFamily: font.bold, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: font.size.lg, fontFamily: font.bold, fontWeight: '800', color: colors.accent },
  button: { marginTop: spacing.xxl },
});

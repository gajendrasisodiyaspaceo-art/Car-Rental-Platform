import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../api/client';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import type { RootStackParamList } from '../navigation/types';
import type { User, Address, DrivingLicense, Discount } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

interface ProfileData {
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  addresses: Address[];
}

const emptyAddress = (): Address => ({
  label: '',
  line1: '',
  city: '',
  country: '',
  isDefault: false,
});

export default function ProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const [form, setForm] = useState<ProfileData>({
    name: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    addresses: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, discountsRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/discounts/active'),
      ]);

      if (profileRes.status === 'fulfilled') {
        const u = profileRes.value.data.data as User;
        setUser(u);
        setForm({
          name: u.name ?? '',
          phone: u.phone ?? '',
          licenseNumber: u.drivingLicense?.number ?? '',
          licenseExpiry: u.drivingLicense?.expiry ?? '',
          addresses: u.addresses ? u.addresses.map((a) => ({ ...a })) : [],
        });
      }

      if (discountsRes.status === 'fulfilled') {
        setDiscounts(discountsRes.value.data.data as Discount[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload: {
        name?: string;
        phone?: string;
        drivingLicense?: DrivingLicense;
        addresses?: Address[];
      } = {};

      if (form.name.trim()) payload.name = form.name.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();

      if (form.licenseNumber.trim()) {
        payload.drivingLicense = { number: form.licenseNumber.trim() };
        if (form.licenseExpiry.trim()) payload.drivingLicense.expiry = form.licenseExpiry.trim();
      }

      const validAddresses = form.addresses.filter((a) => a.line1.trim());
      if (validAddresses.length > 0) payload.addresses = validAddresses;

      const { data } = await api.put('/auth/me', payload);
      setUser(data.data as User);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Error', msg ?? 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const addAddress = () => {
    setForm((f) => ({ ...f, addresses: [...f.addresses, emptyAddress()] }));
  };

  const removeAddress = (index: number) => {
    setForm((f) => ({
      ...f,
      addresses: f.addresses.filter((_, i) => i !== index),
    }));
  };

  const updateAddress = (index: number, field: keyof Address, value: string | boolean) => {
    setForm((f) => {
      const next = f.addresses.map((a, i) => (i === index ? { ...a, [field]: value } : a));
      return { ...f, addresses: next };
    });
  };

  const setDefaultAddress = (index: number) => {
    setForm((f) => ({
      ...f,
      addresses: f.addresses.map((a, i) => ({ ...a, isDefault: i === index })),
    }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Loyalty points banner */}
      <View style={styles.loyaltyCard}>
        <Text style={styles.loyaltyLabel}>Loyalty points</Text>
        <Text style={styles.loyaltyPoints}>{user?.loyaltyPoints ?? 0}</Text>
        <Text style={styles.loyaltySub}>Earn points with every booking</Text>
      </View>

      {/* Active promos */}
      {discounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active promo offers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promoScroll}>
            {discounts.map((d) => (
              <View key={d.code} style={styles.promoCard}>
                <Text style={styles.promoCode}>{d.code}</Text>
                <Text style={styles.promoValue}>
                  {d.type === 'percent' ? `${d.value}% off` : `$${d.value} off`}
                </Text>
                {d.expiresAt && (
                  <Text style={styles.promoExpiry}>
                    Until {new Date(d.expiresAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Personal info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal info</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldReadOnly}>{user?.email}</Text>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Full name"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+1 555 000 0000"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Driving license */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driving license</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>License number</Text>
          <TextInput
            style={styles.input}
            value={form.licenseNumber}
            onChangeText={(v) => setForm((f) => ({ ...f, licenseNumber: v }))}
            placeholder="e.g. DL-123456"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
          />

          <Text style={styles.fieldLabel}>Expiry date</Text>
          <TextInput
            style={styles.input}
            value={form.licenseExpiry}
            onChangeText={(v) => setForm((f) => ({ ...f, licenseExpiry: v }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Address book */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <Pressable style={styles.addBtn} onPress={addAddress}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        </View>

        {form.addresses.map((addr, idx) => (
          <View key={idx} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressIndex}>Address {idx + 1}</Text>
              <View style={styles.addressActions}>
                {!addr.isDefault && (
                  <Pressable onPress={() => setDefaultAddress(idx)} hitSlop={8}>
                    <Text style={styles.setDefaultText}>Set default</Text>
                  </Pressable>
                )}
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
                <Pressable onPress={() => removeAddress(idx)} hitSlop={8}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              style={styles.input}
              value={addr.label ?? ''}
              onChangeText={(v) => updateAddress(idx, 'label', v)}
              placeholder="Label (e.g. Home, Work)"
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              style={styles.input}
              value={addr.line1}
              onChangeText={(v) => updateAddress(idx, 'line1', v)}
              placeholder="Street address *"
              placeholderTextColor="#94a3b8"
            />
            <View style={styles.twoCol}>
              <TextInput
                style={[styles.input, styles.flex1]}
                value={addr.city ?? ''}
                onChangeText={(v) => updateAddress(idx, 'city', v)}
                placeholder="City"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                value={addr.country ?? ''}
                onChangeText={(v) => updateAddress(idx, 'country', v)}
                placeholder="Country"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        ))}
      </View>

      {/* Account actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.actionRow}
            onPress={() => navigation.navigate('Bookings')}
          >
            <Text style={styles.actionLabel}>My bookings</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.actionRow}
            onPress={() => navigation.navigate('VerifyOtp')}
          >
            <Text style={styles.actionLabel}>Verify account</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.actionRow}
            onPress={() => dispatch(logout())}
          >
            <Text style={[styles.actionLabel, styles.logoutLabel]}>Log out</Text>
          </Pressable>
        </View>
      </View>

      {/* Save button */}
      <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  loyaltyCard: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  loyaltyLabel: { color: '#c7d2fe', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  loyaltyPoints: { color: '#fff', fontSize: 40, fontWeight: '800' },
  loyaltySub: { color: '#a5b4fc', fontSize: 12, marginTop: 4 },

  promoScroll: { marginTop: 8 },
  promoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    minWidth: 130,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  promoCode: { fontSize: 16, fontWeight: '800', color: '#4f46e5' },
  promoValue: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginTop: 4 },
  promoExpiry: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  section: { marginBottom: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 10, marginBottom: 4 },
  fieldReadOnly: { fontSize: 15, color: '#334155', marginBottom: 4 },

  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },

  addBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },

  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressIndex: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  addressActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  setDefaultText: { fontSize: 12, color: '#4f46e5', fontWeight: '600' },
  defaultBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 11, color: '#166534', fontWeight: '700' },
  removeText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },

  twoCol: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  actionLabel: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  actionChevron: { fontSize: 18, color: '#94a3b8' },
  logoutLabel: { color: '#dc2626' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: '#a5b4fc' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

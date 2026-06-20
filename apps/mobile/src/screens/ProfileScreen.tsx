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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useTabBarClearance } from '../navigation/useTabBarClearance';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/authSlice';
import type { RootStackParamList } from '../navigation/types';
import type { User, Address, DrivingLicense, Discount } from '../types';
import { useT } from '../i18n/useT';
import { useTheme } from '../theme/ThemeContext';
import { colors, spacing, radius, font, shadow } from '../theme/tokens';

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
  const { t, lang, setLang } = useT();
  const { appName } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarClearance = useTabBarClearance();

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
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: tabBarClearance },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* App name header */}
      <Text style={styles.appNameHeader}>{appName}</Text>

      {/* Language switcher */}
      <View style={styles.langRow}>
        <Text style={styles.langLabel}>{t('language')}:</Text>
        <Pressable
          style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
          onPress={() => void setLang('en')}
        >
          <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>
            {t('langEn')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.langBtn, lang === 'ar' && styles.langBtnActive]}
          onPress={() => void setLang('ar')}
        >
          <Text style={[styles.langBtnText, lang === 'ar' && styles.langBtnTextActive]}>
            {t('langAr')}
          </Text>
        </Pressable>
      </View>

      {/* Loyalty points banner — lime accent card */}
      <View style={styles.loyaltyCard}>
        <Text style={styles.loyaltyLabel}>{t('loyaltyPoints')}</Text>
        <Text style={styles.loyaltyPoints}>{user?.loyaltyPoints ?? 0}</Text>
        <Text style={styles.loyaltySub}>{t('loyaltySub')}</Text>
      </View>

      {/* Active promos */}
      {discounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('activePromos')}</Text>
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
        <Text style={styles.sectionTitle}>{t('personalInfo')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('email')}</Text>
          <Text style={styles.fieldReadOnly}>{user?.email}</Text>

          <Text style={styles.fieldLabel}>{t('name')}</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
          />

          <Text style={styles.fieldLabel}>{t('phone')}</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+1 555 000 0000"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            selectionColor={colors.accent}
          />
        </View>
      </View>

      {/* Driving license */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('drivingLicense')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('licenseNumber')}</Text>
          <TextInput
            style={styles.input}
            value={form.licenseNumber}
            onChangeText={(v) => setForm((f) => ({ ...f, licenseNumber: v }))}
            placeholder="e.g. DL-123456"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            selectionColor={colors.accent}
          />

          <Text style={styles.fieldLabel}>{t('licenseExpiry')}</Text>
          <TextInput
            style={styles.input}
            value={form.licenseExpiry}
            onChangeText={(v) => setForm((f) => ({ ...f, licenseExpiry: v }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
          />
        </View>
      </View>

      {/* Address book */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('addresses')}</Text>
          <Pressable style={styles.addBtn} onPress={addAddress}>
            <Text style={styles.addBtnText}>{t('addAddress')}</Text>
          </Pressable>
        </View>

        {form.addresses.map((addr, idx) => (
          <View key={idx} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressIndex}>{t('addressLabel')} {idx + 1}</Text>
              <View style={styles.addressActions}>
                {!addr.isDefault && (
                  <Pressable onPress={() => setDefaultAddress(idx)} hitSlop={8}>
                    <Text style={styles.setDefaultText}>{t('setDefault')}</Text>
                  </Pressable>
                )}
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>{t('default')}</Text>
                  </View>
                )}
                <Pressable onPress={() => removeAddress(idx)} hitSlop={8}>
                  <Text style={styles.removeText}>{t('remove')}</Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              style={styles.input}
              value={addr.label ?? ''}
              onChangeText={(v) => updateAddress(idx, 'label', v)}
              placeholder="Label (e.g. Home, Work)"
              placeholderTextColor={colors.muted}
              selectionColor={colors.accent}
            />
            <TextInput
              style={styles.input}
              value={addr.line1}
              onChangeText={(v) => updateAddress(idx, 'line1', v)}
              placeholder="Street address *"
              placeholderTextColor={colors.muted}
              selectionColor={colors.accent}
            />
            <View style={styles.twoCol}>
              <TextInput
                style={[styles.input, styles.flex1]}
                value={addr.city ?? ''}
                onChangeText={(v) => updateAddress(idx, 'city', v)}
                placeholder="City"
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                value={addr.country ?? ''}
                onChangeText={(v) => updateAddress(idx, 'country', v)}
                placeholder="Country"
                placeholderTextColor={colors.muted}
                selectionColor={colors.accent}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Account actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account')}</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.actionRow}
            onPress={() => navigation.navigate('Bookings')}
          >
            <Text style={styles.actionLabel}>{t('myBookings')}</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.actionRow}
            onPress={() => navigation.navigate('VerifyOtp')}
          >
            <Text style={styles.actionLabel}>{t('verifyAccount')}</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.actionRow}
            onPress={() => dispatch(logout())}
          >
            <Text style={[styles.actionLabel, styles.logoutLabel]}>{t('logout')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Save button */}
      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? t('saving') : t('save')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

  appNameHeader: {
    fontSize: font.size.xs,
    fontFamily: font.bold,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  langLabel: { fontSize: font.size.sm, color: colors.muted, fontFamily: font.medium, fontWeight: '600' },
  langBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  langBtnText: { fontSize: font.size.sm, fontFamily: font.medium, fontWeight: '600', color: colors.muted },
  langBtnTextActive: { color: colors.onAccent },

  loyaltyCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.accent,
    ...shadow.accent,
  },
  loyaltyLabel: {
    color: colors.onAccent,
    fontSize: font.size.sm,
    fontFamily: font.bold,
    fontWeight: '700',
    marginBottom: spacing.xs,
    opacity: 0.75,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loyaltyPoints: {
    color: colors.onAccent,
    fontSize: 44,
    fontFamily: font.display,
    fontWeight: '800',
    lineHeight: 52,
  },
  loyaltySub: {
    color: colors.onAccent,
    fontSize: font.size.xs,
    fontFamily: font.regular,
    marginTop: spacing.xs,
    opacity: 0.65,
  },

  promoScroll: { marginTop: spacing.sm },
  promoCard: {
    backgroundColor: colors.raised,
    borderRadius: radius.md,
    padding: spacing.md,
    marginRight: spacing.md,
    minWidth: 130,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  promoCode: {
    fontSize: font.size.lg,
    fontFamily: font.bold,
    fontWeight: '800',
    color: colors.accent,
  },
  promoValue: {
    fontSize: font.size.sm,
    fontFamily: font.medium,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  promoExpiry: {
    fontSize: font.size.xs,
    color: colors.muted,
    fontFamily: font.regular,
    marginTop: spacing.xs,
  },

  section: { marginBottom: spacing.xl },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.size.md,
    fontFamily: font.bold,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },

  fieldLabel: {
    fontSize: font.size.xs,
    fontFamily: font.medium,
    fontWeight: '600',
    color: colors.muted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldReadOnly: {
    fontSize: font.size.md,
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  input: {
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: font.size.md,
    fontFamily: font.regular,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  addBtn: {
    backgroundColor: 'rgba(210,243,76,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  addBtnText: {
    color: colors.accent,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.sm,
  },

  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addressIndex: {
    fontSize: font.size.sm,
    fontFamily: font.bold,
    fontWeight: '700',
    color: colors.text,
  },
  addressActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  setDefaultText: {
    fontSize: font.size.xs,
    color: colors.accent,
    fontFamily: font.medium,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: 'rgba(210,243,76,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  defaultBadgeText: {
    fontSize: font.size.xs,
    color: colors.accent,
    fontFamily: font.bold,
    fontWeight: '700',
  },
  removeText: {
    fontSize: font.size.xs,
    color: colors.danger,
    fontFamily: font.medium,
    fontWeight: '600',
  },

  twoCol: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md + 1,
  },
  actionLabel: {
    fontSize: font.size.md,
    color: colors.text,
    fontFamily: font.medium,
    fontWeight: '500',
  },
  actionChevron: { fontSize: 20, color: colors.muted },
  logoutLabel: { color: colors.danger },
  divider: { height: 1, backgroundColor: colors.border },

  saveBtn: {
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xs,
    backgroundColor: colors.accent,
    minHeight: 56,
    ...shadow.accent,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    color: colors.onAccent,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.lg,
  },
});

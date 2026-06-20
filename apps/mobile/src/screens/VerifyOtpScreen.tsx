import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAppSelector } from '../store';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, radius, spacing } from '../theme/tokens';

export default function VerifyOtpScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const insets = useSafeAreaInsets();

  const onSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Not logged in.');
      return;
    }
    if (code.length !== 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { userId: user.id, code });
      Alert.alert('Account verified', 'Your account is now verified!');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Verification failed', msg ?? 'Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <Text style={styles.title}>Verify your account</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your email.{'\n'}
          <Text style={styles.devHint}>(dev: check server console for the code)</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="— — — — — —"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          selectionColor={colors.accent}
        />

        <PrimaryButton
          label={loading ? 'Verifying…' : 'Verify'}
          onPress={onSubmit}
          loading={loading}
          chevrons
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: font.size.xxl,
    fontFamily: font.display,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: font.size.sm,
    fontFamily: font.regular,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  devHint: {
    color: colors.muted,
    fontStyle: 'italic',
    fontSize: font.size.xs,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 26,
    fontFamily: font.bold,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
    color: colors.accent,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});

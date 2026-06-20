import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store';
import { login } from '../store/authSlice';
import type { RootStackParamList } from '../navigation/types';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, radius, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('customer@demo.io');
  const [password, setPassword] = useState('password123');
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { status, error } = useAppSelector((s) => s.auth);

  const onSubmit = () => {
    dispatch(login({ email, password }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.md,
          },
        ]}
      >
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to book your next ride</Text>

        <View style={styles.fieldGroup}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            selectionColor={colors.accent}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            selectionColor={colors.accent}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label={status === 'loading' ? 'Signing in…' : 'Sign in'}
          onPress={onSubmit}
          loading={status === 'loading'}
          chevrons
          style={styles.button}
        />

        <Text style={styles.hint}>Demo: customer@demo.io / password123</Text>

        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.linkRow}>
          <Text style={styles.link}>Don't have an account?{' '}
            <Text style={styles.linkAccent}>Sign up</Text>
          </Text>
        </Pressable>
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
    fontSize: font.size.xxxl,
    fontFamily: font.display,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: font.size.md,
    fontFamily: font.regular,
    color: colors.muted,
    marginBottom: spacing.xxl,
  },
  fieldGroup: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: font.size.md,
    fontFamily: font.regular,
    color: colors.text,
  },
  button: {
    marginTop: spacing.md,
  },
  error: {
    color: colors.danger,
    fontFamily: font.regular,
    fontSize: font.size.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.xs,
    marginTop: spacing.xl,
  },
  linkRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  link: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.sm,
  },
  linkAccent: {
    color: colors.accent,
    fontFamily: font.bold,
    fontWeight: '700',
  },
});

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store';
import { register } from '../store/authSlice';
import type { RootStackParamList } from '../navigation/types';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, radius, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { status, error } = useAppSelector((s) => s.auth);

  const onSubmit = () => {
    dispatch(register({ name, email, password, phone: phone || undefined }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + spacing.xxxl,
            paddingBottom: insets.bottom + spacing.xxxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Sign up to start booking</Text>

        <View style={styles.fieldGroup}>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            selectionColor={colors.accent}
          />
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
          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            selectionColor={colors.accent}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label={status === 'loading' ? 'Creating account…' : 'Sign up'}
          onPress={onSubmit}
          loading={status === 'loading'}
          chevrons
          style={styles.button}
        />

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
          <Text style={styles.link}>Have an account?{' '}
            <Text style={styles.linkAccent}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
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

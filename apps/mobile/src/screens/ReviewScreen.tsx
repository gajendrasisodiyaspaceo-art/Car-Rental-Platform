import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { colors, font, radius, spacing, shadow } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (rating < 1) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/bookings/${bookingId}/review`, {
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Review submitted', 'Thank you for your feedback!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      Alert.alert('Failed', msg ?? 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = submitting || rating < 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.xxl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Leave a review</Text>
      <Text style={styles.subtitle}>How was your experience?</Text>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.ratingLabel}>
        {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Tap to rate'}
      </Text>

      <View style={styles.textareaWrapper}>
        <TextInput
          style={styles.textarea}
          placeholder="Share your experience (optional)"
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />
      </View>

      <Pressable
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={isDisabled}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'Submitting…' : 'Submit review'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xxl },
  title: {
    fontSize: font.size.xxl,
    fontFamily: font.display,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: font.size.md,
    fontFamily: font.regular,
    color: colors.muted,
    marginBottom: spacing.xxxl,
  },
  starsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  star: { fontSize: 40, color: colors.border },
  starActive: { color: colors.gold },
  ratingLabel: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: font.size.sm,
    marginBottom: spacing.xl,
  },
  textareaWrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  textarea: {
    padding: spacing.lg,
    fontSize: font.size.md,
    fontFamily: font.regular,
    color: colors.text,
    minHeight: 120,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: colors.onAccent,
    fontFamily: font.bold,
    fontWeight: '700',
    fontSize: font.size.lg,
  },
});

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
import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

      <TextInput
        style={styles.textarea}
        placeholder="Share your experience (optional)"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={comment}
        onChangeText={setComment}
      />

      <Pressable
        style={[styles.button, (submitting || rating < 1) && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={submitting || rating < 1}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'Submitting…' : 'Submit review'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 28 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  star: { fontSize: 40, color: '#cbd5e1' },
  starActive: { color: '#f59e0b' },
  ratingLabel: { color: '#64748b', fontSize: 13, marginBottom: 20 },
  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

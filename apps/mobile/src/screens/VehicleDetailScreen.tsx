import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

export default function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicle } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: vehicle.images[0] ?? 'https://placehold.co/800x500?text=Car' }}
        style={styles.image}
      />
      <View style={styles.body}>
        <Text style={styles.name}>{vehicle.name}</Text>
        <Text style={styles.meta}>
          {vehicle.transmission} · {vehicle.fuelType}
          {vehicle.seats ? ` · ${vehicle.seats} seats` : ''}
        </Text>
        <Text style={styles.price}>
          {vehicle.currency} {vehicle.pricing.daily} <Text style={styles.perDay}>/ day</Text>
        </Text>

        {vehicle.rating && vehicle.rating.count > 0 ? (
          <Text style={styles.rating}>
            ★ {vehicle.rating.average.toFixed(1)}{' '}
            <Text style={styles.ratingCount}>({vehicle.rating.count} reviews)</Text>
          </Text>
        ) : null}

        {vehicle.features.length > 0 && (
          <View style={styles.features}>
            <Text style={styles.sectionTitle}>Features</Text>
            {vehicle.features.map((f) => (
              <Text key={f} style={styles.feature}>
                • {f}
              </Text>
            ))}
          </View>
        )}

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('BookingConfig', { vehicle })}
        >
          <Text style={styles.buttonText}>Book this vehicle</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 240, backgroundColor: '#e2e8f0' },
  body: { padding: 20 },
  name: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 6, textTransform: 'capitalize' },
  price: { fontSize: 20, fontWeight: '700', color: '#4f46e5', marginTop: 12 },
  perDay: { fontSize: 14, fontWeight: '400', color: '#64748b' },
  rating: { fontSize: 15, color: '#f59e0b', fontWeight: '700', marginTop: 8 },
  ratingCount: { color: '#94a3b8', fontWeight: '400', fontSize: 13 },
  features: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  feature: { color: '#334155', marginBottom: 4 },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

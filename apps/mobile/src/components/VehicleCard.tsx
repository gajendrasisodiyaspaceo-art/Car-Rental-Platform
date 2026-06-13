import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { Vehicle } from '../types';

interface Props {
  vehicle: Vehicle;
  onPress: () => void;
}

export default function VehicleCard({ vehicle, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: vehicle.images[0] ?? 'https://placehold.co/600x400?text=Car' }}
        style={styles.image}
      />
      <View style={styles.body}>
        <Text style={styles.name}>{vehicle.name}</Text>
        <Text style={styles.meta}>
          {vehicle.transmission} · {vehicle.fuelType}
          {vehicle.seats ? ` · ${vehicle.seats} seats` : ''}
        </Text>
        <Text style={styles.price}>
          {vehicle.currency} {vehicle.pricing.daily}
          <Text style={styles.perDay}> / day</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { width: '100%', height: 160, backgroundColor: '#e2e8f0' },
  body: { padding: 14 },
  name: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  meta: { marginTop: 4, color: '#64748b', fontSize: 13, textTransform: 'capitalize' },
  price: { marginTop: 8, fontSize: 16, fontWeight: '700', color: '#4f46e5' },
  perDay: { fontSize: 13, fontWeight: '400', color: '#64748b' },
});

import { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchVehicles } from '../store/vehiclesSlice';
import VehicleCard from '../components/VehicleCard';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.vehicles);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl
          refreshing={status === 'loading'}
          onRefresh={() => dispatch(fetchVehicles())}
        />
      }
      ListHeaderComponent={<Text style={styles.heading}>Available vehicles</Text>}
      ListEmptyComponent={
        status !== 'loading' ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No vehicles available right now.</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <VehicleCard
          vehicle={item}
          onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16 },
  heading: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  empty: { paddingVertical: 64, alignItems: 'center' },
  emptyText: { color: '#94a3b8' },
});

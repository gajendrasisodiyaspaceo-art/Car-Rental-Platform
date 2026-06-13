import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { restoreSession, logout } from '../store/authSlice';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import BookingsScreen from '../screens/BookingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={{ color: '#4f46e5', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '700' } }}>
        {token ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={({ navigation }) => ({
                title: 'Find a car',
                headerRight: () => (
                  <HeaderButton label="Bookings" onPress={() => navigation.navigate('Bookings')} />
                ),
                headerLeft: () => (
                  <HeaderButton label="Logout" onPress={() => dispatch(logout())} />
                ),
              })}
            />
            <Stack.Screen
              name="VehicleDetail"
              component={VehicleDetailScreen}
              options={{ title: 'Vehicle' }}
            />
            <Stack.Screen
              name="Bookings"
              component={BookingsScreen}
              options={{ title: 'My bookings' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

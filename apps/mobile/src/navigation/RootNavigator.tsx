import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { restoreSession, logout } from '../store/authSlice';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import BookingsScreen from '../screens/BookingsScreen';
import BookingConfigScreen from '../screens/BookingConfigScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
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
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <HeaderButton label="Verify" onPress={() => navigation.navigate('VerifyOtp')} />
                    <HeaderButton label="Bookings" onPress={() => navigation.navigate('Bookings')} />
                  </View>
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
              name="BookingConfig"
              component={BookingConfigScreen}
              options={{ title: 'Book vehicle' }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ title: 'Checkout' }}
            />
            <Stack.Screen
              name="Bookings"
              component={BookingsScreen}
              options={{ title: 'My bookings' }}
            />
            <Stack.Screen
              name="BookingDetail"
              component={BookingDetailScreen}
              options={{ title: 'Booking detail' }}
            />
            <Stack.Screen
              name="Review"
              component={ReviewScreen}
              options={{ title: 'Leave a review' }}
            />
            <Stack.Screen
              name="VerifyOtp"
              component={VerifyOtpScreen}
              options={{ title: 'Verify account' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

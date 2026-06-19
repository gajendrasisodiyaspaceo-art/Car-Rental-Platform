import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { restoreSession, logout } from '../store/authSlice';
import { api } from '../api/client';
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
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={{ color: '#4f46e5', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function BellButton({ onPress, unread }: { onPress: () => void; unread: number }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ marginRight: 4 }}>
      <View>
        <Text style={{ fontSize: 20 }}>🔔</Text>
        {unread > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -6,
              backgroundColor: '#dc2626',
              borderRadius: 999,
              minWidth: 16,
              height: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
              {unread > 99 ? '99+' : unread}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/notifications');
      const meta = data.meta as { unread: number } | undefined;
      setUnreadCount(meta?.unread ?? 0);
    } catch {
      // silently ignore — badge is non-critical
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    void fetchUnread();
    pollRef.current = setInterval(() => { void fetchUnread(); }, 60_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token, fetchUnread]);

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
                  <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                    <BellButton
                      unread={unreadCount}
                      onPress={() => {
                        setUnreadCount(0);
                        navigation.navigate('Notifications');
                      }}
                    />
                    <HeaderButton label="Profile" onPress={() => navigation.navigate('Profile')} />
                  </View>
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
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications' }}
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

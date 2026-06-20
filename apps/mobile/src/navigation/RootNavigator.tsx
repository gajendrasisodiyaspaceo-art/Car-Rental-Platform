import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppDispatch, useAppSelector } from '../store';
import { restoreSession } from '../store/authSlice';
import { hydrateFavorites } from '../store/favoritesSlice';
import { api } from '../api/client';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CarListScreen from '../screens/CarListScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import BookingsScreen from '../screens/BookingsScreen';
import BookingConfigScreen from '../screens/BookingConfigScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NearestLocationScreen from '../screens/NearestLocationScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import TabBar from './TabBar';
import type { RootStackParamList } from './types';
import { colors } from '../theme/tokens';

const ONBOARDING_KEY = 'seen_onboarding';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator<RootStackParamList>();
const MapStack = createNativeStackNavigator<RootStackParamList>();
const FavStack = createNativeStackNavigator<RootStackParamList>();
const ProfileStack = createNativeStackNavigator<RootStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
  contentStyle: { backgroundColor: colors.bg },
} as const;

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="CarList" component={CarListScreen} options={{ title: 'Cars' }} />
      <HomeStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle' }} />
      <HomeStack.Screen name="BookingConfig" component={BookingConfigScreen} options={{ title: 'Book vehicle' }} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <HomeStack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking detail' }} />
      <HomeStack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave a review' }} />
    </HomeStack.Navigator>
  );
}

function MapStackNav() {
  return (
    <MapStack.Navigator screenOptions={stackScreenOptions}>
      <MapStack.Screen name="NearestLocation" component={NearestLocationScreen} options={{ headerShown: false }} />
    </MapStack.Navigator>
  );
}

function FavoritesStackNav() {
  return (
    <FavStack.Navigator screenOptions={stackScreenOptions}>
      <FavStack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
      <FavStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle' }} />
    </FavStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <ProfileStack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ title: 'Verify account' }} />
      <ProfileStack.Screen name="Bookings" component={BookingsScreen} options={{ title: 'My bookings' }} />
      <ProfileStack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking detail' }} />
      <ProfileStack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave a review' }} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNav} />
      <Tab.Screen name="MapTab" component={MapStackNav} />
      <Tab.Screen name="FavoritesTab" component={FavoritesStackNav} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNav} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);
  const [, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(restoreSession());
    dispatch(hydrateFavorites());
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setSeenOnboarding(v === 'true'))
      .catch(() => setSeenOnboarding(true));
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

  if (seenOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        {token ? (
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        ) : !seenOnboarding ? (
          <>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

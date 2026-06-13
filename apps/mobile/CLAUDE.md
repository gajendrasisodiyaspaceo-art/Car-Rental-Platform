# Mobile App (React Native)

@AGENTS.md

## Stack
- Expo SDK ~56 / React Native 0.85 (TypeScript)
- React Navigation (native-stack)
- State: Redux Toolkit + react-redux
- HTTP: Axios (`src/api/client.ts`)
- Storage: AsyncStorage today — migrate JWT to `expo-secure-store` (Keychain/Keystore)
- Push notifications: Firebase Cloud Messaging (`src/services/notifications.ts`)

## Structure
- `src/screens/`     — one screen per route (Login, Home, VehicleDetail, Bookings)
- `src/components/`  — reusable UI (e.g. VehicleCard)
- `src/navigation/`  — RootNavigator
- `src/store/`       — Redux slices (authSlice, vehiclesSlice)
- `src/api/`         — Axios client
- `src/services/`    — side-effect modules (notifications)

## Conventions
- Functional components + hooks only.
- Use FlatList for vehicle lists, never `.map` inside a ScrollView.
- Screens go in `src/screens`, reusable UI in `src/components`.
- Talk to the API via the shared Axios client; don't hand-roll fetch calls.
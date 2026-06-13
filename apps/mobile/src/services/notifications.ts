/**
 * Push notification wiring (Firebase Cloud Messaging).
 *
 * Per the project spec, customer notifications (booking confirmations, OTP
 * delivery, vehicle availability, promotions) are delivered via FCM. In the
 * Expo managed workflow this needs a development build with the
 * `@react-native-firebase/app` + `@react-native-firebase/messaging` config
 * plugins (or `expo-notifications` for Expo Push). Stubbed here so the rest of
 * the app can call a stable API.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // TODO: request permissions, get the FCM token, and register it with the
  // backend (POST /api/v1/auth/push-token once implemented).
  return null;
}

export function onNotificationReceived(_handler: (data: unknown) => void): () => void {
  // TODO: subscribe to FCM foreground/background message handlers.
  return () => undefined;
}

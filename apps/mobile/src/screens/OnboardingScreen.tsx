import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, radius, spacing } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W, height: H } = Dimensions.get('window');

// Aesthetic risk: the lime hero panel rises from the bottom and the car image
// bleeds upward *out* of it — breaking the frame and creating a layered depth
// that reads editorial rather than templated.
const HERO_IMG = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const PANEL_HEIGHT = clamp(H * 0.62, 420, 640);
const IMG_HEIGHT = clamp(H * 0.44, 280, 460);
const IMG_TOP = clamp(H * 0.12, 64, 180); // car sits above the panel top edge

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const panelY = useRef(new Animated.Value(60)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const carY = useRef(new Animated.Value(30)).current;
  const carOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // panel rises first
      Animated.parallel([
        Animated.spring(panelY, { toValue: 0, friction: 10, tension: 55, useNativeDriver: true }),
        Animated.timing(panelOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
      // car floats in slightly after
      Animated.parallel([
        Animated.spring(carY, { toValue: 0, friction: 9, tension: 45, useNativeDriver: true }),
        Animated.timing(carOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
      ]),
      // copy and button
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [panelY, panelOpacity, carY, carOpacity, textOpacity, btnOpacity]);

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('seen_onboarding', 'true');
    navigation.replace('Login');
  };

  return (
    <View style={styles.root}>
      {/* Dark top zone — status bar breathing room + tag line */}
      <View style={[styles.topZone, { paddingTop: insets.top + spacing.xl }]}>
        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.eyebrow}>DRIVECLUB</Text>
        </Animated.View>
      </View>

      {/* Lime hero panel — rises from bottom */}
      <Animated.View
        style={[
          styles.heroPanel,
          { paddingBottom: spacing.xxl + insets.bottom },
          { opacity: panelOpacity, transform: [{ translateY: panelY }] },
        ]}
      >
        {/* Headline sits inside panel, toward the bottom */}
        <Animated.View style={[styles.copyBlock, { opacity: textOpacity }]}>
          <Text style={styles.headline}>
            Find, book{'\n'}and rent a car
          </Text>
          <Text style={styles.headlineAccent}>Easily</Text>
          <Text style={styles.subtitle}>
            Skip the counter. Pick your car, pick your dates,
            and drive away in minutes.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: btnOpacity, marginTop: spacing.xxl }}>
          <PrimaryButton
            label="Get Started"
            leadingIcon="grid"
            chevrons
            onPress={handleGetStarted}
          />
        </Animated.View>

        {/* Bottom indicator dots — visual rhythm only */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </Animated.View>

      {/* Car image bleeds upward, overlapping the seam between dark + lime */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.carWrap,
          { opacity: carOpacity, transform: [{ translateY: carY }] },
        ]}
      >
        <Image
          source={{ uri: HERO_IMG }}
          style={styles.carImage}
          resizeMode="cover"
        />
        {/* Soft shadow fade at the bottom of the car image */}
        <View style={styles.carFade} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  topZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.18,
    paddingHorizontal: spacing.xxl,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: font.size.sm,
    letterSpacing: 3,
  },

  // Lime panel — covers bottom 62% of screen
  heroPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'flex-end',
  },

  copyBlock: {
    gap: spacing.sm,
  },
  headline: {
    color: colors.onAccent,
    fontFamily: font.display,
    fontSize: font.size.xxxl,
    fontWeight: '700',
    lineHeight: font.size.xxxl * 1.18,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    // The word "Easily" — same dark text but isolated on its own line
    // and underlined with the bg colour, making it feel marked rather than styled.
    color: colors.onAccent,
    fontFamily: font.display,
    fontSize: font.size.xxxl,
    fontWeight: '700',
    lineHeight: font.size.xxxl * 1.18,
    letterSpacing: -0.5,
    textDecorationLine: 'underline',
    textDecorationColor: colors.bg,
    textDecorationStyle: 'solid',
    marginTop: -4,
  },
  subtitle: {
    color: colors.onAccent,
    fontFamily: font.regular,
    fontSize: font.size.md,
    lineHeight: font.size.md * 1.55,
    opacity: 0.75,
    marginTop: spacing.sm,
    maxWidth: W * 0.78,
  },

  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.onAccent,
    opacity: 0.3,
  },
  dotActive: {
    width: 20,
    opacity: 0.7,
  },

  // Car image — absolutely positioned so it straddles the dark/lime seam
  carWrap: {
    position: 'absolute',
    top: IMG_TOP,
    left: 0,
    right: 0,
    height: IMG_HEIGHT,
    pointerEvents: 'none',
  },
  carImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  carFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    // Fade from lime panel colour upward so image blends into the panel smoothly
    backgroundColor: 'transparent',
  },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Logotype from '../../assets/logotype.svg';

const ROYAL_BLUE = '#1E56A0';
const ROYAL_BLUE_ACCENT = '#3B82F6';

interface StorySlide {
  prefix: string;
  accent: string;
  suffix?: string;
}

const SLIDES: StorySlide[] = [
  {
    prefix: 'Your next customer is already in a ',
    accent: 'WhatsApp',
    suffix: ' group.',
  },
  {
    prefix: 'The first merchant to quote closes the deal ',
    accent: '70% of the time.',
    suffix: '',
  },
  {
    prefix: 'Mikana turns group requests into winning quotes ',
    accent: '— in seconds.',
    suffix: '',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  // Animated breathing corner glow
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.75)).current;

  // Bottom hint pulse
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  // ── Corner Glow Breathing Aura ──────────────────────────────────────────
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, {
            toValue: 1.15,
            duration: 3200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale, {
            toValue: 0.96,
            duration: 3200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.65,
            duration: 3200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [glowScale, glowOpacity]);

  // ── "Tap to continue" pulse ─────────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // ── Sync Scroll Momentum to Active Slide ────────────────────────────────
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    const clampedPage = Math.max(0, Math.min(page, SLIDES.length - 1));

    if (clampedPage !== currentSlideRef.current) {
      currentSlideRef.current = clampedPage;
      setCurrentSlide(clampedPage);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ── Tap to Advance or Navigate ──────────────────────────────────────────
  const handleTap = useCallback(() => {
    const active = currentSlideRef.current;
    if (active < SLIDES.length - 1) {
      const next = active + 1;
      currentSlideRef.current = next;
      setCurrentSlide(next);
      scrollRef.current?.scrollTo({
        x: next * SCREEN_WIDTH,
        animated: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/onboarding/discover');
    }
  }, [SCREEN_WIDTH, router]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/onboarding/discover');
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Animated Breathing Corner Blue Glow */}
      <Animated.View
        style={[
          styles.ambientGlowWrapper,
          {
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <Svg height="480" width="480">
          <Defs>
            <RadialGradient
              id="breathingGlow"
              cx="75%"
              cy="75%"
              rx="65%"
              ry="65%"
              fx="75%"
              fy="75%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#4169E1" stopOpacity="0.38" />
              <Stop offset="35%" stopColor="#60A5FA" stopOpacity="0.22" />
              <Stop offset="70%" stopColor="#93C5FD" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="480" height="480" fill="url(#breathingGlow)" />
        </Svg>
      </Animated.View>

      {/* Top Bar with Royal Blue Skip */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Pressable
          onPress={handleSkip}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Skip intro"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Fixed Brand & Stepper Header */}
      <View style={styles.brandSection}>
        <View style={styles.logoWrapper}>
          <Logotype width={128} height={42} />
        </View>

        {/* 3-Dash Progress Stepper with Royal Blue Highlight */}
        <View style={styles.dashRow}>
          {SLIDES.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <Pressable
                key={index}
                onPress={() => {
                  currentSlideRef.current = index;
                  setCurrentSlide(index);
                  scrollRef.current?.scrollTo({
                    x: index * SCREEN_WIDTH,
                    animated: true,
                  });
                  Haptics.selectionAsync();
                }}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.dash,
                    isActive ? styles.dashActive : styles.dashInactive,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Native Horizontal Swipable Body (Swipes Left/Right Fluidly + Taps) */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <Pressable
            key={index}
            style={[styles.slidePage, { width: SCREEN_WIDTH }]}
            onPress={handleTap}
            accessibilityRole="button"
            accessibilityLabel={slide.prefix + slide.accent + (slide.suffix || '')}
          >
            <View style={styles.statementWrapper}>
              <Text style={styles.statementText}>
                {slide.prefix}
                <Text style={styles.statementAccent}>{slide.accent}</Text>
                {slide.suffix || ''}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Fixed Footer with Subtle Tap / Swipe Hint */}
      <Pressable style={styles.footerSection} onPress={handleTap}>
        <Animated.Text style={[styles.tapText, { opacity: pulseAnim }]}>
          {currentSlide === SLIDES.length - 1
            ? 'Tap to start'
            : 'Tap or swipe to continue'}
        </Animated.Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  ambientGlowWrapper: {
    position: 'absolute',
    bottom: -80,
    right: -80,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 10,
  },
  topBarSpacer: {
    flex: 1,
  },
  skipText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: ROYAL_BLUE,
    letterSpacing: -0.2,
  },
  brandSection: {
    paddingHorizontal: 28,
    paddingTop: 36,
    zIndex: 5,
  },
  logoWrapper: {
    marginBottom: 26,
  },
  dashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dash: {
    height: 4,
    borderRadius: 2,
  },
  dashActive: {
    width: 32,
    backgroundColor: ROYAL_BLUE,
  },
  dashInactive: {
    width: 24,
    backgroundColor: '#E2E8F0',
  },
  scrollView: {
    flex: 1,
  },
  slidePage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  statementWrapper: {
    paddingBottom: 40,
  },
  statementText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 34,
    lineHeight: 44,
    color: '#0F172A',
    letterSpacing: -0.9,
    maxWidth: '96%',
  },
  statementAccent: {
    color: ROYAL_BLUE,
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: 28,
    zIndex: 5,
  },
  tapText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.2,
  },
});
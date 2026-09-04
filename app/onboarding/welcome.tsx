import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Logotype from '../../assets/logotype.svg';

const ROYAL_BLUE = '#1E56A0';
const ACCENT_BLUE = '#4169E1';

interface StorySlide {
  statement: string;
  highlight?: string;
  subtext?: string;
}

const SLIDES: StorySlide[] = [
  {
    statement: 'Your next customer is already in a WhatsApp group.',
  },
  {
    statement: 'The first merchant to quote closes the deal 70% of the time.',
  },
  {
    statement: 'Mikana turns group requests into winning quotes — in seconds.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  // Subtle pulsing animation on "Tap to continue"
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentSlide < SLIDES.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(prev => prev + 1);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      router.push('/onboarding/discover');
    }
  };

  const handleSkip = (e: any) => {
    e?.stopPropagation?.();
    Haptics.selectionAsync();
    router.push('/onboarding/discover');
  };

  const activeSlide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Ambient Blue Glow at Bottom Right (Inspired by Speak) */}
      <Svg
        height="480"
        width="480"
        style={styles.ambientGlow}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient
            id="cornerGlow"
            cx="75%"
            cy="75%"
            rx="65%"
            ry="65%"
            fx="75%"
            fy="75%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#60A5FA" stopOpacity="0.32" />
            <Stop offset="45%" stopColor="#93C5FD" stopOpacity="0.16" />
            <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.03" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="480" height="480" fill="url(#cornerGlow)" />
      </Svg>

      {/* Top Bar with Skip (No Sign-in button) */}
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

      {/* Full-Screen Tap Area */}
      <Pressable
        style={styles.contentContainer}
        onPress={handleNext}
        accessibilityRole="button"
        accessibilityLabel="Tap to continue"
      >
        {/* Brand & Progress Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoWrapper}>
            <Logotype width={128} height={42} />
          </View>

          {/* 3-Dash Progress Stepper */}
          <View style={styles.dashRow}>
            {SLIDES.map((_, index) => {
              const isActive = index === currentSlide;
              return (
                <View
                  key={index}
                  style={[
                    styles.dash,
                    isActive ? styles.dashActive : styles.dashInactive,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Big Impact Statement */}
        <View style={styles.statementSection}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.statementText}>
              {activeSlide.statement}
            </Text>
          </Animated.View>
        </View>

        {/* Subtle "Tap to continue" */}
        <View style={styles.footerSection}>
          <Animated.Text style={[styles.tapText, { opacity: pulseAnim }]}>
            {currentSlide === SLIDES.length - 1 ? 'Tap to start' : 'Tap to continue'}
          </Animated.Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  ambientGlow: {
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
    color: '#3B82F6',
    letterSpacing: -0.2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  brandSection: {
    paddingTop: 36,
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
    width: 30,
    backgroundColor: ROYAL_BLUE,
  },
  dashInactive: {
    width: 30,
    backgroundColor: '#CBD5E1',
  },
  statementSection: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  statementText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 34,
    lineHeight: 44,
    color: '#0F172A',
    letterSpacing: -0.9,
    maxWidth: '96%',
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  tapText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 0.2,
  },
});
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Path } from 'react-native-svg';
import Logotype from '../../assets/logotype.svg';

const ROYAL_BLUE = '#1E56A0';

// SignalBuddy: the radar mascot that catches high-intent buying signals in chat noise
function SignalBuddy({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx="16" cy="18" r="11" fill={ROYAL_BLUE} />
      <Circle cx="12" cy="17" r="1.5" fill="#FFFFFF" />
      <Circle cx="20" cy="17" r="1.5" fill="#FFFFFF" />
      <Path
        d="M12 21.5 Q16 24.5 20 21.5"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M22 8 Q25.5 10 25.5 13.5"
        stroke={ROYAL_BLUE}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M25 5.5 Q30 8.5 30 13.5"
        stroke={ROYAL_BLUE}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  // Stage 1: Brandmark, headline, raw noisy message
  const fadeStage1 = useRef(new Animated.Value(0)).current;
  const slideStage1 = useRef(new Animated.Value(14)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;

  // Stage 2: SignalBuddy detection radar
  const fadeBuddy = useRef(new Animated.Value(0)).current;
  const scaleBuddy = useRef(new Animated.Value(0.7)).current;
  const buddyBob = useRef(new Animated.Value(0)).current;
  const radarWave = useRef(new Animated.Value(0)).current;

  // Stage 3: Extracted structured lead
  const fadeLead = useRef(new Animated.Value(0)).current;
  const slideLead = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // 1. Stage 1 entrance (Headline & Raw Message)
    Animated.parallel([
      Animated.timing(fadeStage1, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideStage1, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 22,
        stiffness: 240,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Stage 2: SignalBuddy pops in after 400ms
    const buddyTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeBuddy, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(scaleBuddy, {
          toValue: 1,
          damping: 14,
          stiffness: 280,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Continuous gentle bobbing
        Animated.loop(
          Animated.sequence([
            Animated.timing(buddyBob, {
              toValue: -3,
              duration: 750,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(buddyBob, {
              toValue: 0,
              duration: 750,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Continuous subtle radar pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(radarWave, {
              toValue: 1,
              duration: 1400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(radarWave, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 380);

    // 3. Stage 3: Structured Lead resolves after 650ms
    const leadTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeLead, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideLead, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 650);

    return () => {
      clearTimeout(buddyTimer);
      clearTimeout(leadTimer);
    };
  }, []);

  const radarScale = radarWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.8],
  });
  const radarOpacity = radarWave.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.25, 0],
  });

  return (
    <SafeAreaView className="flex-1 bg-canvas justify-between px-6 py-4" edges={['top', 'bottom']}>
      {/* 1. Header: Official Mikana Logotype */}
      <View className="pt-2 pb-1 flex-row items-center justify-between">
        <Logotype width={116} height={38} />
      </View>

      {/* 2. Headline with Contextual Word Highlighting */}
      <Animated.View
        style={{ opacity: fadeStage1, transform: [{ translateY: slideStage1 }] }}
        className="mt-3 mb-1"
      >
        <Text className="font-geist-bold text-[26px] leading-[33px] text-content-heading tracking-tight mb-2">
          {'Never miss a customer\nin your '}
          <Text style={{ color: ROYAL_BLUE }}>WhatsApp</Text>
          {' groups.'}
        </Text>
        <Text className="font-inter text-sm leading-[21px] text-content-secondary">
          Mikana watches your chosen group chats 24/7 and surfaces{' '}
          <Text className="font-inter-medium text-content-primary">real purchase requests</Text> the
          moment they are posted.
        </Text>
      </Animated.View>

      {/* 3. The Transformation Showcase (Frosted Blur Container) */}
      <View className="my-1 rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-white/75">
        <BlurView intensity={35} tint="light" className="p-4">
          {/* A. Raw WhatsApp Noise (Stage 1) */}
          <Animated.View
            style={{ opacity: fadeStage1, transform: [{ scale: cardScale }] }}
            className="bg-surface-subtle/80 rounded-2xl p-3 border border-border"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text className="font-geist-semibold text-xs text-content-primary">
                  Commercial Suppliers & Trade
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={10} color="#829AB1" strokeWidth={2} />
                <Text className="font-inter text-[10px] text-content-muted">2m ago</Text>
              </View>
            </View>

            <Text className="font-geist-medium text-[11px] text-content-secondary mb-1">
              David K.
            </Text>

            <Text className="font-inter text-[13px] leading-[19px] text-content-secondary italic">
              "Looking for a verified supplier who can dispatch{' '}
              <Text className="font-inter-medium text-content-heading bg-amber-100/90 text-amber-950 px-1 py-0.5 rounded">
                50 commercial units
              </Text>{' '}
              by{' '}
              <Text className="font-inter-medium text-content-heading bg-amber-100/90 text-amber-950 px-1 py-0.5 rounded">
                Friday
              </Text>
              .{' '}
              <Text className="font-inter-medium text-brand-blue bg-blue-50/90 px-1 py-0.5 rounded">
                Immediate PO ready
              </Text>
              ."
            </Text>
          </Animated.View>

          {/* B. The Detection Bridge (SignalBuddy Radar Animation) */}
          <Animated.View
            style={{
              opacity: fadeBuddy,
              transform: [{ scale: scaleBuddy }, { translateY: buddyBob }],
            }}
            className="items-center justify-center my-2 relative"
          >
            {/* Animated Pulsing Radar Ring */}
            <Animated.View
              style={{
                transform: [{ scale: radarScale }],
                opacity: radarOpacity,
              }}
              className="absolute w-12 h-12 rounded-full border border-blue-400 bg-blue-500/15"
            />

            {/* Mascot Center */}
            <View className="bg-surface rounded-full p-1.5 shadow-sm border border-slate-200">
              <SignalBuddy size={28} />
            </View>
          </Animated.View>

          {/* C. The Surfaced Opportunity (Stage 3) */}
          <Animated.View
            style={{
              opacity: fadeLead,
              transform: [{ translateY: slideLead }],
            }}
            className="bg-surface rounded-2xl p-3.5 border border-slate-200/90 shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                <Sparkles size={11} color={ROYAL_BLUE} strokeWidth={2.2} />
                <Text className="font-geist-semibold text-[10px] text-brand-blue tracking-wide">
                  HIGH-INTENT LEAD
                </Text>
              </View>
              <View className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <CheckCircle2 size={10} color="#059669" strokeWidth={2.5} />
                <Text className="font-geist-semibold text-[9px] text-emerald-700 tracking-wider">
                  MATCHED
                </Text>
              </View>
            </View>

            <Text className="font-geist-bold text-sm text-content-heading mb-1">
              50 Commercial Units Required
            </Text>

            {/* Isolated Opportunity Badges */}
            <View className="flex-row flex-wrap items-center gap-1.5 mt-1">
              <View className="bg-surface-elevated border border-border rounded px-2 py-0.5">
                <Text className="font-geist-medium text-[10px] text-content-secondary">
                  50 Units
                </Text>
              </View>
              <View className="bg-surface-elevated border border-border rounded px-2 py-0.5">
                <Text className="font-geist-medium text-[10px] text-content-secondary">
                  Due Friday
                </Text>
              </View>
              <View className="bg-surface-elevated border border-border rounded px-2 py-0.5">
                <Text className="font-geist-medium text-[10px] text-brand-blue">
                  PO Ready
                </Text>
              </View>
            </View>
          </Animated.View>
        </BlurView>
      </View>

      {/* 4. Docked Action Zone */}
      <View className="gap-1.5 pb-1">
        <Pressable
          className="flex-row items-center justify-center gap-2 bg-brand-navy py-4 rounded-xl shadow active:opacity-90 active:scale-[0.99]"
          onPress={() => router.push('/onboarding/discover')}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text className="font-geist-semibold text-[15px] text-content-inverse tracking-wide">
            Get Started
          </Text>
          <ArrowRight size={17} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
        <Text className="font-inter text-xs text-content-muted text-center mt-0.5">
          Includes a free tier · Connects in under a minute
        </Text>
      </View>
    </SafeAreaView>
  );
}
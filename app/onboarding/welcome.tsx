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
import { ArrowRight, ArrowDown, MapPin, Send, MessageSquare } from 'lucide-react-native';
import Logotype from '../../assets/logotype.svg';

export default function WelcomeScreen() {
  const router = useRouter();

  // Staggered presentation animations
  const fadeStage1 = useRef(new Animated.Value(0)).current;
  const slideStage1 = useRef(new Animated.Value(14)).current;
  const fadeStage2 = useRef(new Animated.Value(0)).current;
  const slideStage2 = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // 1. Initial view entrance
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
    ]).start();

    // 2. Structured lead revelation
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeStage2, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideStage2, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-canvas justify-between px-6 py-4" edges={['top', 'bottom']}>
      {/* 1. Brand Logotype */}
      <View className="pt-2 pb-1">
        <Logotype width={116} height={38} />
      </View>

      {/* 2. Headline & Value Proposition */}
      <Animated.View
        style={{ opacity: fadeStage1, transform: [{ translateY: slideStage1 }] }}
        className="mt-2 mb-1"
      >
        <Text className="font-geist-bold text-[26px] leading-[33px] text-content-heading tracking-tight mb-2">
          {"Never miss a customer\nin your WhatsApp groups."}
        </Text>
        <Text className="font-inter text-sm leading-[21px] text-content-secondary">
          Mikana monitors your selected groups 24/7 and turns raw chat requests into structured, actionable sales leads.
        </Text>
      </Animated.View>

      {/* 3. The Transformation Showcase */}
      <View className="my-1 gap-2">
        {/* Step A: Raw WhatsApp Group Chat Message */}
        <Animated.View
          style={{ opacity: fadeStage1, transform: [{ translateY: slideStage1 }] }}
          className="bg-surface rounded-xl p-3 border border-border"
        >
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center gap-1.5">
              <View className="w-5 h-5 rounded-full bg-emerald-50 items-center justify-center border border-emerald-200">
                <MessageSquare size={11} color="#059669" strokeWidth={2} />
              </View>
              <Text className="font-geist-semibold text-xs text-content-primary">
                Commercial Suppliers & Trade
              </Text>
            </View>
            <Text className="font-inter text-[11px] text-content-muted">2m ago</Text>
          </View>

          <Text className="font-geist-medium text-xs text-content-secondary mb-0.5">David K.</Text>
          <Text className="font-inter text-[13px] leading-[18px] text-content-secondary italic">
            "Looking for a verified supplier who can dispatch 50 commercial units by Friday. Immediate PO ready."
          </Text>
        </Animated.View>

        {/* Step B: Interception Divider */}
        <Animated.View
          style={{ opacity: fadeStage2 }}
          className="flex-row items-center justify-center py-0.5"
        >
          <View className="flex-1 h-[1px] bg-border" />
          <View className="flex-row items-center gap-1.5 bg-brand-blue-tint border border-brand-blue-border rounded-full px-3 py-1 mx-2">
            <ArrowDown size={11} color="#1E56A0" strokeWidth={2.5} />
            <Text className="font-geist-semibold text-[10px] text-brand-blue tracking-wider">
              CAPTURED AS ACTIONABLE LEAD
            </Text>
          </View>
          <View className="flex-1 h-[1px] bg-border" />
        </Animated.View>

        {/* Step C: Real Mikana Lead Card (Identical to in-app Radar UI) */}
        <Animated.View
          style={{ opacity: fadeStage2, transform: [{ translateY: slideStage2 }] }}
          className="bg-surface rounded-xl p-3.5 border border-border-strong shadow-sm"
        >
          {/* Card Top: Avatar, Sender, Source Badge */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-full bg-brand-navy items-center justify-center">
                <Text className="font-geist-bold text-xs text-content-inverse">DK</Text>
              </View>
              <View>
                <Text className="font-geist-semibold text-sm text-content-primary leading-tight">
                  David K.
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <View className="bg-brand-blue-tint border border-brand-blue-border rounded px-1.5 py-0.2">
                    <Text className="font-geist-medium text-[9px] text-brand-blue">WhatsApp</Text>
                  </View>
                  <Text className="font-inter text-[11px] text-content-muted">
                    Commercial Suppliers
                  </Text>
                </View>
              </View>
            </View>
            <Text className="font-inter text-[11px] text-content-muted">Just now</Text>
          </View>

          {/* Lead Title */}
          <Text className="font-geist-semibold text-sm text-content-primary leading-snug mb-2">
            50 Commercial Units Required
          </Text>

          {/* Structured Detail Badges */}
          <View className="flex-row items-center justify-between pt-1 border-t border-border">
            <View className="flex-row items-center gap-1.5">
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
              <View className="bg-brand-blue-tint border border-brand-blue-border rounded px-2 py-0.5">
                <Text className="font-geist-semibold text-[10px] text-brand-blue">
                  PO Ready
                </Text>
              </View>
            </View>

            {/* In-Card Action Pill */}
            <View className="flex-row items-center gap-1 bg-brand-navy px-2.5 py-1 rounded-md">
              <Send size={10} color="#FFFFFF" strokeWidth={2} />
              <Text className="font-geist-medium text-[10px] text-content-inverse">Quote</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* 4. Docked Action Zone */}
      <View className="gap-1.5 pb-1">
        <Pressable
          className="flex-row items-center justify-center gap-2.5 bg-brand-navy py-4 rounded-xl shadow border border-brand-navy-dark active:scale-[0.98] active:opacity-95"
          onPress={() => router.push('/onboarding/discover')}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text className="font-geist-semibold text-[15px] text-content-inverse tracking-wide">
            Get Started
          </Text>
          <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.25} />
        </Pressable>
        <Text className="font-inter text-xs text-content-muted text-center mt-0.5">
          Free tier included · Connects in 60 seconds
        </Text>
      </View>
    </SafeAreaView>
  );
}
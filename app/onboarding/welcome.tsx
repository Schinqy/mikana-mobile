import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ArrowDown, Shield, Globe, Bell, MessageSquare } from 'lucide-react-native';
import Logotype from '../../assets/logotype.svg';

export default function WelcomeScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;
  const cardScale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 24,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-canvas justify-between px-6 py-4" edges={['top', 'bottom']}>
      {/* 1. Header: Official Brand Logotype */}
      <View className="pt-2 pb-1">
        <Logotype width={116} height={38} />
      </View>

      {/* 2. Headline & Value Proposition */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="mt-3 mb-1"
      >
        <Text className="font-geist-bold text-[25px] leading-[32px] text-content-heading tracking-tight mb-2">
          {"Never miss a customer\nin your WhatsApp groups."}
        </Text>
        <Text className="font-inter text-sm leading-[21px] text-content-secondary">
          Mikana monitors your selected group chats and surfaces real buying requests the moment they are posted.
        </Text>
      </Animated.View>

      {/* 3. Live Detection Artifact */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: cardScale }],
        }}
        className="my-2"
      >
        <View className="bg-surface border border-border-strong rounded-2xl overflow-hidden shadow-sm">
          {/* Top: Incoming Group Message */}
          <View className="p-3.5 bg-surface-subtle">
            <View className="flex-row items-center gap-2 mb-1.5">
              <View className="w-5 h-5 rounded-full bg-slate-200 items-center justify-center">
                <MessageSquare size={11} color="#334155" strokeWidth={2} />
              </View>
              <Text className="flex-1 font-geist-semibold text-xs text-content-primary" numberOfLines={1}>
                Commercial Suppliers & Trade
              </Text>
              <Text className="font-inter text-[11px] text-content-muted">2m ago</Text>
            </View>
            <Text className="font-geist-medium text-xs text-content-secondary mb-0.5">David K.</Text>
            <Text className="font-inter text-[13px] leading-[18px] text-content-secondary italic" numberOfLines={2}>
              {'"Looking for a verified supplier who can dispatch 50 commercial units by Friday. Immediate PO ready."'}
            </Text>
          </View>

          {/* Clean Matching Bridge */}
          <View className="flex-row items-center bg-surface px-3.5 h-6">
            <View className="flex-1 h-[1px] bg-border" />
            <View className="flex-row items-center gap-1 bg-brand-blue-tint border border-brand-blue-border rounded-full px-2.5 py-0.5">
              <ArrowDown size={10} color="#1E56A0" strokeWidth={2.5} />
              <Text className="font-geist-semibold text-[9px] text-brand-blue tracking-wider">
                MATCHED OFFERING
              </Text>
            </View>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          {/* Bottom: Surfaced Opportunity */}
          <View className="p-3.5 bg-surface">
            <View className="flex-row items-center gap-2 mb-1.5">
              <View className="bg-brand-blue-tint border border-brand-blue-border rounded px-2 py-0.5">
                <Text className="font-geist-bold text-[10px] text-brand-blue tracking-wide">
                  EQUIPMENT & SUPPLIES
                </Text>
              </View>
              <View className="bg-surface-elevated border border-border rounded px-2 py-0.5">
                <Text className="font-geist-medium text-[10px] text-content-secondary tracking-wide">
                  URGENT ORDER
                </Text>
              </View>
            </View>

            <Text className="font-geist-semibold text-sm text-content-primary mb-0.5" numberOfLines={1}>
              50 Commercial Units Required
            </Text>
            <Text className="font-inter text-xs text-content-secondary" numberOfLines={1}>
              Commercial Trade · Deadline: Friday · PO Ready
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* 4. Three Core Guarantees */}
      <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl py-2.5 px-3.5">
        <View className="flex-row items-center gap-1.5">
          <Globe size={14} color="#486581" strokeWidth={1.75} />
          <Text className="font-geist-medium text-[11px] text-content-secondary">Multilingual</Text>
        </View>
        <View className="w-[1px] h-3.5 bg-border" />
        <View className="flex-row items-center gap-1.5">
          <Shield size={14} color="#486581" strokeWidth={1.75} />
          <Text className="font-geist-medium text-[11px] text-content-secondary">Whitelisted Only</Text>
        </View>
        <View className="w-[1px] h-3.5 bg-border" />
        <View className="flex-row items-center gap-1.5">
          <Bell size={14} color="#486581" strokeWidth={1.75} />
          <Text className="font-geist-medium text-[11px] text-content-secondary">Instant Alerts</Text>
        </View>
      </View>

      {/* 5. Docked Action Zone */}
      <View className="gap-1 pb-1">
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
          Free tier included · Connects in 60 seconds
        </Text>
      </View>
    </SafeAreaView>
  );
}
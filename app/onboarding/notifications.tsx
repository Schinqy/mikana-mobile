import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { setOnboardingStage } = useAuthStore();
  const { setPushNotifications } = useSettingsStore();
  const [requesting, setRequesting] = useState(false);

  const proceedToPaywall = useCallback(() => {
    setOnboardingStage('notifications');
    router.push('/onboarding/paywall');
  }, [setOnboardingStage, router]);

  const handleEnable = async () => {
    setRequesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPushNotifications(true);

    try {
      if (Platform.OS !== 'web') {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
      }
    } catch (e) {
      console.warn('Failed to request notification permissions:', e);
    } finally {
      setRequesting(false);
      proceedToPaywall();
    }
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    setPushNotifications(false);
    proceedToPaywall();
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── 1. Top Bar & 6-Segment Stepper ────────────────────────────────────── */}
      <View className="px-6 pt-2 pb-3 border-b border-border bg-canvas">
        <View className="flex-row items-center gap-1.5 mb-3">
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-slate-200" />
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/groups');
              }
            }}
            className="w-8 h-8 -ml-1 items-center justify-center rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#486581" strokeWidth={1.75} />
          </Pressable>

          <Text className="font-geist-medium text-xs text-content-muted tracking-wide">
            Step 5 of 6 · Notifications
          </Text>

          <Pressable
            onPress={handleSkip}
            className="px-2 py-1 -mr-2 rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <Text className="font-geist-semibold text-xs text-brand-blue">
              Skip
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── 2. Focused Permissions Body (Centered & Direct) ──────────────────── */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-brand-blue-tint border border-brand-blue-border items-center justify-center mb-6 shadow-xs">
          <BellRing size={36} color="#1E56A0" strokeWidth={2} />
        </View>

        <Text className="font-geist-bold text-2xl text-content-heading text-center mb-2 tracking-tight">
          Never miss a live buyer inquiry
        </Text>

        <Text className="font-inter text-sm text-content-secondary text-center leading-6 max-w-[300px]">
          Turn on push notifications to receive real-time alerts the second a buyer posts in your monitored WhatsApp trade groups.
        </Text>
      </View>

      {/* ── 3. Docked Sticky Action Buttons ──────────────────────────────────── */}
      <View className="px-6 pt-3 pb-8 border-t border-border bg-canvas">
        <Pressable
          onPress={handleEnable}
          disabled={requesting}
          className={`w-full bg-brand-navy py-4 rounded-xl flex-row items-center justify-center gap-2 border border-brand-navy-dark shadow-xs ${
            requesting ? 'opacity-60' : 'active:opacity-95'
          }`}
        >
          {requesting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text className="font-geist-semibold text-sm text-white">
                Enable Notifications
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleSkip}
          className="py-3 items-center justify-center mt-1 active:opacity-70"
        >
          <Text className="font-geist-medium text-xs text-content-secondary">
            Maybe Later
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

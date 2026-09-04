import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import {
  purchaseSubscriptionPackage,
  restoreRevenueCatPurchases,
} from '../../src/services/purchases/revenueCat';

type BillingCycle = 'monthly' | 'annual';

export default function OnboardingPaywallScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const { status, setTier } = useSubscriptionStore();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Selected package ID based on billing cycle
  const selectedPackageId = billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';

  const handleFinishFree = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTier('free');
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const handlePurchasePro = async () => {
    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await purchaseSubscriptionPackage(
        selectedPackageId,
        status.isSandboxMode
      );

      if (result.success) {
        setTier(result.tier);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        completeOnboarding();
        router.replace('/(tabs)');
      } else if (result.error) {
        Alert.alert('Subscription Notice', result.error);
      }
    } catch (e: any) {
      // Fallback: If store fails, allow instant simulated activation or free continuation
      Alert.alert(
        'Purchase Simulation',
        'Store purchase failed or running in development without billing. Would you like to activate Pro in Demo Mode?',
        [
          { text: 'Continue Free', onPress: handleFinishFree, style: 'cancel' },
          {
            text: 'Activate Pro (Demo)',
            onPress: () => {
              setTier(billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              completeOnboarding();
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await restoreRevenueCatPurchases();
      if (result.isPro) {
        setTier('pro_monthly');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        completeOnboarding();
        router.replace('/(tabs)');
      } else {
        Alert.alert('No Subscription Found', 'No active subscription found. You can start with our Free tier.');
      }
    } catch {
      Alert.alert('Restore Error', 'Unable to restore purchases at this moment.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── 1. Top Bar & 6-Segment Stepper (All 6 Complete) ──────────────────── */}
      <View className="px-6 pt-2 pb-3 border-b border-border bg-canvas">
        <View className="flex-row items-center gap-1.5 mb-3">
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/notifications');
              }
            }}
            className="w-8 h-8 -ml-1 items-center justify-center rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#486581" strokeWidth={1.75} />
          </Pressable>

          <Text className="font-geist-medium text-xs text-content-muted tracking-wide">
            Step 6 of 6 · Membership Tier
          </Text>

          <Pressable
            onPress={handleFinishFree}
            className="px-2 py-1 -mr-2 rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <Text className="font-geist-semibold text-xs text-brand-blue">
              Start Free
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-4">
          <View className="flex-row items-center gap-1.5 bg-brand-blue-tint border border-brand-blue-border rounded-full px-3 py-1 self-start mb-2">
            <Sparkles size={13} color="#1E56A0" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-brand-blue">
              Simple, Transparent Pricing
            </Text>
          </View>
          <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1">
            Choose Your Tier
          </Text>
          <Text className="font-inter text-sm leading-5 text-content-secondary">
            Start free with 2 monitored channels, or upgrade to Pro to unlock 15 trade groups and 24/7 Autopilot dispatching.
          </Text>
        </View>

        {/* Pro Billing Cycle Toggle */}
        <View className="flex-row p-1 bg-surface-elevated border border-border rounded-xl mb-4">
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setBillingCycle('monthly');
            }}
            className={`flex-1 py-2 rounded-lg items-center justify-center ${
              billingCycle === 'monthly' ? 'bg-surface shadow-xs border border-border' : ''
            }`}
          >
            <Text
              className={`font-geist-medium text-xs ${
                billingCycle === 'monthly' ? 'text-brand-navy font-geist-bold' : 'text-content-secondary'
              }`}
            >
              Monthly · $9.99/mo
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setBillingCycle('annual');
            }}
            className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1.5 ${
              billingCycle === 'annual' ? 'bg-surface shadow-xs border border-border' : ''
            }`}
          >
            <Text
              className={`font-geist-medium text-xs ${
                billingCycle === 'annual' ? 'text-brand-navy font-geist-bold' : 'text-content-secondary'
              }`}
            >
              Annual · $79.99/yr
            </Text>
            <View className="bg-amber-100 px-1.5 py-0.5 rounded">
              <Text className="font-geist-bold text-[9px] text-amber-800">
                SAVE 35%
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── CARD 1: Mikana Pro (Hero / Highlighted) ────────────────────────── */}
        <View className="p-5 rounded-2xl border-2 border-brand-blue bg-brand-blue-tint mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              <Crown size={12} color="#D97706" strokeWidth={2} />
              <Text className="font-geist-semibold text-[11px] text-amber-800 uppercase tracking-wider">
                Recommended
              </Text>
            </View>
            <Text className="font-inter text-xs text-brand-blue font-geist-medium">
              Cancel Anytime
            </Text>
          </View>

          <Text className="font-geist-bold text-xl text-content-heading mb-1">
            Mikana Pro
          </Text>

          {/* Pricing display */}
          <View className="flex-row items-baseline mb-3">
            <Text className="font-geist-bold text-3xl text-brand-navy">
              {billingCycle === 'monthly' ? '$9.99' : '$79.99'}
            </Text>
            <Text className="font-inter text-xs text-content-secondary ml-1.5">
              {billingCycle === 'monthly' ? '/ month' : '/ year ($6.66/mo)'}
            </Text>
          </View>

          <View className="h-px bg-brand-blue-border mb-3" />

          {/* Feature Bullets */}
          <View className="gap-2.5 mb-5">
            {[
              'Monitor up to 15 WhatsApp trade channels simultaneously',
              '24/7 Autonomous Autopilot quote dispatch while offline',
              'Priority Gemini Flash AI extraction & match scoring',
              'Unlimited deal pipeline CRM & CSV data export',
            ].map((f, i) => (
              <View key={i} className="flex-row items-center gap-2.5">
                <View className="w-4 h-4 rounded-full bg-brand-blue items-center justify-center">
                  <Check size={11} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text className="font-inter text-xs text-content-heading flex-1 leading-4">
                  {f}
                </Text>
              </View>
            ))}
          </View>

          {/* DIRECT ACTION BUTTON ON PRO CARD */}
          <Pressable
            onPress={handlePurchasePro}
            disabled={isPurchasing}
            className={`w-full bg-brand-navy py-3.5 rounded-xl flex-row items-center justify-center gap-2 border border-brand-navy-dark shadow-xs ${
              isPurchasing ? 'opacity-60' : 'active:opacity-95'
            }`}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text className="font-geist-semibold text-sm text-white">
                  {billingCycle === 'monthly'
                    ? 'Activate Pro — $9.99 / month'
                    : 'Activate Pro Annual — $79.99 / year'}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
              </>
            )}
          </Pressable>
        </View>

        {/* ── CARD 2: Mikana Free (Freemium Zero-Risk Alternative) ──────────── */}
        <View className="p-5 rounded-2xl border border-border bg-surface mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-surface-elevated border border-border px-2.5 py-0.5 rounded-full">
              <Text className="font-geist-medium text-[11px] text-content-secondary uppercase tracking-wider">
                Freemium Tier
              </Text>
            </View>
            <Text className="font-inter text-xs text-content-muted">
              No Card Required
            </Text>
          </View>

          <Text className="font-geist-bold text-lg text-content-heading mb-1">
            Mikana Free
          </Text>

          <View className="flex-row items-baseline mb-3">
            <Text className="font-geist-bold text-2xl text-content-heading">$0</Text>
            <Text className="font-inter text-xs text-content-muted ml-1.5">/ forever</Text>
          </View>

          <View className="h-px bg-border mb-3" />

          {/* Feature Bullets */}
          <View className="gap-2.5 mb-5">
            {[
              'Monitor up to 2 WhatsApp trade channels',
              'Real-time sub-second buyer RFQ notifications',
              'Manual AI proposal & quote drafting',
              'Direct WhatsApp deep link reply',
            ].map((f, i) => (
              <View key={i} className="flex-row items-center gap-2.5">
                <View className="w-4 h-4 rounded-full bg-surface-elevated border border-border items-center justify-center">
                  <Check size={10} color="#486581" strokeWidth={2.5} />
                </View>
                <Text className="font-inter text-xs text-content-secondary flex-1 leading-4">
                  {f}
                </Text>
              </View>
            ))}
          </View>

          {/* DIRECT ACTION BUTTON ON FREE CARD */}
          <Pressable
            onPress={handleFinishFree}
            className="w-full bg-surface-elevated border border-border py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:bg-slate-200"
          >
            <Text className="font-geist-semibold text-sm text-content-primary">
              Continue with Free Tier ($0)
            </Text>
            <ArrowRight size={16} color="#0B2545" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Guarantee & Restore */}
        <View className="items-center py-2 gap-2">
          <View className="flex-row items-center gap-1.5">
            <ShieldCheck size={14} color="#1E56A0" strokeWidth={2} />
            <Text className="font-inter text-xs text-content-secondary">
              Secured by RevenueCat • Change or cancel anytime in Settings
            </Text>
          </View>

          <Pressable onPress={handleRestore} disabled={isRestoring} className="py-1">
            <Text className="font-inter text-xs text-content-muted underline">
              {isRestoring ? 'Restoring...' : 'Already subscribed? Restore Purchases'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

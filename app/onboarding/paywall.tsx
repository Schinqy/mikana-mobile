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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import {
  getRevenueCatPackages,
  purchaseSubscriptionPackage,
  restoreRevenueCatPurchases,
} from '../../src/services/purchases/revenueCat';
import { PaywallPackage } from '../../src/types/subscription';

type PlanSelection = 'free' | 'pro';

export default function OnboardingPaywallScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const { status, setTier } = useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState<PlanSelection>('free');
  const [packages, setPackages] = useState<PaywallPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pro_annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    async function loadPackages() {
      try {
        const pkgs = await getRevenueCatPackages();
        setPackages(pkgs);
        if (pkgs.length > 0) {
          const annual = pkgs.find(p => p.packageType === 'ANNUAL');
          setSelectedPackageId(annual ? annual.identifier : pkgs[0].identifier);
        }
      } catch {
        // Fallback to static pricing display
      }
    }
    loadPackages();
  }, []);

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
      Alert.alert('Notice', e?.message || 'Could not process purchase. You can continue with the free plan.');
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
        contentContainerClassName="px-6 pt-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-4">
          <View className="flex-row items-center gap-1.5 bg-brand-blue-tint border border-brand-blue-border rounded-full px-3 py-1 self-start mb-2">
            <ShieldCheck size={13} color="#1E56A0" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-brand-blue">
              No Credit Card Required
            </Text>
          </View>
          <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1">
            Start Free, Scale as You Win Deals
          </Text>
          <Text className="font-inter text-sm leading-5 text-content-secondary">
            Catch live WhatsApp leads at zero cost. Upgrade to Autopilot whenever you need 24/7 quote dispatching.
          </Text>
        </View>

        {/* Plan 1: Mikana Free (Default / Selected) */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedPlan('free');
          }}
          className={`p-4 rounded-2xl border mb-3 ${
            selectedPlan === 'free'
              ? 'bg-brand-blue-tint border-brand-blue'
              : 'bg-surface border-border active:bg-surface-elevated'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <View className="bg-surface-elevated border border-border px-2 py-0.5 rounded self-start mb-1">
                <Text className="font-geist-medium text-[10px] text-content-secondary uppercase tracking-wider">
                  Freemium · Zero Risk
                </Text>
              </View>
              <Text className="font-geist-bold text-lg text-content-heading">
                Mikana Free
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                selectedPlan === 'free'
                  ? 'border-brand-blue bg-brand-blue'
                  : 'border-slate-300 bg-surface'
              }`}
            >
              {selectedPlan === 'free' && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </View>

          <View className="flex-row items-baseline mb-3">
            <Text className="font-geist-bold text-2xl text-content-heading">$0</Text>
            <Text className="font-inter text-xs text-content-muted ml-1">/ forever</Text>
          </View>

          <View className="h-px bg-border my-2" />

          <View className="gap-2 pt-1">
            {[
              'Monitor up to 2 WhatsApp trade groups',
              'Real-time sub-second buyer RFQ alerts',
              'AI proposal & quote drafting',
              'Manual quote review and DM dispatch',
            ].map((f, i) => (
              <View key={i} className="flex-row items-center gap-2">
                <Check size={14} color="#1E56A0" strokeWidth={2.5} />
                <Text className="font-inter text-xs text-content-secondary">{f}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* Plan 2: Mikana Pro (Optional Upgrade) */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedPlan('pro');
          }}
          className={`p-4 rounded-2xl border mb-4 ${
            selectedPlan === 'pro'
              ? 'bg-brand-blue-tint border-brand-blue'
              : 'bg-surface border-border active:bg-surface-elevated'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <View className="flex-row items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded self-start mb-1">
                <Crown size={11} color="#D97706" strokeWidth={2} />
                <Text className="font-geist-semibold text-[10px] text-amber-800 uppercase tracking-wider">
                  Maximum Growth
                </Text>
              </View>
              <Text className="font-geist-bold text-lg text-content-heading">
                Mikana Pro
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border items-center justify-center ${
                selectedPlan === 'pro'
                  ? 'border-brand-blue bg-brand-blue'
                  : 'border-slate-300 bg-surface'
              }`}
            >
              {selectedPlan === 'pro' && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </View>

          <View className="flex-row items-baseline mb-3">
            <Text className="font-geist-bold text-2xl text-content-heading">$9.99</Text>
            <Text className="font-inter text-xs text-content-muted ml-1">/ month (or $79.99/yr)</Text>
          </View>

          <View className="h-px bg-border my-2" />

          <View className="gap-2 pt-1">
            {[
              'Monitor up to 15 WhatsApp trade groups',
              '24/7 Autonomous Autopilot quote dispatching',
              'Priority Gemini Flash extraction & scoring',
              'Unlimited deal pipeline CRM & export',
            ].map((f, i) => (
              <View key={i} className="flex-row items-center gap-2">
                <Check size={14} color="#1E56A0" strokeWidth={2.5} />
                <Text className="font-inter text-xs text-content-secondary">{f}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* Restore Purchases Link */}
        <View className="items-center py-2">
          <Pressable onPress={handleRestore} disabled={isRestoring}>
            <Text className="font-inter text-xs text-content-muted underline">
              {isRestoring ? 'Restoring...' : 'Already subscribed? Restore Purchases'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Docked CTA Footer ────────────────────────────────────────────────── */}
      <View className="px-6 pt-3 pb-8 border-t border-border bg-canvas">
        {selectedPlan === 'free' ? (
          <>
            <Pressable
              onPress={handleFinishFree}
              className="w-full bg-brand-navy py-4 rounded-xl flex-row items-center justify-center gap-2 border border-brand-navy-dark shadow-xs active:opacity-95"
            >
              <Text className="font-geist-semibold text-sm text-white">
                Start Free (No Card Required)
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
            <Text className="font-inter text-[11px] text-content-muted text-center mt-2">
              Includes 2 groups + real-time alerts. Upgrade anytime in Settings.
            </Text>
          </>
        ) : (
          <>
            <Pressable
              onPress={handlePurchasePro}
              disabled={isPurchasing}
              className={`w-full bg-brand-navy py-4 rounded-xl flex-row items-center justify-center gap-2 border border-brand-navy-dark shadow-xs ${
                isPurchasing ? 'opacity-60' : 'active:opacity-95'
              }`}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text className="font-geist-semibold text-sm text-white">
                    Start Pro (7-Day Trial)
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => setSelectedPlan('free')}
              className="py-2.5 items-center justify-center mt-1"
            >
              <Text className="font-geist-medium text-xs text-content-secondary">
                Or continue with Free Plan
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

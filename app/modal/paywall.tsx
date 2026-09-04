import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  ShieldCheck,
  Crown,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import {
  purchaseSubscriptionPackage,
  restoreRevenueCatPurchases,
} from '../../src/services/purchases/revenueCat';

type BillingCycle = 'monthly' | 'annual';

export default function PaywallModal() {
  const router = useRouter();
  const { status, setTier } = useSubscriptionStore();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const selectedPackageId = billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';

  const handlePurchase = async () => {
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
        Alert.alert(
          'Mikana Pro Activated',
          'Your Pro entitlements are active. You can now monitor up to 15 WhatsApp groups with 24/7 Autopilot quote dispatching.',
          [{ text: 'Start Closing Deals', onPress: () => router.back() }]
        );
      } else if (result.error) {
        Alert.alert('Subscription Notice', result.error);
      }
    } catch (e: any) {
      // Fallback: If store fails, allow instant simulated activation
      Alert.alert(
        'Purchase Simulation',
        'Store purchase failed or running in development without billing. Would you like to activate Pro in Demo Mode?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate Pro (Demo)',
            onPress: () => {
              setTier(billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
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
        Alert.alert('Purchases Restored', 'Your Pro subscription has been restored.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'No active subscription was found on this store account.');
      }
    } catch (e) {
      Alert.alert('Restore Failed', 'Unable to restore purchases at this time.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-canvas">
        <View>
          <Text className="font-geist-bold text-lg text-content-heading">
            Upgrade to Pro
          </Text>
          <Text className="font-inter text-xs text-content-secondary">
            Unlock all 15 trade channels & 24/7 Autopilot
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface-elevated items-center justify-center active:bg-slate-200"
          hitSlop={8}
        >
          <X size={18} color="#486581" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Indicator */}
        <View className="flex-row items-center gap-2 bg-surface border border-border px-3.5 py-2 rounded-xl mb-5 self-center shadow-2xs">
          <View
            className={`w-2 h-2 rounded-full ${
              status.isPro ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          <Text className="font-inter text-xs text-content-secondary">
            Current Plan:{' '}
            <Text className="font-geist-bold text-content-heading">
              {status.isPro
                ? status.tier === 'pro_annual'
                  ? 'Pro Annual (Active)'
                  : 'Pro Monthly (Active)'
                : 'Free Tier (2 Channels)'}
            </Text>
          </Text>
        </View>

        {/* Hero Section */}
        <View className="items-center mb-5">
          <View className="w-12 h-12 rounded-2xl bg-brand-blue-tint border border-brand-blue-border items-center justify-center mb-2.5">
            <Crown size={24} color="#1E56A0" strokeWidth={2} />
          </View>
          <Text className="font-geist-bold text-xl text-content-heading text-center mb-1 tracking-tight">
            Mikana Pro Trader
          </Text>
          <Text className="font-inter text-xs text-content-secondary text-center leading-5 max-w-[300px]">
            Scale your pipeline by monitoring 15 trade channels simultaneously with 24/7 Autopilot quote dispatch.
          </Text>
        </View>

        {/* Pro Billing Cycle Toggle */}
        <View className="flex-row p-1 bg-surface-elevated border border-border rounded-xl mb-5">
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
            className={`flex-1 py-2 rounded-lg items-center justify-center flex-row gap-1 ${
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
            <View className="bg-amber-100 px-1 py-0.5 rounded">
              <Text className="font-geist-bold text-[8px] text-amber-800">
                -35%
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Pro Card */}
        <View className="bg-surface border-2 border-brand-blue rounded-2xl p-5 mb-5 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <Text className="font-geist-semibold text-[10px] text-amber-800 uppercase tracking-wider">
                Full Access
              </Text>
            </View>
            <Text className="font-inter text-xs text-brand-blue font-geist-medium">
              Cancel Anytime
            </Text>
          </View>

          <View className="flex-row items-baseline mb-3">
            <Text className="font-geist-bold text-3xl text-brand-navy">
              {billingCycle === 'monthly' ? '$9.99' : '$79.99'}
            </Text>
            <Text className="font-inter text-xs text-content-secondary ml-1.5">
              {billingCycle === 'monthly' ? '/ month' : '/ year ($6.66/mo)'}
            </Text>
          </View>

          <View className="h-px bg-border mb-4" />

          <View className="gap-3">
            {[
              {
                title: '15 Monitored Trade Channels',
                desc: 'Expand from 2 to 15 concurrent WhatsApp trade groups',
              },
              {
                title: '24/7 Offline Lead Autopilot',
                desc: 'Autonomous matching & quote drafting while you are offline',
              },
              {
                title: 'Priority Gemini Flash AI Engine',
                desc: 'Sub-second buyer intent and requirement extraction',
              },
              {
                title: 'Unlimited Pipeline CRM & Export',
                desc: 'Full deal tracking, customer contacts, and CSV export',
              },
            ].map((f, i) => (
              <View key={i} className="flex-row items-start gap-2.5">
                <View className="w-4 h-4 rounded-full bg-brand-blue items-center justify-center mt-0.5">
                  <Check size={10} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="font-geist-semibold text-xs text-content-heading">
                    {f.title}
                  </Text>
                  <Text className="font-inter text-[11px] text-content-secondary leading-4">
                    {f.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Purchase CTA */}
        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing}
          className={`w-full bg-brand-navy py-4 rounded-xl flex-row items-center justify-center gap-2 border border-brand-navy-dark shadow-xs mb-3 ${
            isPurchasing ? 'opacity-60' : 'active:opacity-95'
          }`}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text className="font-geist-semibold text-sm text-white">
                {status.isPro
                  ? `Active on Pro (${billingCycle === 'annual' ? '$79.99/yr' : '$9.99/mo'})`
                  : billingCycle === 'monthly'
                  ? 'Unlock Pro — $9.99 / month'
                  : 'Unlock Pro Annual — $79.99 / year'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
            </>
          )}
        </Pressable>

        {/* Keep Free Tier Link */}
        <Pressable
          onPress={() => router.back()}
          className="py-2.5 items-center justify-center mb-4"
        >
          <Text className="font-geist-medium text-xs text-content-secondary">
            Keep Free Tier (2 Groups Max)
          </Text>
        </Pressable>

        {/* Footer */}
        <View className="items-center gap-2 pt-2 border-t border-border">
          <View className="flex-row items-center gap-1.5">
            <ShieldCheck size={13} color="#1E56A0" strokeWidth={2} />
            <Text className="font-inter text-[11px] text-content-secondary">
              Secured by RevenueCat • Cancel anytime in settings
            </Text>
          </View>

          <Pressable onPress={handleRestore} disabled={isRestoring}>
            <Text className="font-inter text-xs text-content-muted underline">
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

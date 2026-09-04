import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  Zap,
  Users,
  Bot,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '../../src/theme/colors';
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
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Segmented Progress Bar (Step 6 of 6 — Complete!) */}
      <View style={styles.topProgress}>
        <View style={styles.segmentedBar}>
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
        </View>
        <View style={styles.navRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/notifications');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.stepIndicator}>Step 6 of 6 · Membership Tier</Text>
          <Pressable
            style={styles.skipButton}
            onPress={handleFinishFree}
            accessibilityRole="button"
            accessibilityLabel="Skip to Free"
          >
            <Text style={styles.skipText}>Start Free</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Zero-Risk Freemium Guarantee */}
        <View style={styles.header}>
          <View style={styles.guaranteeBadge}>
            <ShieldCheck size={13} color={colors.accentBlue} strokeWidth={2} />
            <Text style={styles.guaranteeBadgeText}>No Credit Card Required</Text>
          </View>
          <Text style={styles.heading}>Start Free, Scale as You Win Deals</Text>
          <Text style={styles.subtext}>
            Catch live WhatsApp leads at zero cost. Upgrade to Autopilot whenever you want 24/7 quote dispatching.
          </Text>
        </View>

        {/* Plan 1: Mikana Free (Default / Selected) */}
        <Pressable
          style={[
            styles.planCard,
            selectedPlan === 'free' && styles.planCardSelected,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedPlan('free');
          }}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedPlan === 'free' }}
        >
          <View style={styles.planCardHeader}>
            <View>
              <View style={styles.pillRow}>
                <View style={styles.freePill}>
                  <Text style={styles.freePillText}>Freemium · Zero Risk</Text>
                </View>
              </View>
              <Text style={styles.planName}>Mikana Free</Text>
              <Text style={styles.planDescription}>
                Best for individual merchants & contractors getting started
              </Text>
            </View>
            <View style={[styles.radioCircle, selectedPlan === 'free' && styles.radioCircleSelected]}>
              {selectedPlan === 'free' && <View style={styles.radioDot} />}
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>$0</Text>
            <Text style={styles.priceUnit}> / forever</Text>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.planFeatures}>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>Monitor up to 2 WhatsApp trade groups</Text>
            </View>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>Real-time sub-second buyer RFQ alerts</Text>
            </View>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>AI proposal & quote drafting</Text>
            </View>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>Manual quote review and DM dispatch</Text>
            </View>
          </View>
        </Pressable>

        {/* Plan 2: Mikana Pro (Optional Upgrade) */}
        <Pressable
          style={[
            styles.planCard,
            selectedPlan === 'pro' && styles.planCardSelected,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedPlan('pro');
          }}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedPlan === 'pro' }}
        >
          <View style={styles.planCardHeader}>
            <View>
              <View style={styles.pillRow}>
                <View style={styles.proPill}>
                  <Crown size={11} color={colors.brandNavy} strokeWidth={2} />
                  <Text style={styles.proPillText}>Maximum Growth</Text>
                </View>
              </View>
              <Text style={styles.planName}>Mikana Pro</Text>
              <Text style={styles.planDescription}>
                For established suppliers, distributors, and high-volume traders
              </Text>
            </View>
            <View style={[styles.radioCircle, selectedPlan === 'pro' && styles.radioCircleSelected]}>
              {selectedPlan === 'pro' && <View style={styles.radioDot} />}
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>$9.99</Text>
            <Text style={styles.priceUnit}> / month (or $79.99/yr)</Text>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.planFeatures}>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>Monitor up to 15 WhatsApp trade groups</Text>
            </View>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>
                24/7 Autonomous Autopilot quote dispatching
              </Text>
            </View>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>
                Priority Gemini Flash extraction & scoring
              </Text>
            </View>
            <View style={styles.featureLine}>
              <Check size={14} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.featureLineText}>
                Unlimited deal pipeline CRM & export
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Restore Purchases Link */}
        <View style={styles.restoreRow}>
          <Pressable onPress={handleRestore} disabled={isRestoring}>
            <Text style={styles.restoreText}>
              {isRestoring ? 'Restoring...' : 'Already subscribed? Restore Purchases'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Docked CTA Footer */}
      <View style={styles.ctaContainer}>
        {selectedPlan === 'free' ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handleFinishFree}
              accessibilityRole="button"
              accessibilityLabel="Start Free - No Card Required"
            >
              <Text style={styles.ctaButtonText}>Start Free (No Card Required)</Text>
              <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
            </Pressable>
            <Text style={styles.ctaHintText}>
              Includes 2 groups + real-time alerts. Upgrade anytime in Settings.
            </Text>
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                isPurchasing && styles.ctaButtonDisabled,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handlePurchasePro}
              disabled={isPurchasing}
              accessibilityRole="button"
              accessibilityLabel="Start Pro Subscription"
            >
              {isPurchasing ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <>
                  <Text style={styles.ctaButtonText}>Start Pro (7-Day Trial)</Text>
                  <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
                </>
              )}
            </Pressable>
            <Pressable
              style={styles.switchFreeLink}
              onPress={() => setSelectedPlan('free')}
            >
              <Text style={styles.switchFreeText}>Or continue with Free Plan</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  topProgress: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  segmentedBar: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  segmentFilled: { backgroundColor: colors.brandNavy },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: spacing.xs, marginLeft: -spacing.xs },
  stepIndicator: { fontFamily: 'Geist_500Medium', fontSize: 12, color: colors.textMuted },
  skipButton: { padding: spacing.xs, marginRight: -spacing.xs },
  skipText: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: colors.accentBlue },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: { marginBottom: spacing.lg },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  guaranteeBadgeText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
    color: colors.accentBlue,
  },
  heading: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    color: colors.textHeading,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  planCardSelected: {
    borderColor: colors.brandNavy,
    backgroundColor: colors.surface,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pillRow: { marginBottom: 4 },
  freePill: {
    backgroundColor: colors.accentBlueTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  freePillText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 10,
    color: colors.accentBlue,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  proPillText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 10,
    color: colors.brandNavy,
  },
  planName: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  planDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 240,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  radioCircleSelected: {
    borderColor: colors.brandNavy,
    backgroundColor: colors.surface,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandNavy,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  priceAmount: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  priceUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  featureDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  planFeatures: { gap: 8 },
  featureLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureLineText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textPrimary,
  },
  restoreRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  restoreText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  ctaContainer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.canvas,
    gap: spacing.xs,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brandNavy,
    paddingVertical: 15,
    borderRadius: radius.md,
  },
  ctaButtonDisabled: { opacity: 0.5 },
  ctaButtonPressed: { opacity: 0.88 },
  ctaButtonText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.textInverse },
  ctaHintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  switchFreeLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  switchFreeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.accentBlue,
  },
});

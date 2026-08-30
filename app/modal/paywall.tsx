import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import {
  getRevenueCatPackages,
  purchaseSubscriptionPackage,
  restoreRevenueCatPurchases,
} from '../../src/services/purchases/revenueCat';
import { PaywallPackage } from '../../src/types/subscription';
import { PricingCard } from '../../src/components/paywall/PricingCard';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import {
  X,
  ShieldCheck,
  Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function PaywallModal() {
  const router = useRouter();
  const { status, setTier } = useSubscriptionStore();

  const [packages, setPackages] = useState<PaywallPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pro_annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    async function loadPackages() {
      const pkgs = await getRevenueCatPackages();
      setPackages(pkgs);
      if (pkgs.length > 0) {
        const annual = pkgs.find((p) => p.packageType === 'ANNUAL');
        setSelectedPackageId(annual ? annual.identifier : pkgs[0].identifier);
      }
    }
    loadPackages();
  }, []);

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
          'Welcome to Mikana Pro',
          'Your Pro entitlements are active. You now have unlimited lead radar sweeps and 24/7 offline Autopilot.',
          [{ text: 'Start Closing Deals', onPress: () => router.back() }]
        );
      } else if (result.error) {
        Alert.alert('Subscription Notice', result.error);
      }
    } catch (e: any) {
      Alert.alert('Purchase Error', e?.message || 'Unable to process purchase.');
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
        Alert.alert('Purchases Restored', 'Your Pro subscription has been restored.');
        router.back();
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
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mikana Pro</Text>
          <Text style={styles.headerSub}>RevenueCat Subscriptions</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Value Prop Banner */}
        <View style={styles.heroSection}>
          <View style={styles.crownCircle}>
            <Crown size={28} color={colors.brandNavy} />
          </View>
          <Text style={styles.heroTitle}>Close High-Ticket WhatsApp Deals</Text>
          <Text style={styles.heroSubtitle}>
            Unlock 24/7 Autopilot dispatching, unlimited AI proposals, and automated deal pipeline tracking.
          </Text>
        </View>

        {/* Pricing Cards */}
        <View style={styles.packagesContainer}>
          {packages.map((pkg) => (
            <PricingCard
              key={pkg.identifier}
              pkg={pkg}
              isSelected={selectedPackageId === pkg.identifier}
              onSelect={() => setSelectedPackageId(pkg.identifier)}
              isPopular={pkg.packageType === 'ANNUAL'}
            />
          ))}
        </View>

        {/* Purchase CTA */}
        <Button
          size="lg"
          variant="primary"
          onPress={handlePurchase}
          loading={isPurchasing}
          style={styles.subscribeBtn}
        >
          {status.isSandboxMode ? 'Activate Pro Access (Sandbox Mode)' : 'Subscribe via App Store'}
        </Button>

        {/* Restore & Terms */}
        <View style={styles.footerRow}>
          <TouchableOpacity onPress={handleRestore} disabled={isRestoring}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>•</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.restoreText}>Terms & Privacy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trustBadge}>
          <ShieldCheck size={14} color={colors.emerald} />
          <Text style={styles.trustText}>Secured by RevenueCat • Cancel anytime</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  crownCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  packagesContainer: {
    marginBottom: 16,
  },
  subscribeBtn: {
    width: '100%',
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  restoreText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  footerDot: {
    color: colors.borderStrong,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 6,
  },
  trustText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

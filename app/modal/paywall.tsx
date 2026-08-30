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
import { Badge } from '../../src/components/ui/Badge';
import {
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle,
  Crown,
  Lock,
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
          [{ text: 'Start Winning Deals', onPress: () => router.back() }]
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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <X size={18} color="#f4f4f5" />
        </TouchableOpacity>

        <View style={styles.headerBadge}>
          <Crown size={13} color="#f59e0b" />
          <Text style={styles.headerBadgeText}>PRO SUBSCRIPTION</Text>
        </View>

        <View style={styles.spacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero Title */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Win Deals Before Competitors Notice</Text>
          <Text style={styles.heroSubtitle}>
            Unlock 24/7 autonomous WhatsApp lead interception, Gemini AI sales proposals, and offline Autopilot.
          </Text>
        </View>

        {/* Value Proposition Bullets */}
        <View style={styles.valueBox}>
          <View style={styles.valueItem}>
            <CheckCircle size={15} color="#10b981" />
            <Text style={styles.valueText}>
              <Text style={styles.bold}>Unlimited Lead Interception:</Text> Monitor unlimited WhatsApp & Telegram business groups.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <CheckCircle size={15} color="#10b981" />
            <Text style={styles.valueText}>
              <Text style={styles.bold}>24/7 Offline Autopilot:</Text> Auto-dispatches tailored pitches even when your phone is asleep.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <CheckCircle size={15} color="#10b981" />
            <Text style={styles.valueText}>
              <Text style={styles.bold}>Gemini Flash Pitch Engine:</Text> Custom-grounded quotes with deliverables & portfolio links.
            </Text>
          </View>
          <View style={styles.valueItem}>
            <CheckCircle size={15} color="#10b981" />
            <Text style={styles.valueText}>
              <Text style={styles.bold}>Instant Push Radar:</Text> High-priority haptic alerts the second 90%+ matching deals drop.
            </Text>
          </View>
        </View>

        {/* Pricing Packages */}
        <Text style={styles.packagesHeader}>Select Plan</Text>

        {packages.map((pkg) => (
          <PricingCard
            key={pkg.identifier}
            pkg={pkg}
            isSelected={selectedPackageId === pkg.identifier}
            onSelect={() => setSelectedPackageId(pkg.identifier)}
            isPopular={pkg.packageType === 'ANNUAL'}
          />
        ))}

        {/* Action Button */}
        <View style={styles.actionWrapper}>
          <Button
            size="lg"
            variant="primary"
            loading={isPurchasing}
            icon={<Sparkles size={16} color="#09090b" />}
            onPress={handlePurchase}
          >
            {status.isSandboxMode ? 'Unlock Now (Demo / Sandbox)' : 'Continue to Subscribe'}
          </Button>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleRestore}
            style={styles.restoreBtn}
          >
            <Text style={styles.restoreText}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Recurring billing. Cancel anytime in App Store or Google Play. Powered by RevenueCat.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#18181b',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
  spacer: {
    width: 32,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f4f4f5',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
  },
  valueBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#18181b',
    gap: 10,
    marginBottom: 20,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  valueText: {
    fontSize: 12,
    color: '#d4d4d8',
    flex: 1,
    lineHeight: 17,
  },
  bold: {
    fontWeight: '700',
    color: '#f4f4f5',
  },
  packagesHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  actionWrapper: {
    marginTop: 10,
    gap: 10,
    alignItems: 'center',
  },
  restoreBtn: {
    paddingVertical: 6,
  },
  restoreText: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 11,
    color: '#52525b',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});

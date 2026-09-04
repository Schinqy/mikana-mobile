import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  ShieldCheck,
  Zap,
  MessageSquare,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { colors, spacing, radius } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { setOnboardingStage } = useAuthStore();
  const [requesting, setRequesting] = useState(false);

  const proceedToPaywall = useCallback(() => {
    setOnboardingStage('notifications');
    router.push('/onboarding/paywall');
  }, [setOnboardingStage, router]);

  const handleEnable = async () => {
    setRequesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      }
    } catch {
      // Non-fatal on simulator or restricted permissions
    } finally {
      setRequesting(false);
      proceedToPaywall();
    }
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    proceedToPaywall();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Segmented Progress Bar (Step 5 of 6) */}
      <View style={styles.topProgress}>
        <View style={styles.segmentedBar}>
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={styles.segment} />
        </View>
        <View style={styles.navRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/groups');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.stepIndicator}>Step 5 of 6 · Instant Alerts</Text>
          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Never miss a live deal</Text>
          <Text style={styles.subtext}>
            In WhatsApp groups, the first merchant to answer an RFQ closes the deal 70% of the time.
          </Text>
        </View>

        {/* Realistic Push Notification Mockup Card */}
        <View style={styles.mockCard}>
          <View style={styles.mockHeader}>
            <View style={styles.mockAppBadge}>
              <Text style={styles.mockAppBadgeText}>M</Text>
            </View>
            <Text style={styles.mockAppName}>MIKANA RADAR</Text>
            <Text style={styles.mockTime}>Just now</Text>
          </View>
          <Text style={styles.mockTitle}>High-Value Buyer RFQ (98% Match)</Text>
          <Text style={styles.mockBody}>
            "Looking for 50 bags white maize or sugar beans in Msasa. Urgent delivery needed today."
          </Text>
          <View style={styles.mockPillRow}>
            <View style={styles.mockPill}>
              <Sparkles size={11} color={colors.accentBlue} strokeWidth={2} />
              <Text style={styles.mockPillText}>AI Quote Draft Ready</Text>
            </View>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <BellRing size={16} color={colors.accentBlue} strokeWidth={2} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Sub-Second Lead Interception</Text>
              <Text style={styles.featureDesc}>
                Get alerted the second a buyer posts in your groups, before competitors see it.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <ShieldCheck size={16} color={colors.accentBlue} strokeWidth={2} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Zero Spam Guarantee</Text>
              <Text style={styles.featureDesc}>
                Layer 0 filters out 95% of chatter, memes, and stickers. You only get alerted for real buyer demand.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Zap size={16} color={colors.accentBlue} strokeWidth={2} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>One-Tap Direct Quote Dispatch</Text>
              <Text style={styles.featureDesc}>
                Tapping the notification opens a calibrated quote ready to send to the buyer's DM.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Docked CTA Footer */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            requesting && styles.ctaButtonDisabled,
            pressed && styles.ctaButtonPressed,
          ]}
          onPress={handleEnable}
          disabled={requesting}
          accessibilityRole="button"
          accessibilityLabel="Enable Notifications"
        >
          <Text style={styles.ctaButtonText}>
            {requesting ? 'Enabling...' : 'Enable Real-Time Alerts'}
          </Text>
          <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
        </Pressable>

        <Pressable
          style={styles.maybeLaterButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Maybe Later"
        >
          <Text style={styles.maybeLaterText}>Maybe Later</Text>
        </Pressable>
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
  content: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.lg },
  header: { marginBottom: spacing.lg },
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
  mockCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 6,
  },
  mockAppBadge: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.brandNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockAppBadgeText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 10,
    color: colors.textInverse,
  },
  mockAppName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  mockTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  mockTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  mockBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  mockPillRow: { flexDirection: 'row' },
  mockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentBlueTint,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
  },
  mockPillText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: colors.accentBlue,
  },
  featuresList: { gap: spacing.md },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextBox: { flex: 1 },
  featureTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 1,
  },
  featureDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
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
  maybeLaterButton: { paddingVertical: spacing.xs, alignItems: 'center' },
  maybeLaterText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },
});

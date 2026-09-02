import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Zap, Shield, Globe, MessageSquare } from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/theme/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  // Staggered fade and slide animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const cardScale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 1. Header Wordmark + Status Pill */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>MIKANA</Text>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>AI LEAD RADAR</Text>
        </View>
      </View>

      {/* 2. Headline & Value Proposition */}
      <Animated.View
        style={[
          styles.heroBlock,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.headline}>
          {"Never miss a customer\nin your WhatsApp groups."}
        </Text>
        <Text style={styles.subtext}>
          Mikana watches your chosen group chats 24/7. The moment someone asks for what you offer, you get alerted first.
        </Text>
      </Animated.View>

      {/* 3. The Central Signal Artifact (Transformation Showcase) */}
      <Animated.View
        style={[
          styles.artifactWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <View style={styles.artifactCard}>
          {/* Top: Incoming WhatsApp Noise */}
          <View style={styles.noiseSection}>
            <View style={styles.chatMetaRow}>
              <View style={styles.chatIconBadge}>
                <MessageSquare size={12} color="#15803D" strokeWidth={2} />
              </View>
              <Text style={styles.chatGroupName} numberOfLines={1}>
                Commercial Suppliers & Trade
              </Text>
              <Text style={styles.chatTime}>Just now</Text>
            </View>
            <Text style={styles.chatSender}>David K.</Text>
            <Text style={styles.chatSnippet} numberOfLines={2}>
              {'"Looking for a verified supplier who can dispatch 50 commercial units by Friday. Immediate PO ready."'}
            </Text>
          </View>

          {/* Central AI Bridge */}
          <View style={styles.bridgeRow}>
            <View style={styles.bridgeLine} />
            <View style={styles.bridgeBadge}>
              <Zap size={11} color={colors.accentBlue} strokeWidth={2.5} />
              <Text style={styles.bridgeText}>AI MATCHED · 0.4s</Text>
            </View>
            <View style={styles.bridgeLine} />
          </View>

          {/* Bottom: Extracted Opportunity Signal */}
          <View style={styles.signalSection}>
            <View style={styles.signalHeader}>
              <View style={styles.matchPill}>
                <Text style={styles.matchPillText}>98% MATCH</Text>
              </View>
              <View style={styles.urgencyPill}>
                <Text style={styles.urgencyPillText}>HIGH INTENT</Text>
              </View>
            </View>

            <Text style={styles.signalTitle} numberOfLines={1}>
              50 Commercial Units Required
            </Text>
            <Text style={styles.signalDetails} numberOfLines={1}>
              Equipment & Supplies · Deadline: Friday · PO Ready
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* 4. Three Universal Signal Highlights (Compact single-line grid) */}
      <View style={styles.featuresRow}>
        <View style={styles.featureItem}>
          <Globe size={14} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.featureLabel}>Any Language</Text>
        </View>
        <View style={styles.featureDivider} />
        <View style={styles.featureItem}>
          <Shield size={14} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.featureLabel}>Whitelisted Only</Text>
        </View>
        <View style={styles.featureDivider} />
        <View style={styles.featureItem}>
          <Zap size={14} color={colors.textSecondary} strokeWidth={1.75} />
          <Text style={styles.featureLabel}>Instant Alerts</Text>
        </View>
      </View>

      {/* 5. Docked Action Zone */}
      <View style={styles.actionZone}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
          onPress={() => router.push('/onboarding/discover')}
          accessibilityRole="button"
          accessibilityLabel="Start Capturing Opportunities"
        >
          <Text style={styles.primaryButtonText}>Start Capturing Opportunities</Text>
          <ArrowRight size={17} color={colors.textInverse} strokeWidth={2} />
        </Pressable>
        <Text style={styles.disclaimerText}>
          Free tier included · Connects in 60 seconds
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },

  // 1. Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  brandTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.brandNavy,
    letterSpacing: 1.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  statusText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },

  // 2. Hero Typography
  heroBlock: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headline: {
    fontFamily: 'Geist_700Bold',
    fontSize: 25,
    lineHeight: 31,
    color: colors.textHeading,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  // 3. Central Signal Artifact
  artifactWrapper: {
    marginVertical: spacing.sm,
  },
  artifactCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#07182E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  noiseSection: {
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
  },
  chatMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  chatIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatGroupName: {
    flex: 1,
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    color: colors.textPrimary,
  },
  chatTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  chatSender: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  chatSnippet: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Bridge
  bridgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 24,
  },
  bridgeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  bridgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bridgeText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 9,
    color: colors.accentBlue,
    letterSpacing: 0.4,
  },

  // Signal
  signalSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  matchPill: {
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  matchPillText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 10,
    color: colors.accentBlue,
    letterSpacing: 0.4,
  },
  urgencyPill: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  urgencyPillText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 10,
    color: colors.amber,
    letterSpacing: 0.4,
  },
  signalTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  signalDetails: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },

  // 4. Feature Highlights
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: colors.textSecondary,
  },
  featureDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },

  // 5. Action Zone
  actionZone: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brandNavy,
    paddingVertical: 15,
    borderRadius: radius.md,
    shadowColor: colors.brandNavy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  disclaimerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
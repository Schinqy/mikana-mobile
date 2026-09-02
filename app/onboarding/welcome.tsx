import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Zap, Clock } from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/theme/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(18)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(24)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(heroY, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.delay(60),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>Mikana</Text>
        </View>

        <Animated.View style={[styles.heroSection, { opacity: heroOpacity, transform: [{ translateY: heroY }] }]}>
          <Text style={styles.heroHeading}>{"Your WhatsApp groups are full of\npaying customers."}</Text>
          <Text style={styles.heroSubtext}>
            Mikana watches your groups and surfaces the opportunities that match what you offer — before anyone else replies.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.demoSection, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
          <View style={styles.rawMessageCard}>
            <View style={styles.rawMessageHeader}>
              <View style={styles.groupDot} />
              <Text style={styles.rawMessageGroupName}>Harare Business Hub</Text>
              <Text style={styles.rawMessageTime}>2 min ago</Text>
            </View>
            <Text style={styles.rawMessageSender}>Tatenda M.</Text>
            <Text style={styles.rawMessageText}>
              {'"Guys anyone know someone who can install a 5kVA inverter in Avondale today? Urgent pls"'}
            </Text>
          </View>

          <View style={styles.arrowRow}>
            <View style={styles.arrowLine} />
            <Zap size={14} color={colors.accentBlue} strokeWidth={2} />
            <View style={styles.arrowLine} />
          </View>

          <View style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <View style={styles.urgentPill}>
                <Text style={styles.urgentPillText}>URGENT</Text>
              </View>
              <Text style={styles.matchScore}>96% match</Text>
            </View>
            <Text style={styles.matchTitle}>5kVA Inverter Installation</Text>
            <Text style={styles.matchMeta}>Avondale · Solar & Electrical · 2 min ago</Text>
            <View style={styles.matchDivider} />
            <View style={styles.matchFooter}>
              <Clock size={12} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.matchFooterText}>Reply within 5 min to be first</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.valueList, { opacity: ctaOpacity }]}>
          {[
            'Monitors your selected groups 24/7',
            'Understands Shona, Ndebele & English',
            'Alerts you the moment a match appears',
          ].map((line, i) => (
            <View key={i} style={styles.valueRow}>
              <View style={styles.valueDot} />
              <Text style={styles.valueText}>{line}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.ctaContainer, { opacity: ctaOpacity }]}>
        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          onPress={() => router.push('/onboarding/discover')}
          accessibilityRole="button"
          accessibilityLabel="Find opportunities like this"
        >
          <Text style={styles.ctaButtonText}>Find opportunities like this</Text>
          <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
        </Pressable>
        <Text style={styles.ctaDisclaimer}>Free to start · No credit card required</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scroll: { paddingHorizontal: spacing.xxl, paddingBottom: 130 },
  wordmarkRow: { paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  wordmark: { fontFamily: 'Geist_700Bold', fontSize: 15, color: colors.brandNavy, letterSpacing: 0.5 },
  heroSection: { marginBottom: spacing.xxxl },
  heroHeading: { fontFamily: 'Geist_700Bold', fontSize: 26, lineHeight: 33, color: colors.textHeading, marginBottom: spacing.md, letterSpacing: -0.4 },
  heroSubtext: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  demoSection: { marginBottom: spacing.xxxl },
  rawMessageCard: { backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  rawMessageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, gap: spacing.xs },
  groupDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#25D366' },
  rawMessageGroupName: { fontFamily: 'Geist_500Medium', fontSize: 11, color: colors.textMuted, flex: 1, letterSpacing: 0.2 },
  rawMessageTime: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.textMuted },
  rawMessageSender: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: colors.textPrimary, marginBottom: spacing.xs },
  rawMessageText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.textSecondary, fontStyle: 'italic' },
  arrowRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.sm, paddingHorizontal: spacing.xl },
  arrowLine: { flex: 1, height: 1, backgroundColor: colors.accentBlueBorder },
  matchCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.accentBlueBorder, borderRadius: radius.md, padding: spacing.lg },
  matchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  urgentPill: { backgroundColor: colors.roseBg, borderWidth: 1, borderColor: colors.roseBorder, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  urgentPillText: { fontFamily: 'Geist_600SemiBold', fontSize: 10, color: colors.rose, letterSpacing: 0.5 },
  matchScore: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: colors.accentBlue },
  matchTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.textPrimary, marginBottom: spacing.xs },
  matchMeta: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary },
  matchDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  matchFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  matchFooterText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  valueList: { gap: spacing.md, marginBottom: spacing.xxxl },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  valueDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accentBlue },
  valueText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl, alignItems: 'center', gap: spacing.md },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brandNavy, paddingVertical: 15, borderRadius: radius.md, width: '100%' },
  ctaButtonPressed: { opacity: 0.88 },
  ctaButtonText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.textInverse, letterSpacing: 0.1 },
  ctaDisclaimer: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});

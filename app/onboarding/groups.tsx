import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  Lock,
  Users,
  ArrowRight,
  ArrowLeft,
  Crown,
  RefreshCw,
  MessageSquare,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '../../src/theme/colors';
import { resolveRelayUrl, fetchGroups } from '../../src/services/relay/whatsappRelay';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

const FREE_GROUP_LIMIT = 2;
const FETCH_TIMEOUT_MS = 8000;

interface GroupItem {
  id: string;
  jid: string;
  name: string;
  participantCount: number;
}

export default function GroupsScreen() {
  const router = useRouter();
  const { setOnboardingStage } = useAuthStore();
  const { whatsappRelayUrl, setRadarChannels } = useSettingsStore();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [sessionId] = useState('user_default');

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setIsTimedOut(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
      setIsTimedOut(true);
      setLoading(false);
    }, FETCH_TIMEOUT_MS);

    try {
      const url = resolveRelayUrl(whatsappRelayUrl);
      const raw = await fetchGroups(url, sessionId);
      clearTimeout(timeoutId);

      if (Array.isArray(raw)) {
        setGroups(
          raw.map((g: any) => ({
            id: g.id,
            jid: g.id,
            name: g.name || g.id,
            participantCount: g.participantCount || 0,
          }))
        );
      } else {
        setGroups([]);
      }
    } catch {
      clearTimeout(timeoutId);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [whatsappRelayUrl, sessionId]);

  useEffect(() => {
    loadGroups();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadGroups]);

  const toggleGroup = useCallback((jid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(jid)) {
        next.delete(jid);
      } else {
        if (next.size >= FREE_GROUP_LIMIT) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.push('/modal/paywall');
          return prev;
        }
        next.add(jid);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return next;
    });
  }, [router]);

  const handleActivate = useCallback(async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const selectedJids = Array.from(selected);
    setRadarChannels(selectedJids);
    setOnboardingStage('groups');

    router.push('/onboarding/notifications');
  }, [selected, setRadarChannels, setOnboardingStage, router]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    setRadarChannels([]);
    setOnboardingStage('groups');
    router.push('/onboarding/notifications');
  }, [setRadarChannels, setOnboardingStage, router]);

  const renderGroup = ({ item }: { item: GroupItem }) => {
    const isSelected = selected.has(item.jid);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.groupRow,
          isSelected && styles.groupRowSelected,
          pressed && styles.groupRowPressed,
        ]}
        onPress={() => toggleGroup(item.jid)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
      >
        <View style={styles.groupInfo}>
          <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.groupMeta}>
            <Users size={11} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.groupMetaText}>{item.participantCount} members</Text>
          </View>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={13} color={colors.textInverse} strokeWidth={2.5} />}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Segmented Progress Bar & Skip */}
      <View style={styles.topProgress}>
        <View style={styles.segmentedBar}>
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={[styles.segment, styles.segmentFilled]} />
          <View style={styles.segment} />
          <View style={styles.segment} />
        </View>
        <View style={styles.navRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/pair');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.75} />
          </Pressable>
          <Text style={styles.stepIndicator}>Step 4 of 6 · Trade Groups</Text>
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

      <View style={styles.header}>
        <Text style={styles.heading}>Choose your radar channels</Text>
        <Text style={styles.subtext}>
          Which WhatsApp trade groups should Mikana monitor for buyer leads?
        </Text>
      </View>

      {/* Privacy Banner */}
      <View style={styles.privacyBanner}>
        <Lock size={13} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={styles.privacyText}>
          Mikana only monitors groups you explicitly select. Personal chats and unselected groups are never accessed.
        </Text>
      </View>

      {/* Free Plan Quota */}
      {groups.length > 0 && (
        <View style={styles.limitRow}>
          <Text style={styles.limitText}>
            Free tier: up to {FREE_GROUP_LIMIT} groups monitored
          </Text>
          <Pressable style={styles.proLink} onPress={() => router.push('/modal/paywall')}>
            <Crown size={12} color={colors.accentBlue} strokeWidth={1.5} />
            <Text style={styles.proLinkText}>Upgrade for 15</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map(key => (
            <View key={key} style={styles.skeletonRow}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonTextCol}>
                <View style={[styles.skeletonLine, { width: '68%', height: 14 }]} />
                <View style={[styles.skeletonLine, { width: '38%', height: 10, marginTop: 6 }]} />
              </View>
              <View style={styles.skeletonCheckbox} />
            </View>
          ))}
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MessageSquare size={24} color={colors.textSecondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>
            {isTimedOut ? 'Connection timed out' : 'No WhatsApp groups detected'}
          </Text>
          <Text style={styles.emptySubtext}>
            {isTimedOut
              ? 'Could not reach the WhatsApp relay to retrieve groups in time. You can try again or proceed to your dashboard.'
              : 'Make sure you have joined trade groups on your paired WhatsApp. You can join groups anytime and select them in Business settings.'}
          </Text>

          <View style={styles.emptyActionsRow}>
            <Pressable
              style={styles.retryButton}
              onPress={loadGroups}
              accessibilityRole="button"
            >
              <RefreshCw size={14} color={colors.brandNavy} strokeWidth={2} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.jid}
          renderItem={renderGroup}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Docked CTA Footer */}
      <View style={styles.ctaContainer}>
        {groups.length === 0 ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handleSkip}
              accessibilityRole="button"
            >
              <Text style={styles.ctaButtonText}>Continue to Dashboard</Text>
              <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
            </Pressable>
            <Text style={styles.selectionSummary}>
              You can configure monitored groups later in Business settings
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.selectionSummary}>
              {selected.size === 0
                ? 'Select groups above or skip to finish'
                : `${selected.size} group${selected.size > 1 ? 's' : ''} selected`}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                selected.size === 0 && styles.ctaButtonSecondary,
                saving && styles.ctaButtonDisabled,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={selected.size === 0 ? handleSkip : handleActivate}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : selected.size === 0 ? (
                <>
                  <Text style={styles.ctaButtonSecondaryText}>Skip for Now</Text>
                  <ArrowRight size={18} color={colors.brandNavy} strokeWidth={2} />
                </>
              ) : (
                <>
                  <Text style={styles.ctaButtonText}>Start Watching ({selected.size}) Groups</Text>
                  <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
                </>
              )}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  topProgress: { paddingHorizontal: spacing.xxl, paddingTop: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  segmentedBar: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  segmentFilled: { backgroundColor: colors.brandNavy },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: spacing.xs, marginLeft: -spacing.xs },
  stepIndicator: { fontFamily: 'Geist_500Medium', fontSize: 12, color: colors.textMuted },
  skipButton: { padding: spacing.xs, marginRight: -spacing.xs },
  skipText: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: colors.accentBlue },
  header: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  heading: { fontFamily: 'Geist_700Bold', fontSize: 20, color: colors.textHeading, letterSpacing: -0.3, marginBottom: 2 },
  subtext: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
  privacyBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.accentBlueTint, borderBottomWidth: 1, borderBottomColor: colors.accentBlueBorder, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md },
  privacyText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  limitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  limitText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },
  proLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  proLinkText: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: colors.accentBlue },
  skeletonContainer: { flex: 1, paddingTop: spacing.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: 14, gap: spacing.md },
  skeletonAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border },
  skeletonTextCol: { flex: 1 },
  skeletonLine: { backgroundColor: colors.border, borderRadius: 4 },
  skeletonCheckbox: { width: 22, height: 22, borderRadius: radius.sm, backgroundColor: colors.border },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl, gap: spacing.sm },
  emptyIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  emptyTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 16, color: colors.textPrimary, textAlign: 'center' },
  emptySubtext: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, maxWidth: 300 },
  emptyActionsRow: { marginTop: spacing.md, flexDirection: 'row', gap: spacing.md },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  retryButtonText: { fontFamily: 'Geist_500Medium', fontSize: 13, color: colors.brandNavy },
  list: { flex: 1 },
  listContent: { paddingTop: spacing.sm },
  groupRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: 14, gap: spacing.md },
  groupRowSelected: { backgroundColor: colors.accentBlueTint },
  groupRowPressed: { backgroundColor: colors.surfaceElevated },
  groupInfo: { flex: 1 },
  groupName: { fontFamily: 'Geist_500Medium', fontSize: 14, color: colors.textPrimary, marginBottom: 2 },
  groupMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  groupMetaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  checkbox: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: colors.accentBlue, borderColor: colors.accentBlue },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.xxl },
  ctaContainer: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.canvas, gap: spacing.sm },
  selectionSummary: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brandNavy, paddingVertical: 15, borderRadius: radius.md },
  ctaButtonSecondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.brandNavy },
  ctaButtonDisabled: { opacity: 0.45 },
  ctaButtonPressed: { opacity: 0.88 },
  ctaButtonText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.textInverse },
  ctaButtonSecondaryText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.brandNavy },
});


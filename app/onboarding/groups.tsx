import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  Users,
  ArrowRight,
  ArrowLeft,
  Crown,
  RefreshCw,
  MessageSquare,
  Search,
  X,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { resolveRelayUrl, fetchGroups, setMonitoredGroups } from '../../src/services/relay/whatsappRelay';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

const FREE_GROUP_LIMIT = 2;
const FETCH_TIMEOUT_MS = 10000;

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
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [sessionId] = useState('session_user_default');

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadGroups = useCallback(async (retryCount = 0) => {
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

      if (Array.isArray(raw) && raw.length > 0) {
        setGroups(
          raw.map((g: any) => ({
            id: g.id,
            jid: g.id,
            name: g.subject || g.name || g.id,
            participantCount: g.participants || g.participantCount || 0,
          }))
        );
        setLoading(false);
      } else if (retryCount < 2) {
        setTimeout(() => {
          loadGroups(retryCount + 1);
        }, 2000);
      } else {
        setGroups([]);
        setLoading(false);
      }
    } catch {
      clearTimeout(timeoutId);
      if (retryCount < 2) {
        setTimeout(() => {
          loadGroups(retryCount + 1);
        }, 2000);
      } else {
        setGroups([]);
        setLoading(false);
      }
    }
  }, [whatsappRelayUrl, sessionId]);

  useEffect(() => {
    loadGroups(0);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadGroups]);

  const toggleGroup = useCallback((jid: string) => {
    Haptics.selectionAsync();
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(jid)) {
        next.delete(jid);
      } else {
        if (next.size >= FREE_GROUP_LIMIT) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setTimeout(() => router.push('/modal/paywall'), 50);
          return prev;
        }
        next.add(jid);
      }
      return next;
    });
  }, [router]);

  const handleActivate = useCallback(async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const selectedJids = Array.from(selectedGroupIds);
    setRadarChannels(selectedJids);

    try {
      const url = resolveRelayUrl(whatsappRelayUrl);
      await setMonitoredGroups(url, sessionId, selectedJids);
    } catch (e) {
      console.warn('Could not sync monitored groups to relay:', e);
    }

    setOnboardingStage('groups');
    router.push('/onboarding/notifications');
  }, [selectedGroupIds, setRadarChannels, whatsappRelayUrl, sessionId, setOnboardingStage, router]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    setRadarChannels([]);
    setOnboardingStage('groups');
    router.push('/onboarding/notifications');
  }, [setRadarChannels, setOnboardingStage, router]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter(g => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── 1. Top Bar & 6-Segment Progress ─────────────────────────────────── */}
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
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/pair');
              }
            }}
            style={styles.backButton}
            hitSlop={8}
          >
            <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.75} />
          </TouchableOpacity>

          <Text style={styles.stepIndicator}>Step 4 of 6 · Trade Groups</Text>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. Screen Header & Privacy ─────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.heading}>Choose your radar channels</Text>
        <Text style={styles.subtext}>
          Which WhatsApp trade groups should Mikana monitor for buyer leads?
        </Text>

        <View style={styles.privacyBanner}>
          <Lock size={13} color={colors.accentBlue} strokeWidth={1.75} />
          <Text style={styles.privacyText}>
            Mikana only reads messages in selected groups. Personal chats and calls are never accessed.
          </Text>
        </View>

        {groups.length > 0 && (
          <View style={styles.quotaRow}>
            <Text style={styles.quotaText}>
              Free tier: <Text style={styles.quotaCount}>{selectedGroupIds.size}/{FREE_GROUP_LIMIT} selected</Text>
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/modal/paywall')}
              style={styles.proPill}
              activeOpacity={0.7}
            >
              <Crown size={12} color="#B45309" strokeWidth={2} />
              <Text style={styles.proPillText}>Upgrade for 15</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── 3. Search Bar (when more than 3 groups) ─────────────────────────── */}
      {groups.length > 3 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={14} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search trade groups..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* ── 4. Content Area ─────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.brandNavy} />
          <Text style={styles.centerText}>Syncing your WhatsApp trade channels...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconCircle}>
            <MessageSquare size={24} color={colors.textSecondary} strokeWidth={1.75} />
          </View>
          <Text style={styles.emptyTitle}>
            {isTimedOut ? 'Connection Timed Out' : 'No WhatsApp Groups Detected'}
          </Text>
          <Text style={styles.centerText}>
            {isTimedOut
              ? 'Could not reach the WhatsApp relay in time. Ensure your WhatsApp phone is online.'
              : 'Make sure you have joined trade groups on your paired WhatsApp. You can join anytime and select them in Business settings.'}
          </Text>
          <View style={styles.emptyActionsRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadGroups(0)} activeOpacity={0.7}>
              <RefreshCw size={13} color={colors.surface} />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>No matching groups</Text>
          <Text style={styles.centerText}>No groups found matching "{searchQuery}"</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardGroup}>
            {filteredGroups.map((item: GroupItem, idx: number) => {
              const isSelected = selectedGroupIds.has(item.id);
              const isLast = idx === filteredGroups.length - 1;

              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => toggleGroup(item.id)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                      <Users
                        size={16}
                        color={isSelected ? colors.accentBlue : colors.textSecondary}
                        strokeWidth={1.8}
                      />
                    </View>

                    <View style={styles.rowContent}>
                      <Text style={[styles.groupName, isSelected && styles.groupNameSelected]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.groupMeta}>
                        {item.participantCount > 0 ? `${item.participantCount} members` : 'WhatsApp Group'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
                      ]}
                    >
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                    </View>
                  </TouchableOpacity>
                  {!isLast && <View style={styles.separator} />}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ── 5. Sticky Bottom Actions ────────────────────────────────────────── */}
      <View style={styles.footer}>
        {groups.length === 0 ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        ) : selectedGroupIds.size > 0 ? (
          <TouchableOpacity
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={handleActivate}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>
                  Monitor {selectedGroupIds.size} Trade Channel{selectedGroupIds.size > 1 ? 's' : ''}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Skip Channel Selection for Now</Text>
            <ArrowRight size={16} color={colors.brandNavy} strokeWidth={2} />
          </TouchableOpacity>
        )}

        <Text style={styles.footerNote}>
          You can add or change monitored channels anytime in Business settings
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topProgress: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.canvas,
  },
  segmentedBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  segmentFilled: {
    backgroundColor: colors.brandNavy,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  stepIndicator: {
    fontFamily: fonts.geist.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  skipButton: {
    padding: 4,
    marginRight: -4,
  },
  skipText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.accentBlue,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heading: {
    fontFamily: fonts.geist.bold,
    fontSize: 20,
    color: colors.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtext: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  privacyText: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  quotaText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  quotaCount: {
    fontFamily: fonts.geist.semibold,
    color: colors.textPrimary,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proPillText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 11.5,
    color: '#92400E',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 0,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  cardGroup: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowSelected: {
    backgroundColor: '#F0F6FC',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: '#E1EDF9',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  groupName: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  groupNameSelected: {
    color: colors.brandNavy,
  },
  groupMeta: {
    fontFamily: fonts.inter.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.brandNavy,
  },
  checkboxUnselected: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  centerText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionsRow: {
    marginTop: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12.5,
    color: colors.surface,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.canvas,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandNavy,
    height: 48,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    borderRadius: 12,
  },
  secondaryBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14.5,
    color: colors.textPrimary,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  footerNote: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});

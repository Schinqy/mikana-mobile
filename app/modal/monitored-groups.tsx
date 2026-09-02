import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Users,
  Check,
  Search,
  RefreshCw,
  Sliders,
  Radio,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../src/theme/colors';
import { fonts, type } from '../../src/theme/fonts';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { fetchGroups, setMonitoredGroups } from '../../src/services/relay/whatsappRelay';

interface WhatsAppGroup {
  id: string;
  subject: string;
  participants: number;
  creation?: number;
}

type FilterTab = 'all' | 'monitored' | 'unmonitored';

// Palette tints for group monogram avatars
const AVATAR_PALETTES = [
  { bg: '#EEF4FA', text: '#1E56A0', border: '#C6D8EB' }, // Blue
  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }, // Emerald
  { bg: '#F8FAFC', text: '#0B2545', border: '#CBD5E1' }, // Navy
  { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' }, // Amber
  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' }, // Violet
];

function getMonogram(name: string): string {
  if (!name) return 'GP';
  const clean = name.replace(/[^\w\s]/gi, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'GP';
}

function getAvatarPalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export default function MonitoredGroupsModal() {
  const router = useRouter();
  const { whatsappRelayUrl, radarChannels, setRadarChannels } = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const liveGroups = await fetchGroups(whatsappRelayUrl, 'session_user_default');
      setGroups(liveGroups);

      // Pre-select groups that match existing radar channels
      const matchingIds = new Set<string>();
      liveGroups.forEach((g: WhatsAppGroup) => {
        if (radarChannels.includes(g.subject) || radarChannels.includes(g.id)) {
          matchingIds.add(g.id);
        }
      });

      // If none explicitly matched, select all by default so user monitors all
      if (matchingIds.size === 0) {
        liveGroups.forEach((g: WhatsAppGroup) => matchingIds.add(g.id));
      }

      setSelectedGroupIds(matchingIds);
    } catch (err: any) {
      setError(err?.message || 'Failed to load WhatsApp groups from relay.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const toggleGroup = (id: string) => {
    Haptics.selectionAsync();
    const next = new Set(selectedGroupIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedGroupIds(next);
  };

  const selectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set<string>();
    groups.forEach((g: WhatsAppGroup) => next.add(g.id));
    setSelectedGroupIds(next);
  };

  const deselectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGroupIds(new Set());
  };

  const handleSave = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const selectedIdsArray = Array.from(selectedGroupIds);
      await setMonitoredGroups(whatsappRelayUrl, 'session_user_default', selectedIdsArray);

      // Map selected IDs to subjects for UI chips
      const selectedSubjects = groups
        .filter((g: WhatsAppGroup) => selectedGroupIds.has(g.id))
        .map((g: WhatsAppGroup) => g.subject);

      if (setRadarChannels) {
        setRadarChannels(selectedSubjects.length > 0 ? selectedSubjects : ['All WhatsApp Groups']);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      setError(err?.message || 'Failed to save monitored groups.');
    } finally {
      setSaving(false);
    }
  };

  // Filter and search logic
  const filteredGroups = useMemo(() => {
    return groups.filter((g: WhatsAppGroup) => {
      const matchesSearch = g.subject.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'monitored') return selectedGroupIds.has(g.id);
      if (activeTab === 'unmonitored') return !selectedGroupIds.has(g.id);
      return true;
    });
  }, [groups, searchQuery, activeTab, selectedGroupIds]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconBox}>
            <Sliders size={16} color={colors.accentBlue} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Monitored Channels</Text>
            <Text style={styles.headerSubtitle}>
              {groups.length > 0
                ? `${groups.length} groups found • ${selectedGroupIds.size} actively listening`
                : 'Configure WhatsApp lead interception'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Search & Bulk Bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={14} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups by name..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.bulkActions}>
          <TouchableOpacity
            style={styles.bulkBtn}
            onPress={selectAll}
            activeOpacity={0.7}
          >
            <Text style={styles.bulkBtnText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bulkBtn}
            onPress={deselectAll}
            activeOpacity={0.7}
          >
            <Text style={styles.bulkBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter Segment Tabs ── */}
      {groups.length > 0 && (
        <View style={styles.tabSegment}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('all');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All ({groups.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'monitored' && styles.tabItemActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('monitored');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'monitored' && styles.tabTextActive]}>
              Listening ({selectedGroupIds.size})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'unmonitored' && styles.tabItemActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab('unmonitored');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'unmonitored' && styles.tabTextActive]}>
              Paused ({groups.length - selectedGroupIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Content Body ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={styles.loadingText}>Discovering WhatsApp trade groups...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadGroups} activeOpacity={0.7}>
            <RefreshCw size={14} color={colors.surface} />
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconCircle}>
            <Users size={28} color={colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No WhatsApp Groups Found</Text>
          <Text style={styles.emptySubtitle}>
            Connect your WhatsApp account to automatically discover your business and trade channels.
          </Text>
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => {
              router.back();
              router.replace('/(tabs)');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.connectBtnText}>Open QR Scanner</Text>
            <ArrowRight size={14} color={colors.surface} />
          </TouchableOpacity>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>No Matching Groups</Text>
          <Text style={styles.emptySubtitle}>
            Try searching for a different keyword or switch the filter tab.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredGroups.map((group: WhatsAppGroup) => {
            const isSelected = selectedGroupIds.has(group.id);
            const palette = getAvatarPalette(group.id);
            const initials = getMonogram(group.subject);

            return (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupCard, isSelected && styles.groupCardSelected]}
                onPress={() => toggleGroup(group.id)}
                activeOpacity={0.65}
              >
                {/* Monogram Avatar */}
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: palette.bg, borderColor: palette.border },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: palette.text }]}>
                    {initials}
                  </Text>
                </View>

                {/* Group Details */}
                <View style={styles.groupInfo}>
                  <Text style={styles.groupSubject} numberOfLines={1}>
                    {group.subject}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.memberPill}>
                      <Users size={10} color={colors.textSecondary} />
                      <Text style={styles.memberCountText}>
                        {group.participants} members
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.statusPillActive}>
                        <View style={styles.activeDot} />
                        <Text style={styles.statusTextActive}>Intercepting RFQs</Text>
                      </View>
                    ) : (
                      <View style={styles.statusPillInactive}>
                        <Text style={styles.statusTextInactive}>Paused</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* High-Craft Tactile Checkbox */}
                <View
                  style={[
                    styles.checkbox,
                    isSelected ? styles.checkboxActive : styles.checkboxInactive,
                  ]}
                >
                  {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Sticky Elevated Action Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || loading) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || loading}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Text style={styles.saveBtnText}>
                {selectedGroupIds.size === 0
                  ? 'Pause All Channels'
                  : `Save & Monitor (${selectedGroupIds.size} of ${groups.length} Groups)`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accentBlueTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
  },
  headerTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bulkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulkBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  tabSegment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: colors.brandNavy,
  },
  tabText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textInverse,
    fontFamily: fonts.geist.semibold,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  loadingText: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  connectBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.surface,
  },
  errorText: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.rose,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 8,
  },
  retryBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.surface,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  groupCardSelected: {
    borderColor: colors.accentBlueBorder,
    backgroundColor: colors.accentBlueTint,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.geist.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  groupInfo: {
    flex: 1,
    gap: 3,
  },
  groupSubject: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.canvas,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberCountText: {
    fontFamily: fonts.inter.medium,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.emeraldBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.emeraldBorder,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.emerald,
  },
  statusTextActive: {
    fontFamily: fonts.geist.medium,
    fontSize: 10.5,
    color: colors.emerald,
  },
  statusPillInactive: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTextInactive: {
    fontFamily: fonts.inter.regular,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.accentBlue,
  },
  checkboxInactive: {
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.canvas,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandNavy,
    height: 46,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14.5,
    color: colors.surface,
  },
});

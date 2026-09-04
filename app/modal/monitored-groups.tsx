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
  MessageSquare,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { fetchGroups, setMonitoredGroups } from '../../src/services/relay/whatsappRelay';

interface WhatsAppGroup {
  id: string;
  subject: string;
  participants: number;
  creation?: number;
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

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const liveGroups = await fetchGroups(whatsappRelayUrl, 'session_user_default');
      setGroups(liveGroups);

      // Pre-select groups that match existing radar channels
      const matchingIds = new Set<string>();
      liveGroups.forEach((g: any) => {
        if (
          radarChannels.includes(g.subject) ||
          radarChannels.includes(g.id) ||
          radarChannels.includes(g.name)
        ) {
          matchingIds.add(g.id);
        }
      });

      // If user has never configured channels (radarChannels is empty), default to all
      if (radarChannels.length === 0 && matchingIds.size === 0) {
        liveGroups.forEach((g: WhatsAppGroup) => matchingIds.add(g.id));
      }

      setSelectedGroupIds(matchingIds);
    } catch (err: any) {
      setError(err?.message || 'Failed to load WhatsApp groups.');
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

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    return groups.filter((g: WhatsAppGroup) =>
      g.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Monitored Groups</Text>
          <Text style={styles.subtitle}>
            {groups.length > 0
              ? `${selectedGroupIds.size} of ${groups.length} groups selected`
              : 'Select groups to monitor for buyer inquiries'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.6}
          hitSlop={10}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={14} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {groups.length > 0 && (
          <View style={styles.bulkRow}>
            <TouchableOpacity onPress={selectAll} hitSlop={6}>
              <Text style={styles.bulkActionText}>Select all</Text>
            </TouchableOpacity>
            <Text style={styles.bulkDivider}>•</Text>
            <TouchableOpacity onPress={deselectAll} hitSlop={6}>
              <Text style={styles.bulkActionText}>Deselect all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={colors.brandNavy} />
          <Text style={styles.centerText}>Loading groups...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadGroups} activeOpacity={0.7}>
            <RefreshCw size={13} color={colors.surface} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centerBox}>
          <Users size={28} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Groups Available</Text>
          <Text style={styles.centerText}>
            Ensure your WhatsApp account is connected in the Home tab.
          </Text>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>No matching groups</Text>
          <Text style={styles.centerText}>No groups found for "{searchQuery}"</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardGroup}>
            {filteredGroups.map((group: WhatsAppGroup, idx: number) => {
              const isSelected = selectedGroupIds.has(group.id);
              const isLast = idx === filteredGroups.length - 1;

              return (
                <View key={group.id}>
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => toggleGroup(group.id)}
                    activeOpacity={0.5}
                  >
                    <View style={styles.iconBox}>
                      <MessageSquare size={16} color={colors.textSecondary} strokeWidth={1.8} />
                    </View>

                    <View style={styles.rowContent}>
                      <Text style={styles.groupName} numberOfLines={1}>
                        {group.subject}
                      </Text>
                      <Text style={styles.groupMeta}>
                        {group.participants} participants
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.checkbox,
                        isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
                      ]}
                    >
                      {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
                    </View>
                  </TouchableOpacity>
                  {!isLast && <View style={styles.separator} />}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ── Footer ── */}
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
            <Text style={styles.saveBtnText}>
              Save ({selectedGroupIds.size} Selected)
            </Text>
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
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.geist.semibold,
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: 2,
  },
  bulkActionText: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  bulkDivider: {
    fontSize: 10,
    color: colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
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
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  groupName: {
    fontFamily: fonts.geist.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  groupMeta: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
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
    marginLeft: 58,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.geist.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  centerText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
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
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 6,
  },
  retryBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12,
    color: colors.surface,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandNavy,
    height: 44,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 14,
    color: colors.surface,
  },
});

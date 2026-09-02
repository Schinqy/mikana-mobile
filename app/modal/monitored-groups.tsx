import React, { useEffect, useState } from 'react';
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
  CheckCircle2,
  Circle,
  Search,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing } from '@/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { fetchGroups, setMonitoredGroups } from '@/services/relay/whatsappRelay';

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
      liveGroups.forEach((g) => {
        if (radarChannels.includes(g.subject) || radarChannels.includes(g.id)) {
          matchingIds.add(g.id);
        }
      });

      // If none explicitly matched, select all by default so user monitors all
      if (matchingIds.size === 0) {
        liveGroups.forEach((g) => matchingIds.add(g.id));
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
    groups.forEach((g) => next.add(g.id));
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
        .filter((g) => selectedGroupIds.has(g.id))
        .map((g) => g.subject);

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

  const filteredGroups = groups.filter((g) =>
    g.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sliders size={18} color={colors.accentBlue} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Monitored Channels</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.headerSub}>
        Select which WhatsApp business and community groups Mikana should listen to for RFQs.
      </Text>

      {/* Search & Bulk Select */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={14} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.bulkBtn} onPress={selectAll} activeOpacity={0.7}>
          <Text style={styles.bulkBtnText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtn} onPress={deselectAll} activeOpacity={0.7}>
          <Text style={styles.bulkBtnText}>None</Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={styles.loadingText}>Fetching your WhatsApp groups...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadGroups} activeOpacity={0.7}>
            <RefreshCw size={14} color={colors.surface} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.centerBox}>
          <Users size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No matching groups found.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredGroups.map((group) => {
            const isSelected = selectedGroupIds.has(group.id);
            return (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupCard, isSelected && styles.groupCardSelected]}
                onPress={() => toggleGroup(group.id)}
                activeOpacity={0.7}
              >
                <View style={styles.groupInfo}>
                  <Text style={styles.groupSubject} numberOfLines={1}>
                    {group.subject}
                  </Text>
                  <View style={styles.metaRow}>
                    <Users size={12} color={colors.textMuted} />
                    <Text style={styles.metaText}>{group.participants} members</Text>
                  </View>
                </View>

                {isSelected ? (
                  <CheckCircle2 size={20} color={colors.accentBlue} strokeWidth={2.5} />
                ) : (
                  <Circle size={20} color={colors.border} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Footer Save Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || loading}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Check size={16} color={colors.surface} strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>
                Save & Monitor ({selectedGroupIds.size} Selected)
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  headerSub: {
    ...typography.bodySm,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 38,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySm,
    color: colors.text,
  },
  bulkBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkBtnText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.rose,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryBtnText: {
    ...typography.bodySm,
    color: colors.surface,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
  },
  groupCardSelected: {
    borderColor: colors.accentBlue,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  groupInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  groupSubject: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentBlue,
    height: 48,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: '700',
  },
});

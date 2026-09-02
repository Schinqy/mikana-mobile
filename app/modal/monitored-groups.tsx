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

  const filteredGroups = groups.filter((g: WhatsAppGroup) =>
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
          {filteredGroups.map((group: WhatsAppGroup) => {
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
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...type.heading,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  headerSub: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...type.body,
    color: colors.textPrimary,
  },
  bulkBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    ...type.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...type.body,
    color: colors.rose,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.surface,
  },
  emptyText: {
    ...type.body,
    color: colors.textSecondary,
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
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
  },
  groupCardSelected: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.accentBlueTint,
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupSubject: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...type.caption,
    color: colors.textMuted,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandNavy,
    height: 48,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 15,
    color: colors.surface,
  },
});

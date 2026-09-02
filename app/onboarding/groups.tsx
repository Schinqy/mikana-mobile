import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Lock, Users, ArrowRight, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '../../src/theme/colors';
import { resolveRelayUrl, fetchGroups } from '../../src/services/relay/whatsappRelay';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

const FREE_GROUP_LIMIT = 2;

interface GroupItem {
  id: string;
  jid: string;
  name: string;
  participantCount: number;
}

export default function GroupsScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const { whatsappRelayUrl, setRadarChannels } = useSettingsStore();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionId] = useState('user_default');

  useEffect(() => {
    const load = async () => {
      try {
        const url = resolveRelayUrl(whatsappRelayUrl);
        const raw = await fetchGroups(url, sessionId);
        setGroups(raw.map((g: any) => ({
          id: g.id,
          jid: g.id,
          name: g.name || g.id,
          participantCount: g.participantCount || 0,
        })));
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [whatsappRelayUrl, sessionId]);

  const toggleGroup = useCallback((jid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(jid)) {
        next.delete(jid);
      } else {
        if (next.size >= FREE_GROUP_LIMIT) {
          // Trigger paywall for group 3+
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
    if (selected.size === 0) return;
    setSaving(true);

    const selectedJids = Array.from(selected);
    const selectedNames = groups
      .filter(g => selectedJids.includes(g.jid))
      .map(g => g.name);

    setRadarChannels(selectedJids);
    completeOnboarding();

    router.replace('/(tabs)');
  }, [selected, groups]);

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
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Choose your radar</Text>
          <Text style={styles.subtext}>Which groups should Mikana monitor?</Text>
        </View>
      </View>

      {/* Privacy reassurance */}
      <View style={styles.privacyBanner}>
        <Lock size={13} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={styles.privacyText}>
          Mikana only reads the groups you select. Personal chats are never accessed.
        </Text>
      </View>

      {/* Free tier limit notice */}
      <View style={styles.limitRow}>
        <Text style={styles.limitText}>
          Free plan: up to {FREE_GROUP_LIMIT} groups
        </Text>
        <Pressable style={styles.proLink} onPress={() => router.push('/modal/paywall')}>
          <Crown size={12} color={colors.accentBlue} strokeWidth={1.5} />
          <Text style={styles.proLinkText}>Upgrade for 15</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accentBlue} size="large" />
          <Text style={styles.loadingText}>Fetching your WhatsApp groups...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No groups found</Text>
          <Text style={styles.emptySubtext}>
            Make sure you are a member of at least one WhatsApp group and your WhatsApp is connected.
          </Text>
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

      <View style={styles.ctaContainer}>
        <Text style={styles.selectionSummary}>
          {selected.size === 0 ? 'Select at least 1 group' : `${selected.size} group${selected.size > 1 ? 's' : ''} selected`}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            (selected.size === 0 || saving) && styles.ctaButtonDisabled,
            pressed && styles.ctaButtonPressed,
          ]}
          onPress={handleActivate}
          disabled={selected.size === 0 || saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <>
              <Text style={styles.ctaButtonText}>Start Watching Groups</Text>
              <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  heading: { fontFamily: 'Geist_700Bold', fontSize: 20, color: colors.textHeading, letterSpacing: -0.3, marginBottom: 2 },
  subtext: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
  privacyBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.accentBlueTint, borderBottomWidth: 1, borderBottomColor: colors.accentBlueBorder, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md },
  privacyText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  limitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  limitText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },
  proLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  proLinkText: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: colors.accentBlue },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textMuted },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl, gap: spacing.sm },
  emptyTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 16, color: colors.textPrimary, textAlign: 'center' },
  emptySubtext: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
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
  selectionSummary: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brandNavy, paddingVertical: 15, borderRadius: radius.md },
  ctaButtonDisabled: { opacity: 0.45 },
  ctaButtonPressed: { opacity: 0.88 },
  ctaButtonText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.textInverse },
});

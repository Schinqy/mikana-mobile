import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
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
  Search,
  X,
  Radio,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
        // Multi-device initial sync grace period: WhatsApp socket takes 2-4s to populate group metadata
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
        Haptics.selectionAsync();
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

    // Sync monitored group list to the active Baileys relay socket
    try {
      const url = resolveRelayUrl(whatsappRelayUrl);
      await setMonitoredGroups(url, sessionId, selectedJids);
    } catch (e) {
      console.warn('Could not sync monitored groups to relay:', e);
    }

    setOnboardingStage('groups');
    router.push('/onboarding/notifications');
  }, [selected, setRadarChannels, whatsappRelayUrl, sessionId, setOnboardingStage, router]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    setRadarChannels([]);
    setOnboardingStage('groups');
    router.push('/onboarding/notifications');
  }, [setRadarChannels, setOnboardingStage, router]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter(g => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const renderGroupItem = ({ item }: { item: GroupItem }) => {
    const isSelected = selected.has(item.jid);
    return (
      <Pressable
        key={item.jid}
        onPress={() => toggleGroup(item.jid)}
        className={`flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl border transition-all ${
          isSelected
            ? 'bg-brand-blue-tint/70 border-brand-blue shadow-xs'
            : 'bg-surface border-border active:bg-surface-elevated'
        }`}
      >
        {/* Left: Avatar + Details */}
        <View className="flex-row items-center gap-3 flex-1 mr-3">
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center border ${
              isSelected
                ? 'bg-brand-blue border-brand-blue'
                : 'bg-surface-elevated border-border'
            }`}
          >
            {isSelected ? (
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
            ) : (
              <Users size={18} color="#486581" strokeWidth={1.75} />
            )}
          </View>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className={`font-geist-semibold text-sm leading-5 ${
                isSelected ? 'text-brand-navy' : 'text-content-heading'
              }`}
            >
              {item.name}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Users size={11} color="#829AB1" strokeWidth={1.5} />
              <Text className="font-inter text-xs text-content-secondary">
                {item.participantCount > 0 ? `${item.participantCount} members` : 'WhatsApp Group'}
              </Text>
              {isSelected && (
                <View className="ml-1 px-1.5 py-0.5 bg-brand-blue/10 border border-brand-blue/30 rounded">
                  <Text className="font-geist-semibold text-[10px] text-brand-blue leading-3">
                    Active
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: Checkbox Pill */}
        <View
          className={`w-6 h-6 rounded-lg items-center justify-center border-1.5 ${
            isSelected
              ? 'bg-brand-blue border-brand-blue'
              : 'bg-surface border-slate-300'
          }`}
        >
          {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── 1. Top Bar & 6-Segment Stepper ────────────────────────────────────── */}
      <View className="px-6 pt-2 pb-3 border-b border-border bg-canvas">
        <View className="flex-row items-center gap-1.5 mb-3">
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-slate-200" />
          <View className="flex-1 h-1 rounded-full bg-slate-200" />
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/pair');
              }
            }}
            className="w-8 h-8 -ml-1 items-center justify-center rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#486581" strokeWidth={1.75} />
          </Pressable>

          <Text className="font-geist-medium text-xs text-content-muted tracking-wide">
            Step 4 of 6 · Trade Groups
          </Text>

          <Pressable
            onPress={handleSkip}
            className="px-2 py-1 -mr-2 rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <Text className="font-geist-semibold text-xs text-brand-blue">
              Skip
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── 2. Screen Header & Privacy ────────────────────────────────────────── */}
      <View className="px-6 pt-4 pb-3">
        <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1">
          Choose your radar channels
        </Text>
        <Text className="font-inter text-sm leading-5 text-content-secondary mb-3">
          Which WhatsApp trade groups should Mikana monitor for buyer leads?
        </Text>

        {/* Privacy Assurance Pill */}
        <View className="flex-row items-start gap-2 bg-brand-blue-tint/50 border border-brand-blue-border/70 rounded-xl p-3 mb-2">
          <Lock size={14} color="#1E56A0" strokeWidth={2} className="mt-0.5" />
          <Text className="flex-1 font-inter text-xs text-content-secondary leading-4">
            Mikana only monitors groups you explicitly select. Personal chats, calls, and unselected groups are never accessed.
          </Text>
        </View>

        {/* Plan Quota & Selection Status */}
        {groups.length > 0 && (
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-1.5 bg-surface-elevated border border-border px-2.5 py-1 rounded-full">
              <Radio size={12} color="#1E56A0" strokeWidth={2} />
              <Text className="font-geist-medium text-xs text-content-secondary">
                Free Tier: <Text className="font-geist-semibold text-content-heading">{selected.size}/{FREE_GROUP_LIMIT} selected</Text>
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/modal/paywall')}
              className="flex-row items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full active:opacity-80"
            >
              <Crown size={12} color="#D97706" strokeWidth={2} />
              <Text className="font-geist-semibold text-xs text-amber-700">
                Unlock 15
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── 3. Search Bar (Visible when groups exist) ─────────────────────────── */}
      {groups.length > 4 && (
        <View className="px-6 mb-2">
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-3 py-2.5 gap-2">
            <Search size={15} color="#829AB1" strokeWidth={2} />
            <TextInput
              placeholder="Search detected trade groups..."
              placeholderTextColor="#829AB1"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 font-inter text-xs text-content-primary p-0"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-0.5">
                <X size={14} color="#829AB1" strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ── 4. Main Body: Loading Skeleton, Empty State, or Group Cards ──────── */}
      {loading ? (
        <View className="flex-1 px-6 pt-2">
          <View className="flex-row items-center justify-center gap-2 py-3 mb-2">
            <ActivityIndicator size="small" color="#1E56A0" />
            <Text className="font-inter text-xs text-content-secondary">
              Syncing your WhatsApp trade channels...
            </Text>
          </View>

          {[1, 2, 3, 4, 5].map(key => (
            <View
              key={key}
              className="flex-row items-center p-3.5 mb-2.5 rounded-2xl border border-border bg-surface"
            >
              <View className="w-10 h-10 rounded-xl bg-slate-100 mr-3" />
              <View className="flex-1 gap-2">
                <View className="h-3.5 bg-slate-200 rounded w-3/4" />
                <View className="h-2.5 bg-slate-100 rounded w-1/3" />
              </View>
              <View className="w-6 h-6 rounded-lg bg-slate-100" />
            </View>
          ))}
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-14 h-14 rounded-2xl bg-surface border border-border items-center justify-center mb-3 shadow-2xs">
            <MessageSquare size={24} color="#486581" strokeWidth={1.75} />
          </View>
          <Text className="font-geist-bold text-lg text-content-heading text-center mb-1.5">
            {isTimedOut ? 'Connection Timed Out' : 'No WhatsApp Groups Detected'}
          </Text>
          <Text className="font-inter text-xs text-content-secondary text-center leading-5 mb-5 max-w-[280px]">
            {isTimedOut
              ? 'Could not reach the WhatsApp relay in time. Make sure your WhatsApp phone has active internet.'
              : 'Make sure your paired WhatsApp account has joined trade groups. You can join groups anytime and select them in Business settings.'}
          </Text>

          <View className="flex-row gap-2.5">
            <Pressable
              onPress={() => loadGroups(0)}
              className="flex-row items-center gap-1.5 bg-surface border border-border px-4 py-2.5 rounded-xl active:bg-surface-elevated shadow-2xs"
            >
              <RefreshCw size={14} color="#0B2545" strokeWidth={2} />
              <Text className="font-geist-semibold text-xs text-brand-navy">
                Try Again
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSkip}
              className="flex-row items-center gap-1.5 bg-brand-navy px-4 py-2.5 rounded-xl active:opacity-90 shadow-2xs"
            >
              <Text className="font-geist-semibold text-xs text-white">
                Continue
              </Text>
              <ArrowRight size={14} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => item.jid}
          renderItem={renderGroupItem}
          className="flex-1"
          contentContainerClassName="px-6 pt-2 pb-6"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <Text className="font-inter text-xs text-content-muted">
                No groups match "{searchQuery}"
              </Text>
            </View>
          }
        />
      )}

      {/* ── 5. Docked Sticky Action Footer ────────────────────────────────────── */}
      <View className="px-6 pt-3 pb-6 border-t border-border bg-canvas">
        {groups.length === 0 ? (
          <Pressable
            onPress={handleSkip}
            className="flex-row items-center justify-center gap-2 bg-brand-navy py-3.5 rounded-xl border border-brand-navy-dark active:opacity-95"
          >
            <Text className="font-geist-semibold text-sm text-content-inverse">
              Continue
            </Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        ) : selected.size > 0 ? (
          <Pressable
            onPress={handleActivate}
            disabled={saving}
            className={`flex-row items-center justify-center gap-2 bg-brand-navy py-3.5 rounded-xl border border-brand-navy-dark shadow-xs ${
              saving ? 'opacity-60' : 'active:scale-[0.99] active:opacity-95'
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text className="font-geist-semibold text-sm text-content-inverse">
                  Monitor {selected.size} Trade Channel{selected.size > 1 ? 's' : ''}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSkip}
            className="flex-row items-center justify-center gap-2 bg-surface border border-border py-3.5 rounded-xl active:bg-surface-elevated shadow-2xs"
          >
            <Text className="font-geist-semibold text-sm text-content-primary">
              Skip Channel Selection for Now
            </Text>
            <ArrowRight size={16} color="#0B2545" strokeWidth={2} />
          </Pressable>
        )}

        <Text className="font-inter text-[11px] text-content-muted text-center mt-2.5">
          You can add or change monitored trade channels anytime in Business settings
        </Text>
      </View>
    </SafeAreaView>
  );
}

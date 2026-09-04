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
  Users,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Search,
  X,
  ShieldCheck,
  Crown,
  Plus,
  AlertCircle,
  Smartphone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  resolveRelayUrl,
  fetchGroups,
  setMonitoredGroups,
  ensureSessionReady,
} from '../../src/services/relay/whatsappRelay';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

const FREE_GROUP_LIMIT = 2;
const FETCH_TIMEOUT_MS = 12000;

interface GroupItem {
  id: string;
  jid: string;
  name: string;
  participantCount: number;
  isCustom?: boolean;
}

export default function GroupsScreen() {
  const router = useRouter();
  const { setOnboardingStage } = useAuthStore();
  const {
    whatsappRelayUrl,
    isWhatsAppConnected,
    setWhatsAppConnected,
    radarChannels,
    setRadarChannels,
  } = useSettingsStore();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    () => new Set(radarChannels || [])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [manualChannelInput, setManualChannelInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Checking WhatsApp connection...');
  const [saving, setSaving] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [sessionOffline, setSessionOffline] = useState(false);
  const [sessionId] = useState('session_user_default');

  const abortControllerRef = useRef<AbortController | null>(null);
  const groupsRef = useRef<GroupItem[]>([]);

  // Synchronize incoming rehydrated radarChannels with selectedGroupIds and populate fallback list if needed
  useEffect(() => {
    if (radarChannels && radarChannels.length > 0) {
      setSelectedGroupIds(prev => {
        const next = new Set(prev);
        radarChannels.forEach(ch => next.add(ch));
        return next;
      });

      // If groups list is currently empty, synthesize fallback items so progress is never lost
      setGroups(current => {
        if (current.length === 0) {
          const fallbackItems: GroupItem[] = radarChannels.map((name, idx) => ({
            id: `saved_${idx}_${name}`,
            jid: name,
            name,
            participantCount: 0,
            isCustom: true,
          }));
          groupsRef.current = fallbackItems;
          return fallbackItems;
        }
        return current;
      });
    }
  }, [radarChannels]);

  const loadGroups = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setIsTimedOut(false);
    setSessionOffline(false);

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

      // ── Step A: Verify / Auto-awaken session status ──────────────────────────
      if (retryCount === 0) {
        setLoadingStage('Connecting to WhatsApp relay...');
      } else {
        setLoadingStage(`Scanning trade groups (attempt ${retryCount + 1})...`);
      }

      const sessionInfo = await ensureSessionReady(url, sessionId);
      if (sessionInfo.isConnected && sessionInfo.phone) {
        setWhatsAppConnected(true, sessionInfo.phone);
      }

      // If server explicitly reports session not connected / not found
      if (!sessionInfo.isConnected && sessionInfo.status !== 'qr_pending') {
        if (retryCount >= 2) {
          clearTimeout(timeoutId);
          setSessionOffline(true);
          setLoading(false);
          return;
        }
      }

      // ── Step B: Fetch live groups ───────────────────────────────────────────
      setLoadingStage('Fetching active trade channels...');
      const raw = await fetchGroups(url, sessionId, controller.signal, 7000);
      clearTimeout(timeoutId);

      if (Array.isArray(raw) && raw.length > 0) {
        const mapped: GroupItem[] = raw.map((g: any) => ({
          id: g.id,
          jid: g.id,
          name: g.subject || g.name || g.id,
          participantCount: g.participants || g.participantCount || 0,
          isCustom: false,
        }));

        // Merge any existing saved radarChannels as custom items if not in live response
        const currentSaved = useSettingsStore.getState().radarChannels || [];
        const existingNames = new Set(mapped.map(m => m.name.toLowerCase()));
        currentSaved.forEach((savedName, idx) => {
          if (!existingNames.has(savedName.toLowerCase())) {
            mapped.unshift({
              id: `saved_${idx}_${savedName}`,
              jid: savedName,
              name: savedName,
              participantCount: 0,
              isCustom: true,
            });
          }
        });

        setGroups(mapped);
        groupsRef.current = mapped;

        // Auto-match and pre-select any groups that match existing radarChannels
        if (currentSaved.length > 0) {
          setSelectedGroupIds(prev => {
            const next = new Set(prev);
            mapped.forEach(g => {
              if (
                currentSaved.includes(g.id) ||
                currentSaved.includes(g.jid) ||
                currentSaved.includes(g.name)
              ) {
                next.add(g.id);
              }
            });
            return next;
          });
        }

        setSessionOffline(false);
        setLoading(false);
      } else if (retryCount < 3) {
        // WhatsApp Baileys multi-device sync grace period: retry with progressive backoff
        const delay = (retryCount + 1) * 1500;
        setTimeout(() => {
          loadGroups(retryCount + 1);
        }, delay);
      } else {
        // Retries exhausted — preserve existing saved channels if present
        const currentSaved = useSettingsStore.getState().radarChannels || [];
        if (currentSaved.length > 0) {
          const fallbackItems: GroupItem[] = currentSaved.map((name, idx) => ({
            id: `saved_${idx}_${name}`,
            jid: name,
            name,
            participantCount: 0,
            isCustom: true,
          }));
          setGroups(fallbackItems);
          groupsRef.current = fallbackItems;
        } else {
          setGroups([]);
        }
        setLoading(false);
      }
    } catch {
      clearTimeout(timeoutId);
      if (retryCount < 2) {
        setTimeout(() => {
          loadGroups(retryCount + 1);
        }, 2000);
      } else {
        const currentSaved = useSettingsStore.getState().radarChannels || [];
        if (currentSaved.length > 0) {
          const fallbackItems: GroupItem[] = currentSaved.map((name, idx) => ({
            id: `saved_${idx}_${name}`,
            jid: name,
            name,
            participantCount: 0,
            isCustom: true,
          }));
          setGroups(fallbackItems);
          groupsRef.current = fallbackItems;
        } else {
          setGroups([]);
        }
        setLoading(false);
      }
    }
  }, [whatsappRelayUrl, sessionId, setWhatsAppConnected]);

  useEffect(() => {
    loadGroups(0);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadGroups]);

  const toggleGroup = useCallback((idOrJid: string) => {
    Haptics.selectionAsync();
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(idOrJid)) {
        next.delete(idOrJid);
      } else {
        if (next.size >= FREE_GROUP_LIMIT) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setTimeout(() => router.push('/modal/paywall'), 50);
          return prev;
        }
        next.add(idOrJid);
      }

      // Real-time persistence: immediately save updated group selections to useSettingsStore
      const currentList = groupsRef.current;
      const channelsToPersist: string[] = [];
      next.forEach(id => {
        const found = currentList.find(g => g.id === id || g.jid === id || g.name === id);
        channelsToPersist.push(found ? (found.name || found.id) : id);
      });
      setRadarChannels(channelsToPersist);

      return next;
    });
  }, [router, setRadarChannels]);

  // Handle manual addition of custom trade channel
  const handleAddManualChannel = useCallback(() => {
    const trimmed = manualChannelInput.trim();
    if (!trimmed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newId = `custom_${Date.now()}`;
    const newItem: GroupItem = {
      id: newId,
      jid: trimmed,
      name: trimmed,
      participantCount: 0,
      isCustom: true,
    };

    setGroups(prev => {
      const updated = [newItem, ...prev.filter(p => p.name.toLowerCase() !== trimmed.toLowerCase())];
      groupsRef.current = updated;
      return updated;
    });

    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.size < FREE_GROUP_LIMIT) {
        next.add(newId);
      }
      return next;
    });

    // Real-time persistence
    const currentChannels = useSettingsStore.getState().radarChannels || [];
    if (!currentChannels.includes(trimmed)) {
      setRadarChannels([...currentChannels, trimmed]);
    }

    setManualChannelInput('');
  }, [manualChannelInput, setRadarChannels]);

  const handleActivate = useCallback(async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const selectedJids = Array.from(selectedGroupIds);
    const channelsToPersist = selectedJids.map(id => {
      const found = groups.find(g => g.id === id || g.jid === id || g.name === id);
      return found ? (found.name || found.id) : id;
    });
    setRadarChannels(channelsToPersist);

    try {
      const url = resolveRelayUrl(whatsappRelayUrl);
      const jidsToMonitor = groups
        .filter(g => selectedGroupIds.has(g.id))
        .map(g => g.jid);
      await setMonitoredGroups(url, sessionId, jidsToMonitor);
    } catch (e) {
      console.warn('Could not sync monitored groups to relay:', e);
    }

    setOnboardingStage('groups');
    router.push('/onboarding/notifications');
  }, [selectedGroupIds, groups, setRadarChannels, whatsappRelayUrl, sessionId, setOnboardingStage, router]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    setOnboardingStage('groups');
    router.push('/onboarding/notifications');
  }, [setOnboardingStage, router]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter(g => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const renderGroupItem = ({ item }: { item: GroupItem }) => {
    const isSelected = selectedGroupIds.has(item.id) || selectedGroupIds.has(item.name);
    return (
      <Pressable
        key={item.id}
        onPress={() => toggleGroup(item.id)}
        className={`flex-row items-center justify-between p-3.5 mb-2 rounded-2xl border ${
          isSelected
            ? 'bg-brand-blue-tint border-brand-blue'
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
              <MessageSquare size={17} color="#486581" strokeWidth={1.75} />
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
                {item.participantCount > 0
                  ? `${item.participantCount} members`
                  : item.isCustom
                  ? 'Custom Channel'
                  : 'WhatsApp Group'}
              </Text>
              {isSelected && (
                <View className="ml-1 px-1.5 py-0.5 bg-brand-blue-tint border border-brand-blue-border rounded">
                  <Text className="font-geist-semibold text-[10px] text-brand-blue leading-3">
                    Active
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right Checkbox */}
        <View
          className={`w-6 h-6 rounded-lg items-center justify-center border ${
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
      {/* ── 1. Top Bar & 6-Segment Progress ─────────────────────────────────── */}
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

      {/* ── 2. Screen Header & Privacy ─────────────────────────────────────── */}
      <View className="px-6 pt-4 pb-2">
        <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1">
          Select Trade Channels
        </Text>
        <Text className="font-inter text-sm leading-5 text-content-secondary mb-3">
          Choose which WhatsApp groups Mikana should monitor for buyer inquiries.
        </Text>

        <View className="flex-row items-center gap-2 bg-brand-blue-tint border border-brand-blue-border rounded-xl px-3.5 py-2.5 mb-3">
          <ShieldCheck size={16} color="#1E56A0" strokeWidth={2} />
          <Text className="flex-1 font-inter text-xs text-content-secondary leading-4">
            Mikana only monitors selected groups. Personal chats and calls are never accessed.
          </Text>
        </View>

        {/* Re-link Banner if Session Dropped / Expired */}
        {sessionOffline && (
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
            <View className="flex-row items-center gap-2 mb-1.5">
              <AlertCircle size={15} color="#D97706" strokeWidth={2} />
              <Text className="font-geist-semibold text-xs text-amber-900">
                WhatsApp Multi-Device Session Offline
              </Text>
            </View>
            <Text className="font-inter text-xs text-amber-800 leading-4 mb-2.5">
              The connection to your WhatsApp account timed out or expired. Re-link your device to auto-scan live groups.
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => router.push('/onboarding/pair')}
                className="flex-row items-center gap-1.5 bg-brand-navy px-3 py-1.5 rounded-lg active:opacity-90"
              >
                <Smartphone size={13} color="#FFFFFF" strokeWidth={2} />
                <Text className="font-geist-semibold text-xs text-white">
                  Re-link Device
                </Text>
              </Pressable>
              <Pressable
                onPress={() => loadGroups(0)}
                className="flex-row items-center gap-1 bg-white border border-amber-300 px-2.5 py-1.5 rounded-lg active:bg-amber-100"
              >
                <RefreshCw size={12} color="#92400E" strokeWidth={2} />
                <Text className="font-geist-semibold text-xs text-amber-900">
                  Retry
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {groups.length > 0 && (
          <View className="flex-row items-center justify-between py-1">
            <Text className="font-inter text-xs text-content-secondary">
              Free Tier: <Text className="font-geist-semibold text-content-heading">{selectedGroupIds.size}/{FREE_GROUP_LIMIT} selected</Text>
            </Text>
            <Pressable
              onPress={() => router.push('/modal/paywall')}
              className="flex-row items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full active:opacity-80"
            >
              <Crown size={12} color="#D97706" strokeWidth={2} />
              <Text className="font-geist-semibold text-xs text-amber-800">
                Unlock 15
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── 3. Search Bar & Manual Channel Addition ─────────────────────────── */}
      <View className="px-6 mb-2">
        {groups.length > 2 && (
          <View className="flex-row items-center bg-surface border border-border rounded-xl px-3.5 py-2.5 gap-2 mb-2">
            <Search size={15} color="#829AB1" strokeWidth={2} />
            <TextInput
              placeholder="Search detected trade groups..."
              placeholderTextColor="#829AB1"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 font-inter text-xs text-content-primary p-0"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-0.5">
                <X size={14} color="#829AB1" strokeWidth={2} />
              </Pressable>
            )}
          </View>
        )}

        {/* Quick Add Custom Channel Input */}
        <View className="flex-row items-center bg-surface border border-border rounded-xl px-3.5 py-1.5 gap-2">
          <MessageSquare size={14} color="#829AB1" strokeWidth={2} />
          <TextInput
            placeholder="Add group name manually (e.g. Dubai Wholesale)"
            placeholderTextColor="#829AB1"
            value={manualChannelInput}
            onChangeText={setManualChannelInput}
            className="flex-1 font-inter text-xs text-content-primary p-0"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleAddManualChannel}
          />
          {manualChannelInput.trim().length > 0 && (
            <Pressable
              onPress={handleAddManualChannel}
              className="flex-row items-center gap-1 bg-brand-navy px-2.5 py-1.5 rounded-lg active:opacity-90"
            >
              <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="font-geist-semibold text-xs text-white">Add</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── 4. Content Area ─────────────────────────────────────────────────── */}
      {loading ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <ActivityIndicator size="small" color="#1E56A0" />
          <Text className="font-inter text-xs text-content-secondary">
            {loadingStage}
          </Text>
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-14 h-14 rounded-2xl bg-surface border border-border items-center justify-center mb-3">
            <MessageSquare size={24} color="#486581" strokeWidth={1.75} />
          </View>
          <Text className="font-geist-bold text-lg text-content-heading text-center mb-1.5">
            {isTimedOut
              ? 'Connection Timed Out'
              : sessionOffline
              ? 'WhatsApp Session Offline'
              : 'No Trade Groups Detected'}
          </Text>
          <Text className="font-inter text-xs text-content-secondary text-center leading-5 mb-5 max-w-[280px]">
            {isTimedOut
              ? 'Could not reach the WhatsApp relay in time. Ensure your WhatsApp phone is online.'
              : sessionOffline
              ? 'Your paired WhatsApp session disconnected. Reconnect your device to automatically detect groups, or add group names manually above.'
              : 'Make sure your paired WhatsApp account has joined trade groups. You can enter group names manually above or join groups anytime.'}
          </Text>

          <View className="flex-row gap-2.5">
            <Pressable
              onPress={() => loadGroups(0)}
              className="flex-row items-center gap-1.5 bg-surface border border-border px-4 py-2.5 rounded-xl active:bg-surface-elevated"
            >
              <RefreshCw size={14} color="#0B2545" strokeWidth={2} />
              <Text className="font-geist-semibold text-xs text-brand-navy">
                Try Again
              </Text>
            </Pressable>

            {sessionOffline ? (
              <Pressable
                onPress={() => router.push('/onboarding/pair')}
                className="flex-row items-center gap-1.5 bg-brand-navy px-4 py-2.5 rounded-xl active:opacity-90"
              >
                <Smartphone size={14} color="#FFFFFF" strokeWidth={2} />
                <Text className="font-geist-semibold text-xs text-white">
                  Re-link Device
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSkip}
                className="flex-row items-center gap-1.5 bg-brand-navy px-4 py-2.5 rounded-xl active:opacity-90"
              >
                <Text className="font-geist-semibold text-xs text-white">
                  Continue
                </Text>
                <ArrowRight size={14} color="#FFFFFF" strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={item => item.id}
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

      {/* ── 5. Sticky Bottom Actions ────────────────────────────────────────── */}
      <View className="px-6 pt-3 pb-8 border-t border-border bg-canvas">
        {groups.length === 0 ? (
          <Pressable
            onPress={handleSkip}
            className="flex-row items-center justify-center gap-2 bg-brand-navy py-4 rounded-xl border border-brand-navy-dark active:opacity-95"
          >
            <Text className="font-geist-semibold text-sm text-white">Continue</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
          </Pressable>
        ) : selectedGroupIds.size > 0 ? (
          <Pressable
            onPress={handleActivate}
            disabled={saving}
            className={`flex-row items-center justify-center gap-2 bg-brand-navy py-4 rounded-xl border border-brand-navy-dark ${
              saving ? 'opacity-60' : 'active:opacity-95'
            }`}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text className="font-geist-semibold text-sm text-white">
                  Monitor {selectedGroupIds.size} Trade Channel{selectedGroupIds.size > 1 ? 's' : ''}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSkip}
            className="flex-row items-center justify-center gap-2 bg-surface border border-border py-4 rounded-xl active:bg-surface-elevated"
          >
            <Text className="font-geist-semibold text-sm text-content-primary">
              Skip Channel Selection for Now
            </Text>
            <ArrowRight size={16} color="#0B2545" strokeWidth={2} />
          </Pressable>
        )}

        <Text className="font-inter text-[11px] text-content-muted text-center mt-2.5">
          You can add or change monitored channels anytime in Business settings
        </Text>
      </View>
    </SafeAreaView>
  );
}

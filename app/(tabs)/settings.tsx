import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Smartphone,
  Radio,
  Key,
  Bell,
  Cpu,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  QrCode,
  ShieldCheck,
  Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useLeadStore } from '../../src/store/useLeadStore';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    geminiApiKey,
    geminiModel,
    revenueCatApiKey,
    isWhatsAppConnected,
    whatsappLinkedPhone,
    radarChannels,
    enableSoundHaptics,
    enablePushNotifications,
    setGeminiApiKey,
    setGeminiModel,
    setRevenueCatApiKey,
    setWhatsAppConnected,
    addRadarChannel,
    removeRadarChannel,
    toggleHaptics,
    togglePushNotifications,
  } = useSettingsStore();

  const { status, toggleSandbox, setTier, resetWeeklyLimit } = useSubscriptionStore();
  const { resetToSampleData } = useLeadStore();

  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);
  const [newChannelInput, setNewChannelInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    if (geminiApiKey) {
      setTempApiKey(geminiApiKey);
    }
  }, [geminiApiKey]);

  const handleSaveGeminiKey = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGeminiApiKey(tempApiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleAddChannel = () => {
    const trimmed = newChannelInput.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addRadarChannel(trimmed);
    setNewChannelInput('');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Sample Data',
      'This will reload sample trade inquiries and reset weekly counters. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetToSampleData();
            resetWeeklyLimit();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── 1. Top Bar with Back Button ─────────────────────────────────────── */}
      <View className="px-6 py-3 border-b border-border bg-canvas flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/business');
              }
            }}
            className="w-8 h-8 -ml-1 items-center justify-center rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#486581" strokeWidth={1.75} />
          </Pressable>

          <View>
            <Text className="font-geist-medium text-xs text-content-muted tracking-wide">
              Account · System
            </Text>
            <Text className="font-geist-bold text-base text-content-heading">
              System & AI Settings
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-24"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 2. Screen Header ────────────────────────────────────────────────── */}
        <View className="mb-5">
          <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1">
            Configuration
          </Text>
          <Text className="font-inter text-xs leading-5 text-content-secondary">
            Manage multi-device WhatsApp links, AI models, push alerts, and sandbox parameters.
          </Text>
        </View>

        {/* ── 3. WhatsApp Multi-Device ────────────────────────────────────────── */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2.5">
            <Smartphone size={14} color="#0B2545" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
              WhatsApp Multi-Device
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2.5">
                <View
                  className={`w-2.5 h-2.5 rounded-full ${
                    isWhatsAppConnected ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                <View>
                  <Text className="font-geist-semibold text-sm text-content-heading">
                    {isWhatsAppConnected ? 'Multi-Device Connected' : 'WhatsApp Offline'}
                  </Text>
                  <Text className="font-inter text-xs text-content-secondary">
                    {isWhatsAppConnected
                      ? `Linked: ${whatsappLinkedPhone || '+27...'}`
                      : 'Scan QR code or use phone link to monitor groups'}
                  </Text>
                </View>
              </View>

              <View
                className={`px-2 py-0.5 rounded ${
                  isWhatsAppConnected
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-surface-elevated border border-border'
                }`}
              >
                <Text
                  className={`font-geist-semibold text-[10px] ${
                    isWhatsAppConnected ? 'text-emerald-700' : 'text-content-secondary'
                  }`}
                >
                  {isWhatsAppConnected ? 'Active' : 'Offline'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/modal/whatsapp-pair')}
              className="w-full py-2.5 bg-surface-elevated border border-border rounded-xl flex-row items-center justify-center gap-2 active:bg-slate-100"
            >
              <QrCode size={14} color="#0B2545" strokeWidth={2} />
              <Text className="font-geist-semibold text-xs text-brand-navy">
                {isWhatsAppConnected ? 'Manage WhatsApp Session' : 'Connect WhatsApp Account'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── 4. Monitored Channels ───────────────────────────────────────────── */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2.5">
            <Radio size={14} color="#0B2545" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
              Monitored Channels ({radarChannels.length})
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
            <View className="flex-row gap-2 mb-3">
              <TextInput
                value={newChannelInput}
                onChangeText={setNewChannelInput}
                placeholder="Add WhatsApp group name..."
                placeholderTextColor="#829AB1"
                className="flex-1 font-inter text-xs text-content-primary bg-surface-elevated border border-border rounded-xl px-3 py-2"
                onSubmitEditing={handleAddChannel}
              />
              <Pressable
                onPress={handleAddChannel}
                className="bg-brand-navy px-3.5 py-2 rounded-xl items-center justify-center active:opacity-90"
              >
                <Text className="font-geist-semibold text-xs text-white">Add</Text>
              </Pressable>
            </View>

            {radarChannels.length === 0 ? (
              <Text className="font-inter text-xs text-content-muted text-center py-2">
                No custom channels added. Monitoring all linked groups by default.
              </Text>
            ) : (
              <View className="gap-2">
                {radarChannels.map((ch, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between p-2.5 bg-surface-elevated border border-border rounded-xl"
                  >
                    <View className="flex-row items-center gap-2 flex-1 mr-2">
                      <Radio size={12} color="#1E56A0" strokeWidth={2} />
                      <Text
                        numberOfLines={1}
                        className="font-inter text-xs text-content-heading flex-1"
                      >
                        {ch}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => removeRadarChannel(ch)}
                      className="p-1 rounded active:bg-rose-100"
                      hitSlop={6}
                    >
                      <Trash2 size={13} color="#E02424" strokeWidth={1.75} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── 5. AI Engine & Gemini Model ─────────────────────────────────────── */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2.5">
            <Cpu size={14} color="#0B2545" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
              AI Proposal Engine
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 gap-3 shadow-xs">
            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Active Gemini Model
              </Text>
              <View className="bg-surface-elevated border border-border rounded-xl p-2.5 flex-row items-center justify-between">
                <Text className="font-geist-semibold text-xs text-brand-navy">
                  {geminiModel || 'gemini-2.0-flash'}
                </Text>
                <View className="bg-brand-blue-tint px-2 py-0.5 rounded">
                  <Text className="font-geist-semibold text-[10px] text-brand-blue">
                    Sub-second Latency
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Custom Google Gemini API Key (Optional)
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={tempApiKey}
                  onChangeText={setTempApiKey}
                  placeholder="AIzaSy..."
                  placeholderTextColor="#829AB1"
                  secureTextEntry
                  className="flex-1 font-inter text-xs text-content-primary bg-surface-elevated border border-border rounded-xl px-3 py-2"
                />
                <Pressable
                  onPress={handleSaveGeminiKey}
                  className="bg-brand-navy px-3.5 py-2 rounded-xl items-center justify-center active:opacity-90"
                >
                  <Text className="font-geist-semibold text-xs text-white">
                    {keySaved ? 'Saved!' : 'Save'}
                  </Text>
                </Pressable>
              </View>
              <Text className="font-inter text-[11px] text-content-muted mt-1">
                Leave empty to use Mikana Cloud's pre-configured quota.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 6. Preferences ──────────────────────────────────────────────────── */}
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2.5">
            <Bell size={14} color="#0B2545" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
              Preferences
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 gap-3.5 shadow-xs">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-geist-semibold text-xs text-content-heading mb-0.5">
                  Push Notifications
                </Text>
                <Text className="font-inter text-[11px] text-content-secondary leading-4">
                  Instant OS alerts when high-value buyer RFQs are detected
                </Text>
              </View>
              <Switch
                value={enablePushNotifications}
                onValueChange={() => {
                  Haptics.selectionAsync();
                  togglePushNotifications();
                }}
                trackColor={{ false: '#CBD5E1', true: '#1E56A0' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="h-px bg-border" />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-geist-semibold text-xs text-content-heading mb-0.5">
                  Sound & Tactile Haptics
                </Text>
                <Text className="font-inter text-[11px] text-content-secondary leading-4">
                  Physical vibration feedback on lead matches and actions
                </Text>
              </View>
              <Switch
                value={enableSoundHaptics}
                onValueChange={() => {
                  Haptics.selectionAsync();
                  toggleHaptics();
                }}
                trackColor={{ false: '#CBD5E1', true: '#1E56A0' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View className="h-px bg-border" />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-geist-semibold text-xs text-content-heading mb-0.5">
                  RevenueCat Sandbox Mode
                </Text>
                <Text className="font-inter text-[11px] text-content-secondary leading-4">
                  Simulate in-app purchases without live Google Play merchant billing
                </Text>
              </View>
              <Switch
                value={status.isSandboxMode}
                onValueChange={() => {
                  Haptics.selectionAsync();
                  toggleSandbox();
                }}
                trackColor={{ false: '#CBD5E1', true: '#1E56A0' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ── 7. Reset Data ───────────────────────────────────────────────────── */}
        <Pressable
          onPress={handleResetData}
          className="w-full py-3.5 bg-surface border border-rose-200 rounded-2xl flex-row items-center justify-center gap-2 active:bg-rose-50 mb-6"
        >
          <RotateCcw size={14} color="#E02424" strokeWidth={2} />
          <Text className="font-geist-semibold text-xs text-rose-700">
            Reset Sample Inquiries & Limits
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

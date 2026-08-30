import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useLeadStore } from '../../src/store/useLeadStore';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import {
  Settings as SettingsIcon,
  Smartphone,
  Key,
  CreditCard,
  Bell,
  Cpu,
  Radio,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  QrCode,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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

  const handleSaveGeminiKey = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setGeminiApiKey(tempApiKey.trim());
  };

  const handleAddChannel = () => {
    if (!newChannelInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addRadarChannel(newChannelInput.trim());
    setNewChannelInput('');
  };

  const handleToggleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWhatsAppConnected(!isWhatsAppConnected, isWhatsAppConnected ? '' : '+1 (415) 908-2214');
  };

  const handleResetData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetToSampleData();
    resetWeeklyLimit();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>System Settings</Text>
          <Text style={styles.subtitle}>
            Manage AI models, RevenueCat subscriptions & channel radar
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* WhatsApp Channel Integration Card */}
        <Card elevated style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Smartphone size={18} color="#10b981" />
              <Text style={styles.cardTitle}>WhatsApp Channel Link</Text>
            </View>
            <Badge variant={isWhatsAppConnected ? 'emerald' : 'rose'} showDot>
              {isWhatsAppConnected ? 'Online & Linked' : 'Disconnected'}
            </Badge>
          </View>

          <Text style={styles.cardText}>
            {isWhatsAppConnected
              ? `Connected via Baileys linked device: ${whatsappLinkedPhone}`
              : 'Scan live QR code or connect your WhatsApp Multi-Device session to monitor group chats.'}
          </Text>

          <View style={styles.btnRow}>
            <Button
              size="sm"
              variant="primary"
              icon={<QrCode size={14} color="#09090b" />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modal/whatsapp-pair');
              }}
            >
              {isWhatsAppConnected ? 'Manage WhatsApp Link / QR' : 'Pair WhatsApp Multi-Device QR'}
            </Button>
          </View>
        </Card>

        {/* RevenueCat & Monetization */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <CreditCard size={18} color="#f59e0b" />
              <Text style={styles.cardTitle}>RevenueCat Subscription</Text>
            </View>
            <Badge variant={status.isPro ? 'emerald' : 'amber'}>
              {status.tier.toUpperCase()}
            </Badge>
          </View>

          <Text style={styles.cardText}>
            {status.isPro
              ? 'You have active Pro entitlements with unlimited lead interceptions and 24/7 Autopilot.'
              : `Free Tier: ${status.leadsRemainingThisWeek} / 5 leads remaining this week.`}
          </Text>

          <View style={styles.sandboxRow}>
            <View style={styles.sandboxTextCol}>
              <Text style={styles.sandboxLabel}>Sandbox / Hackathon Demo Mode</Text>
              <Text style={styles.sandboxHint}>
                Allows instant testing and tier unlocking without live App Store sandbox accounts.
              </Text>
            </View>
            <Switch
              value={status.isSandboxMode}
              onValueChange={toggleSandbox}
              trackColor={{ false: '#27272a', true: '#3b82f6' }}
              thumbColor="#f4f4f5"
            />
          </View>

          {/* Quick Tier Switching for Demo Review */}
          <View style={styles.tierButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTier('free')}
              style={[styles.tierPill, status.tier === 'free' && styles.activeTierPill]}
            >
              <Text style={[styles.tierPillText, status.tier === 'free' && styles.activeTierPillText]}>
                Free
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTier('pro_monthly')}
              style={[styles.tierPill, status.tier === 'pro_monthly' && styles.activeTierPill]}
            >
              <Text style={[styles.tierPillText, status.tier === 'pro_monthly' && styles.activeTierPillText]}>
                Pro ($9.99)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTier('agency')}
              style={[styles.tierPill, status.tier === 'agency' && styles.activeTierPill]}
            >
              <Text style={[styles.tierPillText, status.tier === 'agency' && styles.activeTierPillText]}>
                Agency ($24.99)
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            size="sm"
            variant="outline"
            icon={<Sparkles size={13} color="#f4f4f5" />}
            onPress={() => router.push('/modal/paywall')}
            style={styles.paywallOpenBtn}
          >
            Open Paywall Modal
          </Button>
        </Card>

        {/* Google Gemini AI Configuration */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Cpu size={18} color="#3b82f6" />
              <Text style={styles.cardTitle}>Google Gemini AI Model</Text>
            </View>
          </View>

          <Input
            label="Google AI Studio API Key (Optional)"
            placeholder="AIzaSy... (Leave blank to use built-in simulator)"
            value={tempApiKey}
            onChangeText={setTempApiKey}
            secureTextEntry
          />

          <View style={styles.modelSelectorBox}>
            <Text style={styles.inputLabel}>Active Gemini Model:</Text>
            <View style={styles.modelPillsRow}>
              {['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash-lite'].map((m) => (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.7}
                  onPress={() => setGeminiModel(m)}
                  style={[styles.modelPill, geminiModel === m && styles.activeModelPill]}
                >
                  <Text style={[styles.modelPillText, geminiModel === m && styles.activeModelPillText]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button size="sm" variant="secondary" onPress={handleSaveGeminiKey}>
            Save AI Settings
          </Button>
        </Card>

        {/* Radar Monitored Channels */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Radio size={18} color="#a78bfa" />
              <Text style={styles.cardTitle}>Monitored Radar Channels ({radarChannels.length})</Text>
            </View>
          </View>

          <View style={styles.channelAddRow}>
            <Input
              placeholder="Add WhatsApp / Telegram channel name..."
              value={newChannelInput}
              onChangeText={setNewChannelInput}
              containerStyle={styles.channelInputContainer}
            />
            <Button size="sm" variant="primary" onPress={handleAddChannel}>
              Add
            </Button>
          </View>

          <View style={styles.channelList}>
            {radarChannels.map((ch, idx) => (
              <View key={idx} style={styles.channelTag}>
                <Text style={styles.channelTagName} numberOfLines={1}>
                  {ch}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => removeRadarChannel(ch)}
                  style={styles.removeTagBtn}
                >
                  <Text style={styles.removeTagText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Card>

        {/* System & Notification Toggles */}
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Haptic Feedback & Sounds</Text>
              <Text style={styles.toggleHint}>Tactile feedback on lead actions & quotes</Text>
            </View>
            <Switch
              value={enableSoundHaptics}
              onValueChange={toggleHaptics}
              trackColor={{ false: '#27272a', true: '#3b82f6' }}
              thumbColor="#f4f4f5"
            />
          </View>

          <View style={[styles.toggleRow, styles.borderTop]}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Urgent Lead Push Notifications</Text>
              <Text style={styles.toggleHint}>Vibrate instantly when 90%+ deal drops</Text>
            </View>
            <Switch
              value={enablePushNotifications}
              onValueChange={togglePushNotifications}
              trackColor={{ false: '#27272a', true: '#3b82f6' }}
              thumbColor="#f4f4f5"
            />
          </View>
        </Card>

        {/* Reset / Sample Data */}
        <View style={styles.footerActions}>
          <Button
            variant="ghost"
            icon={<RotateCcw size={14} color="#71717a" />}
            onPress={handleResetData}
          >
            Reset to Sample Hackathon Leads
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  cardText: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 17,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
  },
  sandboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#18181b',
    marginBottom: 12,
  },
  sandboxTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  sandboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  sandboxHint: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  tierButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tierPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  activeTierPill: {
    backgroundColor: '#f4f4f5',
    borderColor: '#f4f4f5',
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  activeTierPillText: {
    color: '#09090b',
  },
  paywallOpenBtn: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 6,
  },
  modelSelectorBox: {
    marginBottom: 14,
  },
  modelPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  activeModelPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
  },
  modelPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  activeModelPillText: {
    color: '#3b82f6',
  },
  channelAddRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  channelInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  channelList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
  },
  channelTagName: {
    fontSize: 11,
    color: '#d4d4d8',
    maxWidth: 200,
  },
  removeTagBtn: {
    padding: 2,
  },
  removeTagText: {
    fontSize: 10,
    color: '#71717a',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 12,
    marginTop: 6,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  toggleHint: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  footerActions: {
    alignItems: 'center',
    paddingTop: 10,
  },
});

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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useLeadStore } from '../../src/store/useLeadStore';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { colors } from '../../src/theme/colors';
import {
  Smartphone,
  Key,
  CreditCard,
  Bell,
  Cpu,
  Radio,
  RotateCcw,
  ChevronRight,
  QrCode,
  CheckCircle,
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
        {/* WhatsApp Multi-Device Pairing Section */}
        <View style={styles.sectionHeader}>
          <Smartphone size={14} color={colors.brandNavy} />
          <Text style={styles.sectionTitle}>WhatsApp Channel Connection</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.waHeader}>
            <View style={styles.waLeft}>
              <View style={[styles.waDot, isWhatsAppConnected && styles.waDotActive]} />
              <View>
                <Text style={styles.waTitle}>
                  {isWhatsAppConnected ? 'WhatsApp Multi-Device Linked' : 'WhatsApp Disconnected'}
                </Text>
                <Text style={styles.waSub}>
                  {isWhatsAppConnected ? `Linked: ${whatsappLinkedPhone || '+27...'}` : 'Scan QR code to monitor groups'}
                </Text>
              </View>
            </View>
            <Badge variant={isWhatsAppConnected ? 'emerald' : 'default'}>
              {isWhatsAppConnected ? 'Active' : 'Offline'}
            </Badge>
          </View>

          <Button
            size="sm"
            variant={isWhatsAppConnected ? 'secondary' : 'primary'}
            icon={<QrCode size={14} color={isWhatsAppConnected ? colors.brandNavy : colors.textInverse} />}
            onPress={() => router.push('/modal/whatsapp-pair')}
            style={styles.qrBtn}
          >
            {isWhatsAppConnected ? 'Manage WhatsApp Session' : 'Scan WhatsApp Web QR'}
          </Button>
        </Card>

        {/* Monitored Channels */}
        <View style={styles.sectionHeader}>
          <Radio size={14} color={colors.brandNavy} />
          <Text style={styles.sectionTitle}>Monitored WhatsApp Channels</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.channelInputRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Add WhatsApp group name or link..."
                value={newChannelInput}
                onChangeText={setNewChannelInput}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <Button size="md" variant="primary" onPress={handleAddChannel}>
              Add
            </Button>
          </View>

          <View style={styles.channelList}>
            {radarChannels.map((ch, idx) => (
              <View key={idx} style={styles.channelItem}>
                <View style={styles.channelLeft}>
                  <Radio size={12} color={colors.accentBlue} />
                  <Text style={styles.channelText} numberOfLines={1}>{ch}</Text>
                </View>
                <TouchableOpacity onPress={() => removeRadarChannel(ch)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Card>

        {/* Google Gemini AI Configuration */}
        <View style={styles.sectionHeader}>
          <Cpu size={14} color={colors.brandNavy} />
          <Text style={styles.sectionTitle}>Google Gemini AI Engine</Text>
        </View>

        <Card style={styles.card}>
          <Input
            label="GEMINI API KEY (OPTIONAL OVERRIDE)"
            value={tempApiKey}
            onChangeText={setTempApiKey}
            secureTextEntry
            placeholder="AIzaSy..."
          />
          <Button size="sm" variant="secondary" onPress={handleSaveGeminiKey} style={{ marginBottom: 14 }}>
            Save API Key
          </Button>

          <Text style={styles.modelLabel}>ACTIVE GEMINI MODEL</Text>
          <View style={styles.modelRow}>
            {['gemini-3.5-flash-lite', 'gemini-2.5-flash'].map((m) => {
              const isSel = geminiModel === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setGeminiModel(m)}
                  style={[styles.modelPill, isSel && styles.activeModelPill]}
                >
                  <Text style={[styles.modelPillText, isSel && styles.activeModelPillText]}>
                    {m === 'gemini-3.5-flash-lite' ? '3.5 Flash-Lite (Cheap & Fast)' : '2.5 Flash (Standard)'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* RevenueCat Subscriptions & Judging Toggle */}
        <View style={styles.sectionHeader}>
          <CreditCard size={14} color={colors.brandNavy} />
          <Text style={styles.sectionTitle}>RevenueCat Paywall & Subscriptions</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.rcHeader}>
            <View>
              <Text style={styles.rcTierTitle}>Current Tier: {status.tier.toUpperCase()}</Text>
              <Text style={styles.rcSub}>
                {status.isPro ? 'Unlimited AI pitches & autopilot active' : `${status.leadsRemainingThisWeek} free credits left`}
              </Text>
            </View>
            <Badge variant={status.isPro ? 'emerald' : 'amber'}>
              {status.isPro ? 'Pro Member' : 'Free Tier'}
            </Badge>
          </View>

          <Button
            size="sm"
            variant="primary"
            onPress={() => router.push('/modal/paywall')}
            style={styles.paywallBtn}
          >
            Open RevenueCat Paywall
          </Button>

          {/* Sandbox Toggle for Hackathon Testing */}
          <View style={styles.sandboxToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sandboxTitle}>Sandbox Simulation Mode</Text>
              <Text style={styles.sandboxSub}>Instant 1-tap entitlement toggle for testing without store billing</Text>
            </View>
            <Switch
              value={status.isSandboxMode}
              onValueChange={toggleSandbox}
              trackColor={{ false: colors.borderStrong, true: colors.brandNavy }}
              thumbColor="#FFFFFF"
            />
          </View>

          {status.isSandboxMode && (
            <View style={styles.tierButtonsRow}>
              <TouchableOpacity
                onPress={() => setTier('free')}
                style={[styles.tierBtn, status.tier === 'free' && styles.activeTierBtn]}
              >
                <Text style={[styles.tierBtnText, status.tier === 'free' && styles.activeTierBtnText]}>Free Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTier('pro_monthly')}
                style={[styles.tierBtn, status.tier === 'pro_monthly' && styles.activeTierBtn]}
              >
                <Text style={[styles.tierBtnText, status.tier === 'pro_monthly' && styles.activeTierBtnText]}>Pro Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTier('pro_annual')}
                style={[styles.tierBtn, status.tier === 'pro_annual' && styles.activeTierBtn]}
              >
                <Text style={[styles.tierBtnText, status.tier === 'pro_annual' && styles.activeTierBtnText]}>Pro Annual</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Reset / Clean Data */}
        <Button
          size="sm"
          variant="outline"
          icon={<RotateCcw size={13} color={colors.textSecondary} />}
          onPress={handleResetData}
          style={styles.resetBtn}
        >
          Reset to Sample Commercial Leads
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 16,
  },
  waHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  waDotActive: {
    backgroundColor: colors.emerald,
  },
  waTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  waSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  qrBtn: {
    width: '100%',
  },
  channelInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  channelList: {
    gap: 6,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  channelText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  removeBtn: {
    paddingHorizontal: 6,
  },
  removeText: {
    fontSize: 11,
    color: colors.rose,
    fontWeight: '600',
  },
  modelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
  },
  modelRow: {
    gap: 6,
  },
  modelPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeModelPill: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  modelPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeModelPillText: {
    color: colors.textInverse,
  },
  rcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rcTierTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rcSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  paywallBtn: {
    marginBottom: 14,
  },
  sandboxToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  sandboxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sandboxSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  tierButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  tierBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  activeTierBtn: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  tierBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTierBtnText: {
    color: colors.textInverse,
  },
  resetBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
});

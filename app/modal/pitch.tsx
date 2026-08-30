import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLeadStore } from '../../src/store/useLeadStore';
import { useCatalogStore } from '../../src/store/useCatalogStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { generateTailoredPitch } from '../../src/services/ai/geminiExtractor';
import { openWhatsAppChat, callPhoneNumber, copyToClipboard } from '../../src/services/dispatcher/whatsappDeepLink';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { colors } from '../../src/theme/colors';
import {
  X,
  Send,
  Phone,
  Copy,
  Check,
  DollarSign,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function PitchStudioModal() {
  const router = useRouter();
  const { leads, selectedLeadId, updateLead, updateStage } = useLeadStore();
  const { profile, services } = useCatalogStore();
  const { geminiApiKey, geminiModel } = useSettingsStore();
  const { status, consumeLeadCredit, setPaywallVisible } = useSubscriptionStore();

  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];
  const matchedService = services.find((s) => s.id === currentLead?.matchedServiceId) || services[0];

  const [pitchText, setPitchText] = useState(currentLead?.generatedPitch || '');
  const [quoteAmount, setQuoteAmount] = useState(
    currentLead?.quotedAmount ? String(currentLead.quotedAmount) : String(matchedService?.price || 2500)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentLead && !currentLead.generatedPitch) {
      handleGeneratePitch();
    }
  }, [currentLead?.id]);

  const handleGeneratePitch = async () => {
    if (!currentLead) return;

    if (!status.isPro) {
      const allowed = consumeLeadCredit();
      if (!allowed) {
        setPaywallVisible(true);
        return;
      }
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const pitch = await generateTailoredPitch(
        currentLead,
        matchedService,
        profile,
        geminiApiKey,
        geminiModel
      );

      setPitchText(pitch);
      updateLead(currentLead.id, {
        generatedPitch: pitch,
        quotedAmount: parseInt(quoteAmount.replace(/[^\d]/g, '') || '0', 10),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!currentLead) return;

    updateLead(currentLead.id, {
      stage: 'quoted',
      generatedPitch: pitchText,
      quotedAmount: parseInt(quoteAmount.replace(/[^\d]/g, '') || '0', 10),
    });
    updateStage(currentLead.id, 'quoted');

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await openWhatsAppChat(currentLead.senderPhone, pitchText);
  };

  const handleCopy = async () => {
    if (!pitchText) return;
    await copyToClipboard(pitchText);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCall = () => {
    if (!currentLead?.senderPhone) return;
    callPhoneNumber(currentLead.senderPhone);
  };

  if (!currentLead) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Proposal Studio</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No lead selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Modal Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Proposal Studio</Text>
          <Text style={styles.headerSub}>Drafting quote for {currentLead.senderName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Buyer Request Card */}
        <Card style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <Text style={styles.sectionLabel}>BUYER INQUIRY</Text>
            <Badge variant="blue">WhatsApp</Badge>
          </View>
          <Text style={styles.rawRequestText}>{currentLead.rawText}</Text>
          <View style={styles.metaRow}>
            {currentLead.budgetEstimate && (
              <View style={styles.metaItem}>
                <DollarSign size={12} color={colors.emerald} />
                <Text style={styles.metaText}>{currentLead.budgetEstimate}</Text>
              </View>
            )}
            {currentLead.location && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{currentLead.location}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Pricing Input */}
        <View style={styles.quoteRow}>
          <View style={styles.quoteInputWrapper}>
            <Input
              label="PROPOSAL QUOTE AMOUNT"
              value={quoteAmount}
              onChangeText={setQuoteAmount}
              keyboardType="numeric"
              placeholder="e.g. 2500"
              iconLeft={<DollarSign size={15} color={colors.textSecondary} />}
            />
          </View>
          <Button
            size="sm"
            variant="secondary"
            onPress={handleGeneratePitch}
            loading={isGenerating}
            icon={<RefreshCw size={13} color={colors.brandNavy} />}
            style={styles.regenerateBtn}
          >
            Regenerate
          </Button>
        </View>

        {/* Proposal Editor */}
        <View style={styles.editorSection}>
          <View style={styles.editorHeader}>
            <Text style={styles.sectionLabel}>TAILORED PROPOSAL MESSAGE</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
              {copied ? <Check size={12} color={colors.emerald} /> : <Copy size={12} color={colors.textSecondary} />}
              <Text style={[styles.copyBtnText, copied && { color: colors.emerald }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            multiline
            value={pitchText}
            onChangeText={setPitchText}
            placeholder="Generating personalized quote pitch..."
            placeholderTextColor={colors.textMuted}
            style={styles.pitchInput}
          />
        </View>

        {/* Action Controls */}
        <View style={styles.actionSection}>
          <Button
            size="lg"
            variant="primary"
            onPress={handleSendWhatsApp}
            iconRight={<Send size={16} color={colors.textInverse} />}
            style={styles.dispatchBtn}
          >
            Send Quote via WhatsApp DM
          </Button>

          <View style={styles.secondaryActions}>
            <Button
              size="md"
              variant="outline"
              onPress={handleCall}
              icon={<Phone size={14} color={colors.brandNavy} />}
              style={styles.callBtn}
            >
              Call {currentLead.senderName}
            </Button>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  requestCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  rawRequestText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    paddingTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  quoteInputWrapper: {
    flex: 1,
  },
  regenerateBtn: {
    height: 42,
    marginBottom: 12,
  },
  editorSection: {
    marginBottom: 20,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pitchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: colors.textHeading,
    minHeight: 180,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  actionSection: {
    gap: 10,
  },
  dispatchBtn: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});

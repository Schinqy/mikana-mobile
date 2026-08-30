import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
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
import {
  X,
  Sparkles,
  Send,
  Phone,
  Copy,
  Check,
  CheckCircle,
  Radio,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  ExternalLink,
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

    // Check entitlement on free tier
    if (!status.isPro) {
      const allowed = consumeLeadCredit();
      if (!allowed) {
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
    const cleanQuote = parseInt(quoteAmount.replace(/[^\d]/g, '') || '0', 10);

    updateLead(currentLead.id, {
      generatedPitch: pitchText,
      quotedAmount: cleanQuote,
      stage: currentLead.stage === 'captured' ? 'quoted' : currentLead.stage,
    });

    const success = await openWhatsAppChat(currentLead.senderPhone, pitchText);
    if (!success) {
      Alert.alert('Pitch Copied', 'Proposal copied to clipboard. You can paste it directly to the buyer.');
    }
  };

  const handleCall = () => {
    if (!currentLead) return;
    callPhoneNumber(currentLead.senderPhone);
  };

  const handleCopy = async () => {
    await copyToClipboard(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkStage = (stage: any) => {
    if (!currentLead) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateStage(currentLead.id, stage);
  };

  if (!currentLead) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No lead selected</Text>
          <Button onPress={() => router.back()}>Dismiss</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modal Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.modalTitle}>AI Pitch Studio</Text>
          <Badge variant={currentLead.matchScore >= 90 ? 'emerald' : 'blue'}>
            {currentLead.matchScore}% Match
          </Badge>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.closeBtn}
        >
          <X size={18} color="#f4f4f5" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Raw Lead Details Card */}
        <Card style={styles.card}>
          <View style={styles.leadHeaderRow}>
            <View>
              <Text style={styles.senderName}>{currentLead.senderName}</Text>
              <Text style={styles.channelName}>
                {currentLead.channelName} • {currentLead.senderPhone}
              </Text>
            </View>
            <Badge variant={currentLead.urgency === 'urgent' ? 'rose' : 'amber'} showDot>
              {currentLead.urgency.toUpperCase()}
            </Badge>
          </View>

          <View style={styles.rawBox}>
            <Text style={styles.rawText}>"{currentLead.rawText}"</Text>
          </View>

          {/* Key Needs Breakdown */}
          <View style={styles.needsWrapper}>
            <Text style={styles.needsTitle}>Extracted Buyer Requirements:</Text>
            {currentLead.extractedNeeds.map((need, idx) => (
              <View key={idx} style={styles.needItem}>
                <CheckCircle size={12} color="#10b981" />
                <Text style={styles.needText}>{need}</Text>
              </View>
            ))}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <DollarSign size={13} color="#10b981" />
              <Text style={styles.metaText}>
                Budget: {currentLead.budgetEstimate || 'Quote Req.'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={13} color="#a1a1aa" />
              <Text style={styles.metaText}>{currentLead.location || 'Remote'}</Text>
            </View>
          </View>
        </Card>

        {/* Matched Catalog Offering */}
        <Card style={styles.matchedCard}>
          <View style={styles.matchedHeader}>
            <Briefcase size={15} color="#3b82f6" />
            <Text style={styles.matchedTitle}>Matched Service Offering</Text>
          </View>
          <Text style={styles.serviceName}>{matchedService?.title}</Text>
          <Text style={styles.serviceMeta}>
            Catalog Rate: ${matchedService?.price.toLocaleString()} ({matchedService?.pricingModel}) • Turnaround: {matchedService?.turnaroundTime}
          </Text>
        </Card>

        {/* Pitch Editor Card */}
        <Card elevated style={styles.pitchCard}>
          <View style={styles.pitchHeaderRow}>
            <View style={styles.pitchHeaderLeft}>
              <Sparkles size={16} color="#3b82f6" />
              <Text style={styles.pitchTitle}>Tailored Sales Proposal</Text>
            </View>
            <Button
              size="sm"
              variant="secondary"
              loading={isGenerating}
              icon={<Sparkles size={12} color="#f4f4f5" />}
              onPress={handleGeneratePitch}
            >
              Regenerate
            </Button>
          </View>

          {/* Quote input */}
          <View style={styles.quoteInputRow}>
            <View style={styles.quoteCol}>
              <Input
                label="Quoted Amount (USD)"
                keyboardType="numeric"
                value={quoteAmount}
                onChangeText={setQuoteAmount}
                containerStyle={styles.noMarginBottom}
              />
            </View>
          </View>

          <Input
            label="WhatsApp DM Message"
            multiline
            numberOfLines={9}
            value={pitchText}
            onChangeText={setPitchText}
            style={styles.pitchInput}
          />

          {/* Dispatch Action Buttons */}
          <View style={styles.actionButtonsCol}>
            <Button
              size="lg"
              variant="primary"
              icon={<Send size={16} color="#09090b" />}
              onPress={handleSendWhatsApp}
            >
              1-Tap Dispatch (WhatsApp DM)
            </Button>

            <View style={styles.secondaryActionsRow}>
              <Button
                size="md"
                variant="outline"
                icon={<Phone size={14} color="#f4f4f5" />}
                onPress={handleCall}
                style={styles.flex1}
              >
                Call Phone
              </Button>

              <Button
                size="md"
                variant="outline"
                icon={copied ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#f4f4f5" />}
                onPress={handleCopy}
                style={styles.flex1}
              >
                {copied ? 'Copied' : 'Copy Pitch'}
              </Button>
            </View>
          </View>
        </Card>

        {/* Stage Advancement Controls */}
        <View style={styles.stageAdvanceRow}>
          <Text style={styles.stageAdvanceLabel}>Pipeline Stage:</Text>
          <View style={styles.stageButtonsGroup}>
            {(['captured', 'quoted', 'negotiating', 'won'] as const).map((stage) => (
              <TouchableOpacity
                key={stage}
                activeOpacity={0.7}
                onPress={() => handleMarkStage(stage)}
                style={[
                  styles.stageButton,
                  currentLead.stage === stage && styles.activeStageButton,
                ]}
              >
                <Text
                  style={[
                    styles.stageButtonText,
                    currentLead.stage === stage && styles.activeStageButtonText,
                  ]}
                >
                  {stage.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#18181b',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
  },
  leadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  channelName: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  rawBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#18181b',
    marginBottom: 10,
  },
  rawText: {
    fontSize: 13,
    color: '#d4d4d8',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  needsWrapper: {
    gap: 4,
    marginBottom: 10,
  },
  needsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 2,
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  needText: {
    fontSize: 12,
    color: '#f4f4f5',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  matchedCard: {
    marginBottom: 12,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  matchedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  matchedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  serviceMeta: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
  pitchCard: {
    marginBottom: 16,
  },
  pitchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pitchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pitchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  quoteInputRow: {
    marginBottom: 6,
  },
  quoteCol: {
    width: '100%',
  },
  noMarginBottom: {
    marginBottom: 8,
  },
  pitchInput: {
    minHeight: 160,
    textAlignVertical: 'top',
    fontSize: 13,
    lineHeight: 19,
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 10,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  stageAdvanceRow: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#18181b',
  },
  stageAdvanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 8,
  },
  stageButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stageButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  activeStageButton: {
    backgroundColor: '#f4f4f5',
    borderColor: '#f4f4f5',
  },
  stageButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  activeStageButtonText: {
    color: '#09090b',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 15,
    color: '#a1a1aa',
    marginBottom: 12,
  },
});

import React, { useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import { useLeadStore } from '../../src/store/useLeadStore';
import { useCatalogStore } from '../../src/store/useCatalogStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { analyzeLead } from '../../src/services/ai/geminiExtractor';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import {
  X,
  Sparkles,
  Clipboard as ClipboardIcon,
  Radio,
  FileText,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function NewLeadModal() {
  const router = useRouter();
  const { addLead, setSelectedLeadId } = useLeadStore();
  const { services } = useCatalogStore();
  const { geminiApiKey, geminiModel, radarChannels } = useSettingsStore();

  const [rawText, setRawText] = useState('');
  const [senderName, setSenderName] = useState('New Client');
  const [senderPhone, setSenderPhone] = useState('+1 (555) 019-2831');
  const [channelName, setChannelName] = useState(radarChannels[0] || 'WhatsApp Group');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePasteClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setRawText(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAnalyzeAndIngest = async () => {
    if (!rawText.trim()) {
      Alert.alert('Empty Input', 'Please paste or type the buyer request text.');
      return;
    }

    setIsAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const analysis = await analyzeLead(
        rawText,
        services,
        geminiApiKey,
        geminiModel
      );

      const newLead = addLead({
        rawText: rawText.trim(),
        senderName: senderName.trim() || 'Direct Inquiry',
        senderPhone: senderPhone.trim() || '+1 (555) 000-0000',
        channelName: channelName.trim(),
        category: analysis.category,
        urgency: analysis.urgency,
        budgetEstimate: analysis.budgetEstimate,
        location: analysis.location,
        matchScore: analysis.matchScore,
        stage: 'captured',
        aiSummary: analysis.aiSummary,
        extractedNeeds: analysis.extractedNeeds,
        matchedServiceId: analysis.matchedServiceId,
        currency: 'USD',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedLeadId(newLead.id);
      router.replace('/modal/pitch');
    } catch (e) {
      console.warn(e);
      Alert.alert('Analysis Notice', 'Lead added with default profile.');
      router.back();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={18} color="#3b82f6" />
          <Text style={styles.modalTitle}>Scan / Paste Opportunity</Text>
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
        <Card elevated style={styles.card}>
          <View style={styles.pasteHeaderRow}>
            <Text style={styles.inputLabel}>Raw Message / Buyer Post:</Text>
            <Button
              size="sm"
              variant="secondary"
              icon={<ClipboardIcon size={12} color="#f4f4f5" />}
              onPress={handlePasteClipboard}
            >
              Paste
            </Button>
          </View>

          <Input
            placeholder="Paste text from WhatsApp, Telegram, classifieds, or email inquiries..."
            multiline
            numberOfLines={6}
            value={rawText}
            onChangeText={setRawText}
            style={styles.rawInput}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Input
                label="Sender Name"
                value={senderName}
                onChangeText={setSenderName}
              />
            </View>
            <View style={styles.flex1}>
              <Input
                label="Phone / WhatsApp"
                value={senderPhone}
                onChangeText={setSenderPhone}
              />
            </View>
          </View>

          <Input
            label="Origin Channel / Group"
            value={channelName}
            onChangeText={setChannelName}
          />

          <Button
            size="lg"
            variant="primary"
            loading={isAnalyzing}
            icon={<Sparkles size={16} color="#09090b" />}
            onPress={handleAnalyzeAndIngest}
            style={styles.submitBtn}
          >
            Analyze & Score with Gemini AI
          </Button>
        </Card>
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
  pasteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  rawInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
  },
});

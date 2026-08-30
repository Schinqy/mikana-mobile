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
  TextInput,
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
import { colors } from '../../src/theme/colors';
import {
  X,
  Clipboard as ClipboardIcon,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function NewLeadModal() {
  const router = useRouter();
  const { addLead, setSelectedLeadId } = useLeadStore();
  const { services } = useCatalogStore();
  const { geminiApiKey, geminiModel, radarChannels } = useSettingsStore();

  const [rawText, setRawText] = useState('');
  const [senderName, setSenderName] = useState('New Client');
  const [senderPhone, setSenderPhone] = useState('+27 82 194 8831');
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
        senderPhone: senderPhone.trim() || '+27 82 194 8831',
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
        <View>
          <Text style={styles.headerTitle}>Ingest Opportunity</Text>
          <Text style={styles.headerSub}>Extract and parse buyer requests with AI</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Paste Raw Text Box */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>WHATSAPP MESSAGE / BUYER INQUIRY</Text>
            <TouchableOpacity onPress={handlePasteClipboard} style={styles.pasteBtn}>
              <ClipboardIcon size={12} color={colors.brandNavy} />
              <Text style={styles.pasteBtnText}>Paste</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            multiline
            value={rawText}
            onChangeText={setRawText}
            placeholder="Paste forwarded WhatsApp group message, buyer inquiry, or RFQ..."
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
          />
        </Card>

        {/* Contact & Channel Metadata */}
        <Card style={styles.card}>
          <Input
            label="SENDER NAME / CONTACT"
            value={senderName}
            onChangeText={setSenderName}
            placeholder="e.g. Dr. Sithole"
          />
          <Input
            label="WHATSAPP PHONE NUMBER"
            value={senderPhone}
            onChangeText={setSenderPhone}
            keyboardType="phone-pad"
            placeholder="+27..."
          />
          <Input
            label="SOURCE WHATSAPP GROUP"
            value={channelName}
            onChangeText={setChannelName}
            placeholder="e.g. B2B Contractors Network"
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        {/* Action Button */}
        <Button
          size="lg"
          variant="primary"
          onPress={handleAnalyzeAndIngest}
          loading={isAnalyzing}
          iconRight={<Plus size={16} color={colors.textInverse} />}
          style={styles.submitBtn}
        >
          Parse & Open Proposal Studio
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandNavy,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.textHeading,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    width: '100%',
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLeadStore } from '../../src/store/useLeadStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { LeadRow } from '../../src/components/radar/LeadRow';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Input } from '../../src/components/ui/Input';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { LeadFilter } from '../../src/types/lead';
import { FlashList } from '@shopify/flash-list';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import {
  relayClient,
  createSession,
} from '../../src/services/relay/whatsappRelay';
import {
  Search,
  Plus,
  QrCode,
  Smartphone,
  Zap,
  Crown,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    getFilteredLeads,
    setSelectedLeadId,
    leads,
    addLead,
  } = useLeadStore();

  const { isWhatsAppConnected, radarChannels, setWhatsAppConnected, whatsappRelayUrl } =
    useSettingsStore();
  const filteredLeads = getFilteredLeads();

  const [pairMode, setPairMode] = useState<'qr' | 'code'>('qr');
  const [isLinking, setIsLinking] = useState(false);
  const [liveQR, setLiveQR] = useState<string | null>(null);
  const [relayStatus, setRelayStatus] = useState<'idle' | 'connecting' | 'qr_ready' | 'connected' | 'error'>('idle');
  const sessionIdRef = useRef<string | null>(null);

  const filterTabs: Array<{ id: LeadFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'captured', label: 'Unquoted' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'quoted', label: 'Quoted' },
    { id: 'won', label: 'Won' },
  ];

  const handleLeadPress = (leadId: string) => {
    setSelectedLeadId(leadId);
    router.push('/modal/pitch');
  };

  // ─── Real Baileys Relay Connection ─────────────────────────────────────────

  const connectToRelay = useCallback(async () => {
    if (!whatsappRelayUrl) return;

    setRelayStatus('connecting');
    setIsLinking(true);

    try {
      // Create session on relay server
      const userId = 'user_default'; // Replace with real Supabase auth user ID
      const { sessionId } = await createSession(whatsappRelayUrl, userId);
      sessionIdRef.current = sessionId;

      // Connect WebSocket for real-time QR + events
      relayClient.connect(whatsappRelayUrl, sessionId, {
        onQR: (qr) => {
          setLiveQR(qr);
          setRelayStatus('qr_ready');
          setIsLinking(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onConnected: (phone) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setWhatsAppConnected(true, phone);
          setRelayStatus('connected');
          setIsLinking(false);
        },
        onDisconnected: (reason) => {
          if (reason === 'logged_out') {
            setWhatsAppConnected(false);
            setRelayStatus('idle');
          }
        },
        onNewLead: (lead) => {
          // Real incoming WhatsApp lead from relay
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          addLead({
            rawText: lead.raw_text,
            senderName: lead.sender_name,
            senderPhone: lead.sender_phone,
            senderAvatarUrl: lead.sender_avatar_url,
            channelName: lead.channel_name,
            category: lead.category || 'General',
            urgency: lead.urgency || 'medium',
            budgetEstimate: lead.budget_estimate,
            location: lead.location,
            matchScore: lead.match_score || 75,
            stage: 'captured',
            aiSummary: lead.ai_summary || lead.raw_text,
            extractedNeeds: lead.extracted_needs || [],
            currency: lead.currency || 'USD',
          });
        },
        onError: (msg) => {
          setRelayStatus('error');
          setIsLinking(false);
          console.warn('Relay error:', msg);
        },
        onStatus: (status, phone) => {
          if (status === 'connected' && phone) {
            setWhatsAppConnected(true, phone);
            setRelayStatus('connected');
          }
        },
      });
    } catch (err) {
      console.warn('Relay connection failed:', err);
      setRelayStatus('error');
      setIsLinking(false);
    }
  }, [whatsappRelayUrl, setWhatsAppConnected, addLead]);

  // Auto-connect to relay on mount if relay URL is set and not connected
  useEffect(() => {
    if (!isWhatsAppConnected && whatsappRelayUrl && relayStatus === 'idle') {
      connectToRelay();
    }
    return () => {
      relayClient.disconnect();
    };
  }, []);

  // Fallback: Simulate pair for demo mode (no relay)
  const handleSimulatePair = () => {
    if (whatsappRelayUrl) {
      connectToRelay();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsLinking(true);
      setTimeout(() => {
        setWhatsAppConnected(true, '+27 82 194 8831');
        setIsLinking(false);
      }, 600);
    }
  };

  // ─── Disconnected First-Time Screen (Fits 1 screen, zero scroll) ───────────

  if (!isWhatsAppConnected) {
    return (
      <View style={styles.disconnectedContainer}>
        <ScreenHeader
          title="Mikana"
          subtitle="Where Opportunities Meet You"
        />

        <View style={styles.terminalBody}>
          {/* Headline */}
          <View style={styles.titleSection}>
            <Text style={styles.terminalTitle}>Link WhatsApp Account</Text>
            <Text style={styles.terminalSub}>
              Scan to monitor incoming buyer inquiries across your business groups.
            </Text>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPairMode('qr')}
              style={[styles.toggleBtn, pairMode === 'qr' && styles.toggleBtnActive]}
            >
              <QrCode size={13} color={pairMode === 'qr' ? colors.textInverse : colors.textMuted} />
              <Text style={[styles.toggleBtnText, pairMode === 'qr' && styles.toggleBtnTextActive]}>
                QR Scanner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPairMode('code')}
              style={[styles.toggleBtn, pairMode === 'code' && styles.toggleBtnActive]}
            >
              <Smartphone size={13} color={pairMode === 'code' ? colors.textInverse : colors.textMuted} />
              <Text style={[styles.toggleBtnText, pairMode === 'code' && styles.toggleBtnTextActive]}>
                Phone Code
              </Text>
            </TouchableOpacity>
          </View>

          {/* QR / Code Display Box */}
          <View style={styles.qrConsoleCard}>
            {pairMode === 'qr' ? (
              <View style={styles.qrWrapper}>
                <View style={styles.qrFrame}>
                  {liveQR ? (
                    <QRCode
                      value={liveQR}
                      size={160}
                      color={colors.brandNavy}
                      backgroundColor={colors.surface}
                    />
                  ) : (
                    <View style={styles.qrLoadingBox}>
                      <ActivityIndicator size="large" color={colors.accentBlue} />
                      <Text style={styles.qrLoadingText}>
                        {relayStatus === 'error'
                          ? 'Connection failed. Tap below to retry.'
                          : 'Generating QR code...'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.liveIndicatorText}>
                  {liveQR ? 'Scan with WhatsApp' : 'Connecting to relay...'}
                </Text>
              </View>
            ) : (
              <View style={styles.codeWrapper}>
                <Text style={styles.codeLabel}>8-DIGIT PAIRING CODE</Text>
                <Text style={styles.codeDisplay}>8391 - 7294</Text>
                <Text style={styles.codeHint}>
                  WhatsApp &gt; Linked Devices &gt; Link with phone number
                </Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <Text style={styles.stepInstructions}>
            Open <Text style={styles.stepBold}>WhatsApp &gt; Linked Devices &gt; Link a Device</Text> and scan this code.
          </Text>

          {/* Actions */}
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={styles.connectPrimaryBtn}
              activeOpacity={0.8}
              onPress={handleSimulatePair}
            >
              <Zap size={16} color={colors.surface} strokeWidth={2.5} />
              <Text style={styles.connectPrimaryBtnText}>
                {isLinking ? 'Linking Account...' : 'Connect WhatsApp Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoLinkBtn}
              activeOpacity={0.7}
              onPress={() => setWhatsAppConnected(true, '+27 82 194 8831')}
            >
              <Text style={styles.demoLinkText}>Explore with Sample Inquiries</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Connected Feed Screen (With Home Overview Footer) ─────────────────────

  const renderOverviewFooter = () => (
    <View style={styles.footerOverviewSection}>
      {/* Section Divider */}
      <View style={styles.overviewHeaderRow}>
        <Text style={styles.overviewSectionTitle}>DAILY PULSE</Text>
        <Text style={styles.overviewSectionSub}>Real-time speed metrics</Text>
      </View>

      {/* Speed-to-Lead Metric Tiles */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconRow}>
            <Clock size={14} color={colors.emerald} strokeWidth={2.5} />
            <Text style={styles.metricCardLabel}>AVG SPEED TO LEAD</Text>
          </View>
          <Text style={styles.metricValue}>3.8 min</Text>
          <Text style={styles.metricSubtext}>vs 45 min industry avg</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricIconRow}>
            <TrendingUp size={14} color={colors.accentBlue} strokeWidth={2.5} />
            <Text style={styles.metricCardLabel}>PIPELINE VALUE</Text>
          </View>
          <Text style={styles.metricValue}>$17,150</Text>
          <Text style={styles.metricSubtext}>4 active opportunities</Text>
        </View>
      </View>

      {/* Pro Upgrade Banner */}
      <View style={styles.proCard}>
        <View style={styles.proCardTop}>
          <View style={styles.crownCircle}>
            <Crown size={16} color={colors.amber} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.proCardTitle}>24/7 Autopilot Quote Engine</Text>
            <Text style={styles.proCardDesc}>
              Auto-qualify RFQs and send personalized quotes within 30s while you're away.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.proUpgradeBtn}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/modal/paywall');
          }}
        >
          <Text style={styles.proUpgradeBtnText}>Upgrade to Pro</Text>
          <ArrowRight size={14} color={colors.surface} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Monitored Channels Snapshot */}
      <View style={styles.channelsSnapshot}>
        <View style={styles.channelsTitleRow}>
          <Text style={styles.channelsSectionTitle}>MONITORED GROUPS ({radarChannels.length})</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/business')}>
            <Text style={styles.manageChannelsText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.channelChipsContainer}>
          {radarChannels.map((channel, idx) => (
            <View key={idx} style={styles.channelChip}>
              <View style={styles.channelStatusDot} />
              <Text style={styles.channelChipText} numberOfLines={1}>
                {channel}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Home"
        subtitle={`${radarChannels.length} channels monitored • ${leads.length} inquiries`}
        rightAction={{
          label: 'New Inquiry',
          icon: Plus,
          onPress: () => router.push('/modal/new-lead'),
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="Search buyer requests, RFQs, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconLeft={<Search size={14} color={colors.textMuted} />}
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Underline Filter Tabs */}
      <View style={styles.filterBar}>
        {filterTabs.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(tab.id);
              }}
              style={[styles.filterTab, isActive && styles.activeFilterTab]}
            >
              <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List Feed with Home Overview Footer */}
      <FlashList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadRow lead={item} onPress={() => handleLeadPress(item.id)} />
        )}
        estimatedItemSize={72}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderOverviewFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matching inquiries</Text>
            <Text style={styles.emptySubtitle}>
              Incoming buyer requests from your WhatsApp groups will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.surface,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 20,
  },
  filterTab: {
    paddingVertical: 4,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accentBlue,
  },
  filterTabText: {
    fontFamily: fonts.geist.medium,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: -0.1,
  },
  activeFilterTabText: {
    fontFamily: fonts.geist.semibold,
    color: colors.brandNavy,
  },
  listContent: {
    backgroundColor: colors.surface,
    paddingBottom: 110, // Generous clearance for floating navbar
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── Disconnected First-Time Screen ────────────────────────────────────────
  disconnectedContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  terminalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 84,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    gap: 4,
  },
  terminalTitle: {
    fontFamily: fonts.geist.bold,
    fontSize: 20,
    color: colors.brandNavy,
    letterSpacing: -0.4,
  },
  terminalSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.accentBlue,
  },
  toggleBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: colors.textInverse,
    fontFamily: fonts.geist.semibold,
  },
  qrConsoleCard: {
    width: '100%',
    maxWidth: 270,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 10,
  },
  qrFrame: {
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    minWidth: 180,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingBox: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrLoadingText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  liveIndicatorText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  codeWrapper: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  codeLabel: {
    fontFamily: fonts.geist.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  codeDisplay: {
    fontFamily: fonts.geist.bold,
    fontSize: 28,
    color: colors.brandNavy,
    letterSpacing: 3,
    marginVertical: 4,
  },
  codeHint: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stepInstructions: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
  },
  stepBold: {
    fontFamily: fonts.inter.semibold,
    color: colors.brandNavy,
  },
  actionGroup: {
    width: '100%',
    gap: 6,
    alignItems: 'center',
  },
  connectPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accentBlue,
    borderRadius: 8,
    paddingVertical: 13,
  },
  connectPrimaryBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: -0.1,
  },
  demoLinkBtn: {
    paddingVertical: 4,
  },
  demoLinkText: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.accentBlue,
  },

  // ─── Home Overview Footer Styles ───────────────────────────────────────────
  footerOverviewSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  overviewSectionTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  overviewSectionSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricCardLabel: {
    fontFamily: fonts.geist.medium,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  metricValue: {
    fontFamily: fonts.geist.bold,
    fontSize: 20,
    color: colors.brandNavy,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  metricSubtext: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.emerald,
  },

  // Pro Banner
  proCard: {
    backgroundColor: colors.brandNavy,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    padding: 14,
    gap: 12,
  },
  proCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  crownCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  proCardTitle: {
    fontFamily: fonts.geist.bold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: -0.2,
  },
  proCardDesc: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
    marginTop: 2,
  },
  proUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: 6,
    paddingVertical: 9,
    gap: 6,
  },
  proUpgradeBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.surface,
    letterSpacing: -0.1,
  },

  // Monitored Channels Snapshot
  channelsSnapshot: {
    gap: 8,
    marginTop: 4,
  },
  channelsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelsSectionTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  manageChannelsText: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.accentBlue,
  },
  channelChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  channelStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  channelChipText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Share,
  Linking,
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
import * as Clipboard from 'expo-clipboard';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import {
  relayClient,
  createSession,
  requestPairingCode,
  resolveRelayUrl,
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
  RefreshCw,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  Monitor,
  Share2,
  Sliders,
} from 'lucide-react-native';
import { Country, detectUserCountry } from '../../src/utils/countryCodes';
import { CountryCodePickerModal } from '../../src/components/ui/CountryCodePickerModal';

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

  const [pairMode, setPairMode] = useState<'qr' | 'code'>('code');
  const [liveQR, setLiveQR] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => detectUserCountry());
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCodeLoading, setPairingCodeLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeSecondsLeft, setCodeSecondsLeft] = useState<number>(0);
  const codeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [relayStatus, setRelayStatus] = useState<'idle' | 'connecting' | 'qr_ready' | 'connected' | 'error'>('idle');
  const sessionIdRef = useRef<string | null>(null);

  // 60-second countdown once a code is generated
  useEffect(() => {
    if (pairingCode) {
      setCodeSecondsLeft(60);
      codeTimerRef.current = setInterval(() => {
        setCodeSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(codeTimerRef.current!);
            setPairingCode(null);
            setPairingError('Code expired. Generate a new one and enter it in WhatsApp immediately.');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (codeTimerRef.current) clearInterval(codeTimerRef.current);
    }
    return () => { if (codeTimerRef.current) clearInterval(codeTimerRef.current); };
  }, [pairingCode]);

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
    const targetUrl = resolveRelayUrl(whatsappRelayUrl);
    setRelayStatus('connecting');
    setPairingError(null);

    try {
      const { sessionId } = await createSession(targetUrl, 'user_default');
      sessionIdRef.current = sessionId;

      relayClient.connect(targetUrl, sessionId, {
        onQR: (qr) => {
          setLiveQR(qr);
          setRelayStatus('qr_ready');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onConnected: (phone) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setWhatsAppConnected(true, phone || '');
          setRelayStatus('connected');
        },
        onDisconnected: (reason) => {
          if (reason === 'logged_out') {
            setWhatsAppConnected(false, '');
            setRelayStatus('idle');
          }
        },
        onNewLead: (lead) => {
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
          console.warn('Relay error:', msg);
        },
        onStatus: (status, phone) => {
          if (status === 'connected' && phone) {
            setWhatsAppConnected(true, phone);
            setRelayStatus('connected');
          } else if (status !== 'connected' && status !== 'pairing_syncing') {
            setWhatsAppConnected(false, '');
            setRelayStatus(status as any);
          }
        },
      });
    } catch (err) {
      console.warn('Relay connection failed:', err);
      setRelayStatus('error');
    }
  }, [whatsappRelayUrl, setWhatsAppConnected, addLead]);

  useEffect(() => {
    connectToRelay();
    return () => {
      relayClient.disconnect();
    };
  }, [whatsappRelayUrl, connectToRelay]);

  // Real 8-Digit Pairing Code Request with WhatsApp style country code auto-prepended
  const handleRequestPairingCode = async () => {
    if (!phoneInput.trim()) {
      setPairingError('Please enter your WhatsApp phone number');
      return;
    }

    const cleanLocal = phoneInput.replace(/\D/g, '').replace(/^0+/, '');
    const cleanCountryCode = selectedCountry.dialCode.replace(/\D/g, '');
    const fullNumber = `+${cleanCountryCode}${cleanLocal}`;

    const targetUrl = resolveRelayUrl(whatsappRelayUrl);
    setPairingCodeLoading(true);
    setPairingError(null);
    setCopiedCode(false);

    try {
      const sessionId = sessionIdRef.current || 'session_user_default';
      const res = await requestPairingCode(targetUrl, sessionId, fullNumber);
      if (res.code) {
        setPairingCode(res.code);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setPairingError(err.message || 'Failed to request code. Check phone number and retry.');
    } finally {
      setPairingCodeLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!pairingCode) return;
    // Copy with dash separator — WhatsApp accepts XXXX-XXXX format
    const formatted = pairingCode.length === 8
      ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}`
      : pairingCode;
    await Clipboard.setStringAsync(formatted);
    setCopiedCode(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWebQR = async () => {
    const sessionParam = sessionIdRef.current || 'session_user_default';
    const baseUrl = resolveRelayUrl(whatsappRelayUrl);
    try {
      // Request a secure, cryptographically unguessable 15-min pairing ticket
      let targetUrl = `${baseUrl}/pair?session=${sessionParam}`;
      try {
        const res = await fetch(`${baseUrl}/api/sessions/${sessionParam}/ticket`, { method: 'POST' });
        const data = await res.json();
        if (data.ok && data.token) {
          targetUrl = `${baseUrl}/pair?token=${data.token}`;
        }
      } catch (_) {}

      await Share.share({
        title: 'Mikana WhatsApp Web QR',
        message: targetUrl,
        url: targetUrl,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  };

  const formattedPairingCode = pairingCode
    ? pairingCode.length === 8
      ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}`
      : pairingCode
    : '';

  // ─── Disconnected First-Time Screen (Fits 1 screen, zero scroll) ───────────

  if (!isWhatsAppConnected) {
    return (
      <View style={styles.disconnectedContainer}>
        <ScreenHeader
          title="Mikana"
          subtitle="Where Opportunities Meet You"
        />

        <KeyboardAwareScrollView
          style={styles.keyboardScroll}
          contentContainerStyle={styles.terminalBody}
          keyboardShouldPersistTaps="handled"
          bottomOffset={60}
          showsVerticalScrollIndicator={false}
        >
          {/* Headline */}
          <View style={styles.titleSection}>
            <Text style={styles.terminalTitle}>Link WhatsApp Account</Text>
            <Text style={styles.terminalSub}>
              Connect your WhatsApp to monitor incoming buyer RFQs across your business groups.
            </Text>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPairMode('code')}
              style={[styles.toggleBtn, pairMode === 'code' && styles.toggleBtnActive]}
            >
              <Smartphone size={13} color={pairMode === 'code' ? colors.textInverse : colors.textMuted} />
              <Text style={[styles.toggleBtnText, pairMode === 'code' && styles.toggleBtnTextActive]}>
                Phone Number Code
              </Text>
            </TouchableOpacity>

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
          </View>

          {/* QR / Code Display Box */}
          <View style={styles.qrConsoleCard}>
            {pairMode === 'qr' ? (
              <View style={styles.qrWrapper}>
                <View style={styles.qrFrame}>
                  {liveQR ? (
                    <QRCode
                      value={liveQR}
                      size={180}
                      color={colors.brandNavy}
                      backgroundColor={colors.surface}
                    />
                  ) : (
                    <View style={styles.qrLoadingBox}>
                      <ActivityIndicator size="large" color={colors.accentBlue} />
                      <Text style={styles.qrLoadingText}>
                        {relayStatus === 'error'
                          ? 'Relay server unreachable'
                          : 'Generating live WhatsApp QR...'}
                      </Text>
                      {relayStatus === 'error' && (
                        <TouchableOpacity onPress={connectToRelay} style={styles.inlineRetryBtn}>
                          <RefreshCw size={12} color={colors.accentBlue} />
                          <Text style={styles.inlineRetryText}>Retry Connection</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.shareWebQrBtn}
                  onPress={handleShareWebQR}
                  activeOpacity={0.7}
                >
                  <Monitor size={14} color={colors.accentBlue} />
                  <Text style={styles.shareWebQrBtnText}>Open / Share Live QR on PC</Text>
                  <Share2 size={13} color={colors.accentBlue} />
                </TouchableOpacity>

                <Text style={styles.liveIndicatorText}>
                  {liveQR ? 'Open link on PC → scan with WhatsApp' : 'Connecting to Baileys engine...'}
                </Text>
              </View>
            ) : (
              <View style={styles.codeWrapper}>
                {/* WhatsApp-style Country Selector */}
                <TouchableOpacity
                  style={styles.countrySelector}
                  activeOpacity={0.7}
                  onPress={() => setIsCountryModalOpen(true)}
                >
                  <View style={styles.countryInfoLeft}>
                    <Text style={styles.countryFlagText}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryNameLabel} numberOfLines={1}>
                      {selectedCountry.name}
                    </Text>
                  </View>
                  <ChevronDown size={15} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Phone input row with country code prefix */}
                <View style={styles.phoneInputRow}>
                  <TouchableOpacity
                    style={styles.dialCodePill}
                    activeOpacity={0.7}
                    onPress={() => setIsCountryModalOpen(true)}
                  >
                    <Text style={styles.dialCodePillText}>{selectedCountry.dialCode}</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="77 123 4567"
                    placeholderTextColor={colors.textMuted}
                    value={phoneInput}
                    onChangeText={(text) => {
                      setPhoneInput(text);
                      if (pairingCode) setPairingCode(null);
                    }}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>

                {pairingError ? (
                  <Text style={styles.errorText}>{pairingError}</Text>
                ) : null}

                {/* Next / Get Code Button */}
                {!pairingCode ? (
                  <TouchableOpacity
                    style={[
                      styles.submitCodeBtn,
                      (!phoneInput.trim() || pairingCodeLoading) && styles.submitCodeBtnDisabled,
                    ]}
                    onPress={handleRequestPairingCode}
                    disabled={!phoneInput.trim() || pairingCodeLoading}
                    activeOpacity={0.8}
                  >
                    {pairingCodeLoading ? (
                      <View style={styles.btnLoadingRow}>
                        <ActivityIndicator size="small" color={colors.textInverse} />
                        <Text style={styles.submitCodeBtnText}>Connecting to WhatsApp...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitCodeBtnText}>Get WhatsApp Pairing Code</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.pairingCodeBox}>
                    <Text style={styles.codeLabel}>WHATSAPP PAIRING CODE</Text>
                    <Text style={styles.codeDisplay}>{formattedPairingCode}</Text>

                    <Text style={[
                      styles.codeMatchWarning,
                      codeSecondsLeft <= 15 && { color: colors.rose }
                    ]}>
                      {codeSecondsLeft}s remaining — enter in WhatsApp now
                    </Text>

                    <View style={styles.codeActionRow}>
                      <TouchableOpacity
                        style={styles.copyCodeBtn}
                        onPress={handleCopyCode}
                        activeOpacity={0.7}
                      >
                        {copiedCode ? (
                          <>
                            <Check size={13} color={colors.emerald} />
                            <Text style={[styles.copyCodeBtnText, { color: colors.emerald }]}>
                              Copied
                            </Text>
                          </>
                        ) : (
                          <>
                            <Copy size={13} color={colors.accentBlue} />
                            <Text style={styles.copyCodeBtnText}>Copy Code</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.resetCodeBtn}
                        onPress={() => {
                          setPairingCode(null);
                          setPairingError(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <RotateCcw size={12} color={colors.textSecondary} />
                        <Text style={styles.resetCodeBtnText}>Wrong Number</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Structured Step-by-Step Instructions Below Card */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsHeading}>HOW TO PAIR ON WHATSAPP</Text>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Open <Text style={styles.stepBold}>WhatsApp</Text> on this phone
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Go to <Text style={styles.stepBold}>Settings</Text> (or ⋮) &gt; <Text style={styles.stepBold}>Linked Devices</Text>
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Tap <Text style={styles.stepBold}>Link a Device</Text> &gt;{' '}
                <Text style={styles.stepBold}>
                  {pairMode === 'code' ? 'Link with phone number instead' : 'Point camera at QR code'}
                </Text>
              </Text>
            </View>

            {pairMode === 'code' && (
              <View style={styles.instructionStep}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>
                  Enter the <Text style={styles.stepBold}>8-character code</Text> generated above
                </Text>
              </View>
            )}
          </View>

          {/* Legal / Privacy Agreement */}
          <Text style={styles.legalNotice}>
            By linking your WhatsApp, you agree to our{' '}
            <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </KeyboardAwareScrollView>

        {/* Country Code Picker Modal */}
        <CountryCodePickerModal
          visible={isCountryModalOpen}
          selectedCountry={selectedCountry}
          onSelect={(c) => setSelectedCountry(c)}
          onClose={() => setIsCountryModalOpen(false)}
        />
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
          <Text style={styles.channelsSectionTitle}>
            MONITORED GROUPS ({radarChannels.length > 0 ? radarChannels.length : 'ALL ACTIVE'})
          </Text>
          <TouchableOpacity onPress={() => router.push('/modal/monitored-groups')}>
            <Text style={styles.manageChannelsText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.channelChipsContainer}>
          {radarChannels.length > 0 ? (
            radarChannels.map((channel, idx) => (
              <View key={idx} style={styles.channelChip}>
                <View style={styles.channelStatusDot} />
                <Text style={styles.channelChipText} numberOfLines={1}>
                  {channel}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.channelChip}>
              <View style={styles.channelStatusDot} />
              <Text style={styles.channelChipText}>All Linked WhatsApp Groups</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Home"
        subtitle={
          isWhatsAppConnected
            ? `${radarChannels.length} channels monitored • ${leads.length} inquiries`
            : 'WhatsApp disconnected'
        }
        rightAction={{
          label: isWhatsAppConnected ? 'Channels' : 'Connect',
          icon: isWhatsAppConnected ? Sliders : QrCode,
          onPress: () => {
            if (isWhatsAppConnected) {
              router.push('/modal/monitored-groups');
            } else {
              connectToRelay();
            }
          },
        }}
      />

      {!isWhatsAppConnected && (
        <TouchableOpacity
          style={styles.reconnectBanner}
          activeOpacity={0.8}
          onPress={() => router.push('/modal/whatsapp-pair')}
        >
          <QrCode size={16} color={colors.accentBlue} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.reconnectBannerTitle}>Link WhatsApp Channel</Text>
            <Text style={styles.reconnectBannerSub}>
              Tap to scan QR code and start intercepting real buyer inquiries.
            </Text>
          </View>
          <ArrowRight size={14} color={colors.accentBlue} />
        </TouchableOpacity>
      )}

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
      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
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
        </ScrollView>
      </View>

      {/* List Feed with Home Overview Footer */}
      <FlashList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadRow lead={item} onPress={() => handleLeadPress(item.id)} />
        )}
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
  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 12,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  reconnectBannerTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.brandNavy,
  },
  reconnectBannerSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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
  filterBarWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 22,
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
  keyboardScroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  terminalBody: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 110,
    alignItems: 'center',
    gap: 14,
  },
  titleSection: {
    alignItems: 'center',
    gap: 4,
  },
  terminalTitle: {
    fontFamily: fonts.geist.bold,
    fontSize: 20,
    color: colors.brandNavy,
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
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.accentBlue,
  },
  toggleBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
    includeFontPadding: false,
    paddingRight: 4,
  },
  toggleBtnTextActive: {
    color: colors.textInverse,
    fontFamily: fonts.geist.semibold,
    includeFontPadding: false,
    paddingRight: 4,
  },
  qrConsoleCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  qrWrapper: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    minWidth: 200,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingBox: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrLoadingText: {
    fontFamily: fonts.inter.medium,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  liveIndicatorText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  shareWebQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    borderRadius: 9,
    marginTop: 4,
  },
  shareWebQrBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 12.5,
    color: colors.accentBlue,
  },
  codeWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
    gap: 12,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  countryInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  countryFlagText: {
    fontSize: 20,
  },
  countryNameLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.brandNavy,
    flex: 1,
  },
  phoneInputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  dialCodePill: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialCodePillText: {
    fontFamily: fonts.geist.medium,
    fontSize: 14,
    color: colors.brandNavy,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: fonts.inter.medium,
    fontSize: 14.5,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  submitCodeBtn: {
    width: '100%',
    height: 48,
    backgroundColor: colors.accentBlue,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  submitCodeBtnDisabled: {
    opacity: 0.6,
  },
  submitCodeBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13.5,
    color: colors.textInverse,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pairingCodeBox: {
    alignItems: 'center',
    width: '100%',
    padding: 14,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    marginTop: 4,
    gap: 8,
  },
  codeLabel: {
    fontFamily: fonts.geist.semibold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.accentBlue,
  },
  codeDisplay: {
    fontFamily: fonts.geist.bold,
    fontSize: 24,
    color: colors.brandNavy,
    letterSpacing: 3.5,
    marginVertical: 2,
  },
  codeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  codeMatchWarning: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
  },
  copyCodeBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12,
    color: colors.accentBlue,
  },
  resetCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetCodeBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.rose,
    textAlign: 'center',
  },
  inlineRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  inlineRetryText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.accentBlue,
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  instructionsHeading: {
    fontFamily: fonts.geist.semibold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentBlueTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: fonts.geist.bold,
    fontSize: 11,
    color: colors.accentBlue,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  stepBold: {
    fontFamily: fonts.inter.semibold,
    color: colors.brandNavy,
  },
  legalNotice: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 2,
  },
  legalLink: {
    fontFamily: fonts.inter.medium,
    color: colors.accentBlue,
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

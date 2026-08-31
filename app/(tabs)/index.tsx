import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  Search,
  Plus,
  QrCode,
  Smartphone,
  Zap,
} from 'lucide-react-native';

const WHATSAPP_PAIRING_PAYLOAD =
  '2@J6+p4Wz...MikanaEngineV1,4N7qP==,vQ5L4s9x8K,sK3==';

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
  } = useLeadStore();

  const { isWhatsAppConnected, radarChannels, setWhatsAppConnected } = useSettingsStore();
  const filteredLeads = getFilteredLeads();

  const [pairMode, setPairMode] = useState<'qr' | 'code'>('qr');
  const [isLinking, setIsLinking] = useState(false);

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

  const handleSimulatePair = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLinking(true);
    setTimeout(() => {
      setWhatsAppConnected(true, '+27 82 194 8831');
      setIsLinking(false);
    }, 600);
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
                  <QRCode
                    value={WHATSAPP_PAIRING_PAYLOAD}
                    size={160}
                    color={colors.brandNavy}
                    backgroundColor={colors.surface}
                  />
                </View>
                <Text style={styles.liveIndicatorText}>Ready for WhatsApp scan</Text>
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

  // ─── Connected Feed Screen ──────────────────────────────────────────────────

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

      {/* List Feed */}
      <FlashList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadRow lead={item} onPress={() => handleLeadPress(item.id)} />
        )}
        estimatedItemSize={72}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    borderBottomColor: colors.accentBlue, // Royal blue accent
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
    paddingBottom: 90,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
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

  // ─── Disconnected First-Time Screen (Fits 1 screen exactly, zero scroll) ────
  disconnectedContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  terminalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 84, // Clearance for floating glass pill nav
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
    backgroundColor: colors.accentBlue, // Royal blue accent for active mode
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
    borderColor: colors.accentBlueBorder, // Royal blue hairline border
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
    backgroundColor: colors.accentBlue, // Royal blue primary CTA
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
});

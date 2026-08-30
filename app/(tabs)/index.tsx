import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import * as Haptics from 'expo-haptics';
import {
  Search,
  Plus,
  MessageCircle,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
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
  } = useLeadStore();

  const { isWhatsAppConnected, radarChannels, setWhatsAppConnected } = useSettingsStore();
  const filteredLeads = getFilteredLeads();

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

  const handleSelectFilter = (newFilter: LeadFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(newFilter);
  };

  // ─── Disconnected / First-Time State ────────────────────────────────────────

  if (!isWhatsAppConnected) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Mikana"
          subtitle="Setup Required"
          statusDot="warning"
        />

        <ScrollView
          contentContainerStyle={styles.onboardingContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Icon */}
          <View style={styles.heroIconWrapper}>
            <View style={styles.heroIconCircle}>
              <MessageCircle size={32} color={colors.accentBlue} strokeWidth={2} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heroTitle}>
            Connect WhatsApp to start capturing inquiries
          </Text>
          <Text style={styles.heroSubtitle}>
            Mikana listens to buyer requests across your business groups and synthesizes competitive quotes in seconds.
          </Text>

          {/* Value Props */}
          <View style={styles.valuePropsCard}>
            <View style={styles.valuePropItem}>
              <Zap size={18} color={colors.accentBlue} strokeWidth={2} style={styles.propIcon} />
              <View style={styles.propTextCol}>
                <Text style={styles.propTitle}>Instant RFQ Interception</Text>
                <Text style={styles.propSub}>
                  Detects buyer requests and RFQs across your WhatsApp groups in real time.
                </Text>
              </View>
            </View>

            <View style={styles.propDivider} />

            <View style={styles.valuePropItem}>
              <Sparkles size={18} color={colors.brandNavy} strokeWidth={2} style={styles.propIcon} />
              <View style={styles.propTextCol}>
                <Text style={styles.propTitle}>AI Proposal Studio</Text>
                <Text style={styles.propSub}>
                  Generates personalized, priced quotes grounded in your catalog offerings.
                </Text>
              </View>
            </View>

            <View style={styles.propDivider} />

            <View style={styles.valuePropItem}>
              <CheckCircle2 size={18} color={colors.emerald} strokeWidth={2} style={styles.propIcon} />
              <View style={styles.propTextCol}>
                <Text style={styles.propTitle}>1-Tap WhatsApp DM Dispatch</Text>
                <Text style={styles.propSub}>
                  Reach the buyer's private inbox with a tailored pitch before competitors reply.
                </Text>
              </View>
            </View>
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.connectPrimaryBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/modal/whatsapp-pair')}
          >
            <MessageCircle size={18} color={colors.surface} strokeWidth={2.5} />
            <Text style={styles.connectPrimaryBtnText}>Link WhatsApp Account</Text>
            <ChevronRight size={16} color={colors.surface} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Secondary Demo Action */}
          <TouchableOpacity
            style={styles.demoBtn}
            activeOpacity={0.7}
            onPress={() => setWhatsAppConnected(true, '+1 (415) 908-2214')}
          >
            <Text style={styles.demoBtnText}>Explore with Sample Inquiries</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Connected Feed State ───────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Home"
        subtitle={`${radarChannels.length} groups active • ${leads.length} inquiries`}
        statusDot="active"
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
              onPress={() => handleSelectFilter(tab.id)}
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
          <LeadRow
            lead={item}
            onPress={() => handleLeadPress(item.id)}
          />
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
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
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
    borderBottomColor: colors.brandNavy,
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
    paddingBottom: 32,
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

  // Onboarding / Disconnected Styles
  onboardingContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroIconWrapper: {
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: fonts.geist.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.brandNavy,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  valuePropsCard: {
    width: '100%',
    backgroundColor: colors.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 28,
    gap: 14,
  },
  valuePropItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  propIcon: {
    marginTop: 2,
  },
  propTextCol: {
    flex: 1,
    gap: 2,
  },
  propTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  propSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  propDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  connectPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandNavy,
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 14,
  },
  connectPrimaryBtnText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 15,
    color: colors.surface,
    letterSpacing: -0.2,
  },
  demoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  demoBtnText: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: colors.accentBlue,
  },
});

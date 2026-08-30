import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLeadStore } from '../../src/store/useLeadStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { LeadRow } from '../../src/components/radar/LeadRow';
import { Input } from '../../src/components/ui/Input';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { LeadFilter } from '../../src/types/lead';
import {
  Search,
  Plus,
  MessageCircle,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';

export default function RadarScreen() {
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

  const { radarChannels } = useSettingsStore();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle}>Home</Text>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, radarChannels.length > 0 ? styles.statusDotActive : styles.statusDotInactive]} />
            <Text style={styles.headerSub}>
              {radarChannels.length > 0
                ? `${radarChannels.length} groups active • ${leads.length} inquiries`
                : 'WhatsApp not connected'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/modal/new-lead')}
          style={styles.addBtn}
        >
          <Plus size={14} color={colors.textInverse} strokeWidth={2.5} />
          <Text style={styles.addBtnText}>New Inquiry</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="Search buyer requests, RFQs, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconLeft={<Search size={14} color={colors.textMuted} />}
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Minimal Filter Tabs */}
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

      {/* Clean List Stream (Zero Floating Cards) */}
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
        ListHeaderComponent={
          radarChannels.length === 0 ? (
            <View style={styles.connectCard}>
              <View style={styles.connectRow}>
                <AlertCircle size={16} color={colors.amber} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectTitle}>Link WhatsApp to get started</Text>
                  <Text style={styles.connectSub}>
                    Mikana monitors buyer requests across your business groups and drafts quotes instantly.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.connectBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/modal/whatsapp-pair')}
              >
                <MessageCircle size={14} color={colors.surface} strokeWidth={2.5} />
                <Text style={styles.connectBtnLabel}>Link WhatsApp Account</Text>
                <ChevronRight size={13} color={colors.surface} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          radarChannels.length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matching inquiries</Text>
              <Text style={styles.emptySubtitle}>
                Incoming buyer requests from your WhatsApp groups will appear here.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  appTitle: {
    fontFamily: fonts.geist.bold,
    fontSize: 26,
    color: colors.textHeading,
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: colors.emerald,
  },
  statusDotInactive: {
    backgroundColor: colors.textMuted,
  },
  headerSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },
  addBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 13,
    color: colors.textInverse,
    letterSpacing: -0.1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 16,
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
    color: colors.textHeading,
  },
  listContent: {
    backgroundColor: colors.surface,
    paddingBottom: 32,
  },
  // WhatsApp zero-state connect card
  connectCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.amberBorder,
    borderRadius: 10,
    gap: 12,
  },
  connectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  connectTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  connectSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.brandNavy,
    borderRadius: 8,
    paddingVertical: 11,
  },
  connectBtnLabel: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: -0.2,
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
});

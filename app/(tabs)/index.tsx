import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { LeadFilter } from '../../src/types/lead';
import {
  Search,
  Plus,
  Radio,
  SlidersHorizontal,
} from 'lucide-react-native';
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
        <View>
          <Text style={styles.appTitle}>Opportunities</Text>
          <Text style={styles.headerSub}>
            Monitoring {radarChannels.length} WhatsApp channels • {leads.length} active
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/modal/new-lead')}
          style={styles.addBtn}
        >
          <Plus size={16} color={colors.textInverse} />
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
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadRow
            lead={item}
            onPress={() => handleLeadPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Radio size={28} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No matching opportunities</Text>
            <Text style={styles.emptySubtitle}>
              Incoming buyer inquiries from your linked WhatsApp groups will appear here automatically.
            </Text>
          </View>
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.brandNavyDark,
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandNavy,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textInverse,
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
    borderBottomWidth: 1,
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeFilterTabText: {
    color: colors.brandNavyDark,
    fontWeight: '700',
  },
  listContent: {
    backgroundColor: colors.surface,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

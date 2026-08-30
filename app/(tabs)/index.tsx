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
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { LeadCard } from '../../src/components/radar/LeadCard';
import { LeadFilterBar } from '../../src/components/radar/LeadFilterBar';
import { Input } from '../../src/components/ui/Input';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import {
  Radio,
  Search,
  Plus,
  RefreshCw,
  Crown,
  Lock,
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
    simulateIncomingLead,
    setSelectedLeadId,
    leads,
  } = useLeadStore();

  const { status, setPaywallVisible } = useSubscriptionStore();
  const { radarChannels } = useSettingsStore();
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredLeads = getFilteredLeads();

  const counts = {
    all: leads.length,
    hot: leads.filter((l) => l.matchScore >= 90).length,
    urgent: leads.filter((l) => l.urgency === 'urgent').length,
    captured: leads.filter((l) => l.stage === 'captured').length,
    quoted: leads.filter((l) => l.stage === 'quoted').length,
    won: leads.filter((l) => l.stage === 'won').length,
  };

  const handleSimulateDrop = () => {
    setIsSimulating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      simulateIncomingLead();
      setIsSimulating(false);
    }, 400);
  };

  const handleLeadPress = (leadId: string) => {
    setSelectedLeadId(leadId);
    router.push('/modal/pitch');
  };

  const handlePitchPress = (leadId: string) => {
    setSelectedLeadId(leadId);
    router.push('/modal/pitch');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.appTitle}>Mikana</Text>
            <Badge variant="emerald" showDot>
              Radar Live
            </Badge>
          </View>
          <Text style={styles.headerSub}>
            Scanning {radarChannels.length} active WhatsApp groups
          </Text>
        </View>

        <View style={styles.headerRight}>
          {status.isPro ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/modal/paywall')}
              style={styles.proBadge}
            >
              <Crown size={12} color={colors.amber} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPaywallVisible(true)}
              style={styles.upgradeBtn}
            >
              <Crown size={12} color={colors.brandNavy} />
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSimulateDrop}
            style={styles.actionIconBtn}
          >
            <RefreshCw
              size={15}
              color={colors.textSecondary}
              style={isSimulating ? styles.rotating : undefined}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/modal/new-lead')}
            style={[styles.actionIconBtn, styles.addBtn]}
          >
            <Plus size={16} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Free Tier Lead Counter Banner */}
      {!status.isPro && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/modal/paywall')}
          style={styles.freeTierBanner}
        >
          <View style={styles.freeTierLeft}>
            <Lock size={12} color={colors.amber} />
            <Text style={styles.freeTierText}>
              Free Plan: <Text style={styles.boldText}>{status.leadsRemainingThisWeek} / 5 leads</Text> left this week
            </Text>
          </View>
          <Text style={styles.unlockProLink}>Unlock Pro →</Text>
        </TouchableOpacity>
      )}

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="Search buyer requests, services, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconLeft={<Search size={15} color={colors.textMuted} />}
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Filter Tabs */}
      <LeadFilterBar
        activeFilter={filter}
        onSelectFilter={setFilter}
        counts={counts}
      />

      {/* Leads Feed */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            onPress={() => handleLeadPress(item.id)}
            onPitchPress={() => handlePitchPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Radio size={32} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No matching opportunities</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filter or tap "Simulate Inquiry" to intercept real-time channel leads.
            </Text>
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={13} color={colors.brandNavy} />}
              onPress={handleSimulateDrop}
              style={styles.emptyBtn}
            >
              Simulate Channel Lead
            </Button>
          </View>
        }
      />
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
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amber,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upgradeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandNavy,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  freeTierBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.amberBg,
    borderBottomWidth: 1,
    borderColor: colors.amberBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  freeTierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeTierText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: colors.brandNavy,
  },
  unlockProLink: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandNavy,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.canvas,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyBtn: {
    marginTop: 4,
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
});

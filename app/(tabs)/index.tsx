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
import {
  Radio,
  Search,
  Plus,
  Zap,
  Sparkles,
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
      {/* Top App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.appTitle}>Mikana</Text>
            <Badge variant="emerald" showDot>
              Radar Active
            </Badge>
          </View>
          <Text style={styles.headerSub}>
            Monitoring {radarChannels.length} business channels
          </Text>
        </View>

        <View style={styles.headerRight}>
          {status.isPro ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/modal/paywall')}
              style={styles.proBadge}
            >
              <Crown size={12} color="#f59e0b" />
              <Text style={styles.proBadgeText}>PRO</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPaywallVisible(true)}
              style={styles.upgradeBtn}
            >
              <Sparkles size={12} color="#3b82f6" />
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSimulateDrop}
            style={styles.actionIconBtn}
          >
            <RefreshCw
              size={16}
              color="#f4f4f5"
              style={isSimulating ? styles.rotating : undefined}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/modal/new-lead')}
            style={[styles.actionIconBtn, styles.addBtn]}
          >
            <Plus size={18} color="#09090b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Free Tier Lead Counter Warning if not Pro */}
      {!status.isPro && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/modal/paywall')}
          style={styles.freeTierBanner}
        >
          <View style={styles.freeTierLeft}>
            <Lock size={13} color="#f59e0b" />
            <Text style={styles.freeTierText}>
              Free Plan: <Text style={styles.boldText}>{status.leadsRemainingThisWeek} / 5 leads left</Text> this week
            </Text>
          </View>
          <Text style={styles.unlockProLink}>Get Unlimited Pro →</Text>
        </TouchableOpacity>
      )}

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="Search leads, keywords, locations, buyers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconLeft={<Search size={16} color="#71717a" />}
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Horizontal Filter Bar */}
      <LeadFilterBar
        activeFilter={filter}
        onSelectFilter={setFilter}
        counts={counts}
      />

      {/* Leads Stream */}
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
            <Radio size={36} color="#27272a" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No matching opportunities</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filter or tap "Simulate Lead" to intercept incoming channel inquiries.
            </Text>
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={14} color="#f4f4f5" />}
              onPress={handleSimulateDrop}
              style={styles.emptyBtn}
            >
              Simulate Incoming Lead
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
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
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
    color: '#f4f4f5',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  upgradeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: '#f4f4f5',
    borderColor: '#f4f4f5',
  },
  freeTierBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
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
    color: '#d4d4d8',
  },
  boldText: {
    fontWeight: '700',
    color: '#f59e0b',
  },
  unlockProLink: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4f4f5',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#71717a',
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

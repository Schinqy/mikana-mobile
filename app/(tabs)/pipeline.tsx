import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLeadStore } from '../../src/store/useLeadStore';
import { DealStage } from '../../src/types/lead';
import { DealCard } from '../../src/components/pipeline/DealCard';
import { Badge } from '../../src/components/ui/Badge';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import {
  DollarSign,
  TrendingUp,
  Inbox,
  Send,
  MessageSquare,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

const STAGES: Array<{ id: DealStage; label: string; icon: any; color: string }> = [
  { id: 'captured', label: 'Captured Leads', icon: Inbox, color: colors.brandNavy },
  { id: 'quoted', label: 'Proposals Quoted', icon: Send, color: colors.accentBlue },
  { id: 'negotiating', label: 'In Negotiation', icon: MessageSquare, color: colors.amber },
  { id: 'won', label: 'Deals Won', icon: CheckCircle, color: colors.emerald },
  { id: 'lost', label: 'Archived / Lost', icon: XCircle, color: colors.rose },
];

export default function PipelineScreen() {
  const router = useRouter();
  const { leads, updateStage, setSelectedLeadId } = useLeadStore();

  const activeDeals = leads.filter((l) => l.stage !== 'lost');
  const wonDeals = leads.filter((l) => l.stage === 'won');

  const totalWonValue = wonDeals.reduce((sum, l) => sum + (l.quotedAmount || 0), 0);
  const activePipelineValue = activeDeals.reduce(
    (sum, l) => sum + (l.quotedAmount || (l.budgetEstimate ? parseInt(l.budgetEstimate.replace(/[^\d]/g, '') || '0', 10) : 0)),
    0
  );

  const handleLeadPress = (id: string) => {
    setSelectedLeadId(id);
    router.push('/modal/pitch');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Deals</Text>
          <Text style={styles.subtitle}>Quoted proposals and closed revenue</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Pipeline Valuation Summary Cards */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <TrendingUp size={14} color={colors.accentBlue} />
              <Text style={styles.metricLabel}>Active Pipeline</Text>
            </View>
            <Text style={styles.metricValue}>
              ${activePipelineValue.toLocaleString()}
            </Text>
            <Text style={styles.metricMeta}>{activeDeals.length} active opportunities</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <CheckCircle size={14} color={colors.emerald} />
              <Text style={styles.metricLabel}>Closed Won</Text>
            </View>
            <Text style={[styles.metricValue, styles.wonValue]}>
              ${totalWonValue.toLocaleString()}
            </Text>
            <Text style={styles.metricMeta}>{wonDeals.length} deals closed</Text>
          </Card>
        </View>

        {/* Stage Swimlanes */}
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const StageIcon = stage.icon;

          return (
            <View key={stage.id} style={styles.stageSection}>
              <View style={styles.stageHeader}>
                <View style={styles.stageTitleRow}>
                  <StageIcon size={14} color={stage.color} />
                  <Text style={styles.stageTitle}>{stage.label}</Text>
                  <View style={styles.stageCount}>
                    <Text style={styles.stageCountText}>{stageLeads.length}</Text>
                  </View>
                </View>
              </View>

              {stageLeads.length > 0 ? (
                stageLeads.map((lead) => (
                  <DealCard
                    key={lead.id}
                    lead={lead}
                    onPress={() => handleLeadPress(lead.id)}
                    onMoveStage={(nextStage) => updateStage(lead.id, nextStage)}
                  />
                ))
              ) : (
                <View style={styles.emptyStage}>
                  <Text style={styles.emptyStageText}>No deals in this stage</Text>
                </View>
              )}
            </View>
          );
        })}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.geist.bold,
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  metricValue: {
    fontFamily: fonts.geist.bold,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  wonValue: {
    color: colors.emerald,
  },
  metricMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  stageSection: {
    marginBottom: 18,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  stageCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  stageCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptyStage: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStageText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

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
  { id: 'captured', label: 'Captured Leads', icon: Inbox, color: '#3b82f6' },
  { id: 'quoted', label: 'Proposals Quoted', icon: Send, color: '#3b82f6' },
  { id: 'negotiating', label: 'In Negotiation', icon: MessageSquare, color: '#a78bfa' },
  { id: 'won', label: 'Deals Won', icon: CheckCircle, color: '#10b981' },
  { id: 'lost', label: 'Archived / Lost', icon: XCircle, color: '#f43f5e' },
];

export default function PipelineScreen() {
  const router = useRouter();
  const { leads, updateStage, setSelectedLeadId } = useLeadStore();
  const [selectedStageTab, setSelectedStageTab] = useState<DealStage | 'all'>('all');

  // Compute metrics
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
          <Text style={styles.title}>Deal Pipeline CRM</Text>
          <Text style={styles.subtitle}>Track leads from radar interception to closed revenue</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Pipeline Valuation Summary Cards */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <TrendingUp size={14} color="#3b82f6" />
              <Text style={styles.metricLabel}>Active Pipeline</Text>
            </View>
            <Text style={styles.metricValue}>
              ${activePipelineValue.toLocaleString()}
            </Text>
            <Text style={styles.metricMeta}>{activeDeals.length} active opportunities</Text>
          </Card>

          <Card style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <CheckCircle size={14} color="#10b981" />
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
                  <View style={styles.countPill}>
                    <Text style={styles.countPillText}>{stageLeads.length}</Text>
                  </View>
                </View>
              </View>

              {stageLeads.length === 0 ? (
                <View style={styles.emptyStage}>
                  <Text style={styles.emptyStageText}>No deals in this stage</Text>
                </View>
              ) : (
                stageLeads.map((lead) => (
                  <DealCard
                    key={lead.id}
                    lead={lead}
                    onPress={() => handleLeadPress(lead.id)}
                    onMoveStage={(next) => updateStage(lead.id, next)}
                  />
                ))
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
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
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
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: -0.4,
  },
  wonValue: {
    color: '#10b981',
  },
  metricMeta: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 4,
  },
  stageSection: {
    marginBottom: 20,
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
    gap: 6,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: -0.2,
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#18181b',
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  emptyStage: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#18181b',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStageText: {
    fontSize: 12,
    color: '#52525b',
  },
});

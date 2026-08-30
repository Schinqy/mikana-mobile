import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lead, DealStage } from '../../types/lead';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DollarSign, ArrowRight, MessageSquare, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface DealCardProps {
  lead: Lead;
  onPress: () => void;
  onMoveStage: (nextStage: DealStage) => void;
}

export const DealCard: React.FC<DealCardProps> = ({
  lead,
  onPress,
  onMoveStage,
}) => {
  const handleStageChange = (stage: DealStage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMoveStage(stage);
  };

  const renderStageActions = () => {
    switch (lead.stage) {
      case 'captured':
        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleStageChange('quoted')}
            style={styles.actionPill}
          >
            <Text style={styles.actionPillText}>Quote Deal</Text>
            <ArrowRight size={12} color="#3b82f6" />
          </TouchableOpacity>
        );
      case 'quoted':
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStageChange('negotiating')}
              style={styles.actionPill}
            >
              <Text style={styles.actionPillText}>Negotiate</Text>
              <ArrowRight size={12} color="#a78bfa" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStageChange('won')}
              style={[styles.actionPill, styles.wonPill]}
            >
              <Check size={12} color="#10b981" />
              <Text style={[styles.actionPillText, styles.wonText]}>Won</Text>
            </TouchableOpacity>
          </View>
        );
      case 'negotiating':
        return (
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStageChange('won')}
              style={[styles.actionPill, styles.wonPill]}
            >
              <Check size={12} color="#10b981" />
              <Text style={[styles.actionPillText, styles.wonText]}>Close Deal (Won)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStageChange('lost')}
              style={[styles.actionPill, styles.lostPill]}
            >
              <X size={12} color="#f43f5e" />
            </TouchableOpacity>
          </View>
        );
      case 'won':
        return (
          <Badge variant="emerald" icon={<Check size={12} color="#10b981" />}>
            Closed & Won
          </Badge>
        );
      case 'lost':
        return (
          <Badge variant="rose" icon={<X size={12} color="#f43f5e" />}>
            Lost / Archived
          </Badge>
        );
    }
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.senderText} numberOfLines={1}>
          {lead.senderName}
        </Text>
        <Text style={styles.channelText} numberOfLines={1}>
          {lead.channelName.split(' ')[0]}
        </Text>
      </View>

      <Text style={styles.summaryText} numberOfLines={2}>
        {lead.aiSummary || lead.rawText}
      </Text>

      <View style={styles.valueRow}>
        <View style={styles.valueItem}>
          <DollarSign size={13} color="#10b981" />
          <Text style={styles.valueText}>
            {lead.quotedAmount
              ? `$${lead.quotedAmount.toLocaleString()}`
              : lead.budgetEstimate || 'Quote Required'}
          </Text>
        </View>
        <Badge variant={lead.matchScore >= 90 ? 'emerald' : 'blue'}>
          {lead.matchScore}% Match
        </Badge>
      </View>

      <View style={styles.footerRow}>{renderStageActions()}</View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  senderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f4f4f5',
    flex: 1,
  },
  channelText: {
    fontSize: 11,
    color: '#71717a',
  },
  summaryText: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 16,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#18181b',
    marginBottom: 8,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 4,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  wonPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  wonText: {
    color: '#10b981',
  },
  lostPill: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
});

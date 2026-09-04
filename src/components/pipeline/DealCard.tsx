import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lead, DealStage } from '../../types/lead';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { colors } from '../../theme/colors';
import { DollarSign, ArrowRight, Check, X } from 'lucide-react-native';
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
            <ArrowRight size={12} color={colors.brandNavy} />
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
              <ArrowRight size={12} color={colors.accentBlue} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStageChange('won')}
              style={[styles.actionPill, styles.wonPill]}
            >
              <Check size={12} color={colors.emerald} />
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
              <Check size={12} color={colors.emerald} />
              <Text style={[styles.actionPillText, styles.wonText]}>Close (Won)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleStageChange('lost')}
              style={[styles.actionPill, styles.lostPill]}
            >
              <X size={12} color={colors.rose} />
            </TouchableOpacity>
          </View>
        );
      case 'won':
        return (
          <Badge variant="emerald" icon={<Check size={12} color={colors.emerald} />}>
            Closed & Won
          </Badge>
        );
      case 'lost':
        return (
          <Badge variant="rose" icon={<X size={12} color={colors.rose} />}>
            Lost
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
          {lead.channelName}
        </Text>
      </View>

      <Text style={styles.summaryText} numberOfLines={2}>
        {lead.aiSummary || lead.rawText}
      </Text>

      <View style={styles.valueRow}>
        <View style={styles.valueItem}>
          <DollarSign size={13} color={colors.emerald} />
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.textPrimary,
    flex: 1,
  },
  channelText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  summaryText: {
    fontSize: 12,
    color: colors.textSecondary,
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
    borderColor: colors.surfaceElevated,
    marginBottom: 8,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textHeading,
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandNavy,
  },
  wonPill: {
    backgroundColor: colors.emeraldBg,
    borderColor: colors.emeraldBorder,
  },
  wonText: {
    color: colors.emerald,
  },
  lostPill: {
    backgroundColor: colors.roseBg,
    borderColor: colors.roseBorder,
  },
});

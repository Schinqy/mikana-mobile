import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lead } from '../../types/lead';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Sparkles,
  MapPin,
  DollarSign,
  Clock,
  Radio,
  ArrowRight,
  MessageSquare,
  CheckCircle,
} from 'lucide-react-native';

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
  onPitchPress: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onPress,
  onPitchPress,
}) => {
  const getUrgencyBadge = () => {
    switch (lead.urgency) {
      case 'urgent':
        return <Badge variant="rose" showDot>Urgent Lead</Badge>;
      case 'medium':
        return <Badge variant="amber" showDot>Medium Priority</Badge>;
      default:
        return <Badge variant="default">Standard</Badge>;
    }
  };

  const getStageBadge = () => {
    switch (lead.stage) {
      case 'won':
        return <Badge variant="emerald">Deal Won</Badge>;
      case 'negotiating':
        return <Badge variant="violet">Negotiating</Badge>;
      case 'quoted':
        return <Badge variant="blue">Quoted</Badge>;
      default:
        return null;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Card
      onPress={onPress}
      style={styles.card}
      highlightBorder={lead.matchScore >= 90}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <Badge
            variant={lead.matchScore >= 90 ? 'emerald' : 'blue'}
            icon={<Sparkles size={10} color={lead.matchScore >= 90 ? '#10b981' : '#3b82f6'} />}
          >
            {lead.matchScore}% Match
          </Badge>
          {getUrgencyBadge()}
          {getStageBadge()}
        </View>
        <Text style={styles.timeText}>{timeAgo(lead.createdAt)}</Text>
      </View>

      {/* Channel Source & Sender */}
      <View style={styles.channelRow}>
        <Radio size={12} color="#71717a" style={styles.channelIcon} />
        <Text style={styles.channelText} numberOfLines={1}>
          {lead.channelName} • {lead.senderName}
        </Text>
      </View>

      {/* AI Summary / Headline */}
      <Text style={styles.summaryTitle} numberOfLines={2}>
        {lead.aiSummary || lead.rawText}
      </Text>

      {/* Meta Specs Grid */}
      <View style={styles.metaRow}>
        {lead.budgetEstimate ? (
          <View style={styles.metaItem}>
            <DollarSign size={13} color="#10b981" />
            <Text style={styles.metaText}>{lead.budgetEstimate}</Text>
          </View>
        ) : null}

        {lead.location ? (
          <View style={styles.metaItem}>
            <MapPin size={13} color="#a1a1aa" />
            <Text style={styles.metaText}>{lead.location}</Text>
          </View>
        ) : null}

        <View style={styles.metaItem}>
          <Clock size={13} color="#a1a1aa" />
          <Text style={styles.metaText}>{lead.category}</Text>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footerRow}>
        {lead.stage === 'quoted' || lead.stage === 'negotiating' || lead.stage === 'won' ? (
          <View style={styles.quotedStatusRow}>
            <CheckCircle size={14} color="#10b981" />
            <Text style={styles.quotedStatusText}>
              {lead.quotedAmount ? `Quoted $${lead.quotedAmount.toLocaleString()}` : 'Proposal Dispatched'}
            </Text>
          </View>
        ) : (
          <Text style={styles.rawPreview} numberOfLines={1}>
            "{lead.rawText.slice(0, 45)}..."
          </Text>
        )}

        <Button
          size="sm"
          variant={lead.stage === 'captured' ? 'primary' : 'secondary'}
          icon={<MessageSquare size={13} color={lead.stage === 'captured' ? '#09090b' : '#f4f4f5'} />}
          iconRight={<ArrowRight size={13} color={lead.stage === 'captured' ? '#09090b' : '#f4f4f5'} />}
          onPress={onPitchPress}
        >
          {lead.generatedPitch ? 'View Pitch' : 'AI Pitch'}
        </Button>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 11,
    color: '#71717a',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  channelIcon: {
    marginRight: 5,
  },
  channelText: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4f4f5',
    lineHeight: 20,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#18181b',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rawPreview: {
    fontSize: 12,
    color: '#71717a',
    flex: 1,
    marginRight: 10,
    fontStyle: 'italic',
  },
  quotedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  quotedStatusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
});

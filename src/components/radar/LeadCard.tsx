import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lead } from '../../types/lead';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import {
  ArrowRight,
  DollarSign,
  MapPin,
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
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
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
    <Card onPress={onPress} style={styles.card}>
      {/* Top Header: Sender & Channel */}
      <View style={styles.headerRow}>
        <View style={styles.senderGroup}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(lead.senderName)}</Text>
          </View>
          <View style={styles.nameColumn}>
            <Text style={styles.senderName} numberOfLines={1}>
              {lead.senderName}
            </Text>
            <View style={styles.sourceRow}>
              <Badge variant="blue">WhatsApp</Badge>
              <Text style={styles.channelName} numberOfLines={1}>
                {lead.channelName}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.timeAgoText}>{timeAgo(lead.createdAt)}</Text>
      </View>

      {/* Main Request Headline */}
      <Text style={styles.requestText} numberOfLines={3}>
        {lead.aiSummary || lead.rawText}
      </Text>

      {/* Structured Details: Budget & Location */}
      <View style={styles.metaRow}>
        {lead.budgetEstimate ? (
          <View style={styles.budgetPill}>
            <Text style={styles.budgetText}>{lead.budgetEstimate}</Text>
          </View>
        ) : null}

        {lead.location ? (
          <View style={styles.locationPill}>
            <MapPin size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
            <Text style={styles.locationText} numberOfLines={1}>{lead.location}</Text>
          </View>
        ) : null}

        {lead.urgency === 'urgent' && (
          <View style={styles.urgentPill}>
            <Text style={styles.urgentText}>Urgent</Text>
          </View>
        )}

        {lead.stage === 'quoted' && (
          <View style={styles.quotedPill}>
            <CheckCircle size={11} color={colors.emerald} style={{ marginRight: 3 }} />
            <Text style={styles.quotedText}>Quoted</Text>
          </View>
        )}
      </View>

      {/* Action Divider & Button */}
      <View style={styles.footerRow}>
        <Button
          size="sm"
          variant="primary"
          onPress={onPitchPress}
          iconRight={<ArrowRight size={13} color={colors.textInverse} />}
          style={styles.actionButton}
        >
          {lead.stage === 'quoted' ? 'View Sent Proposal' : 'Draft Quote'}
        </Button>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  senderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentBlueTint,
    borderWidth: 1,
    borderColor: colors.accentBlueBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  nameColumn: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  channelName: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 6,
    flex: 1,
  },
  timeAgoText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  requestText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 21,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  budgetPill: {
    backgroundColor: colors.emeraldBg,
    borderColor: colors.emeraldBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  budgetText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  urgentPill: {
    backgroundColor: colors.roseBg,
    borderColor: colors.roseBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentText: {
    fontSize: 11,
    color: colors.rose,
    fontWeight: '600',
  },
  quotedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.emeraldBg,
    borderColor: colors.emeraldBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quotedText: {
    fontSize: 11,
    color: colors.emerald,
    fontWeight: '600',
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: '100%',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lead } from '../../types/lead';
import { colors } from '../../theme/colors';
import { ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface LeadRowProps {
  lead: Lead;
  onPress: () => void;
}

export const LeadRow: React.FC<LeadRowProps> = ({ lead, onPress }) => {
  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isQuoted = lead.stage === 'quoted' || lead.stage === 'won';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.row}
    >
      <View style={styles.contentColumn}>
        {/* Top Metadata Row: Sender & Timestamp */}
        <View style={styles.metaRow}>
          <Text style={styles.senderName} numberOfLines={1}>
            {lead.senderName}
          </Text>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.channelText} numberOfLines={1}>
            {lead.channelName.split(' ')[0]}
          </Text>
          <Text style={styles.timeAgoText}>{timeAgo(lead.createdAt)}</Text>
        </View>

        {/* Primary Inquiry Text */}
        <Text style={styles.inquiryText} numberOfLines={2}>
          {lead.aiSummary || lead.rawText}
        </Text>

        {/* Bottom Supporting Info: Budget, Location, Status */}
        <View style={styles.footerRow}>
          {lead.budgetEstimate ? (
            <Text style={styles.budgetText}>{lead.budgetEstimate}</Text>
          ) : null}

          {lead.location ? (
            <>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.locationText}>{lead.location}</Text>
            </>
          ) : null}

          {lead.urgency === 'urgent' && !isQuoted && (
            <>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.urgentText}>Urgent</Text>
            </>
          )}

          {isQuoted && (
            <>
              <Text style={styles.bullet}>•</Text>
              <View style={styles.quotedInline}>
                <Check size={11} color={colors.emerald} style={{ marginRight: 2 }} />
                <Text style={styles.quotedText}>Quoted</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Right Navigation Indicator */}
      <View style={styles.chevronWrapper}>
        <ChevronRight size={16} color={colors.borderStrong} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentColumn: {
    flex: 1,
    paddingRight: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandNavyDark,
    letterSpacing: -0.1,
  },
  channelText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bullet: {
    fontSize: 10,
    color: colors.borderStrong,
    marginHorizontal: 5,
  },
  timeAgoText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  inquiryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 19,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.rose,
  },
  quotedInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.emerald,
  },
  chevronWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

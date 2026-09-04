import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { Lead } from '../../types/lead';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { ChevronRight, Check, Send, Archive, MessageSquare, Users, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

function isSpecificLocation(loc?: string): boolean {
  if (!loc) return false;
  const clean = loc.trim().toLowerCase();
  return !['regional', 'regional / on-site', 'regional/on-site', 'remote/unspecified', 'unspecified', 'n/a', 'none', ''].includes(clean);
}

interface LeadRowProps {
  lead: Lead;
  onPress: () => void;
  onArchive?: () => void;
}

// Generate consistent initials from sender name
function getInitials(name: string): string {
  if (!name) return '??';
  const clean = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Generate consistent background color from name hash
const AVATAR_COLORS = [
  colors.brandNavy,
  colors.accentBlue,
  colors.brandNavyLight,
  '#2C5282',
  '#2B6CB0',
  '#1A365D',
];

function getAvatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const LeadRow: React.FC<LeadRowProps> = ({ lead, onPress, onArchive }) => {
  const swipeableRef = React.useRef<Swipeable>(null);

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

  const handleSwipeQuote = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    swipeableRef.current?.close();
    onPress();
  };

  const handleSwipeArchive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    if (onArchive) onArchive();
  };

  // ─── Swipe Action: Slide Right to Quote ────────────────────────────────────
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-20, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.leftAction}
        activeOpacity={0.8}
        onPress={handleSwipeQuote}
      >
        <Animated.View style={[styles.actionContent, { transform: [{ translateX: trans }] }]}>
          <Send size={16} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.actionText}>Quote</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // ─── Swipe Action: Slide Left to Archive ───────────────────────────────────
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.rightAction}
        activeOpacity={0.8}
        onPress={handleSwipeArchive}
      >
        <Animated.View style={[styles.actionContent, { transform: [{ translateX: trans }] }]}>
          <Archive size={16} color={colors.surface} strokeWidth={2.5} />
          <Text style={styles.actionText}>Archive</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const isQuoted = lead.stage === 'quoted' || lead.stage === 'won';
  const initials = getInitials(lead.senderName);
  const avatarBg = getAvatarBg(lead.senderName);

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      onSwipeableWillOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.row}
      >
        {/* Left Column: Avatar with Initials / Expo-Image */}
        <View style={styles.avatarWrapper}>
          {lead.senderAvatarUrl ? (
            <Image
              source={{ uri: lead.senderAvatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: avatarBg }]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}
          {/* Subtle WhatsApp Indicator Badge */}
          <View style={styles.waBadge}>
            <MessageSquare size={8} color={colors.surface} strokeWidth={2.5} />
          </View>
        </View>

        {/* Center Column: Sender, Metadata & Inquiry */}
        <View style={styles.contentColumn}>
          {/* Top Row: Sender Name on left & Timestamp on right */}
          <View style={styles.metaRow}>
            <Text style={styles.senderName} numberOfLines={1}>
              {lead.senderName}
            </Text>
            <Text style={styles.timeAgoText}>{timeAgo(lead.createdAt)}</Text>
          </View>

          {/* Primary Inquiry Text */}
          <Text style={styles.inquiryText} numberOfLines={2}>
            {lead.aiSummary || lead.rawText}
          </Text>

          {/* Bottom Supporting Row: Distinct Channel Badge, Budget, Location, Status */}
          <View style={styles.footerRow}>
            {lead.channelName ? (
              <View style={styles.channelPill}>
                <Users size={10} color={colors.accentBlue} strokeWidth={2} />
                <Text style={styles.channelPillText} numberOfLines={1}>
                  {lead.channelName}
                </Text>
              </View>
            ) : null}

            {lead.budgetEstimate && lead.budgetEstimate !== 'Quote Required' ? (
              <Text style={styles.budgetText}>{lead.budgetEstimate}</Text>
            ) : null}

            {isSpecificLocation(lead.location) ? (
              <View style={styles.locationPill}>
                <MapPin size={10} color={colors.textSecondary} strokeWidth={2} />
                <Text style={styles.locationText} numberOfLines={1}>{lead.location}</Text>
              </View>
            ) : null}

            {lead.urgency === 'urgent' && !isQuoted && (
              <Text style={styles.urgentText}>Urgent</Text>
            )}

            {isQuoted && (
              <View style={styles.quotedInline}>
                <Check size={11} color={colors.emerald} style={{ marginRight: 2 }} />
                <Text style={styles.quotedText}>Quoted</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Navigation Indicator */}
        <View style={styles.chevronWrapper}>
          <ChevronRight size={15} color={colors.borderStrong} />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: fonts.geist.bold,
    fontSize: 13,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  waBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.emerald,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  senderName: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.brandNavyDark,
  },
  channelText: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  bullet: {
    fontSize: 10,
    color: colors.borderStrong,
    marginHorizontal: 4,
  },
  timeAgoText: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  inquiryText: {
    fontFamily: fonts.inter.medium,
    fontSize: 13.5,
    color: colors.textPrimary,
    lineHeight: 19,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    maxWidth: 160,
  },
  channelPillText: {
    fontFamily: fonts.inter.medium,
    fontSize: 10.5,
    color: colors.accentBlue,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  budgetText: {
    fontFamily: fonts.geist.bold,
    fontSize: 11.5,
    color: colors.emerald,
  },
  locationText: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  urgentText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 11,
    color: colors.rose,
  },
  quotedInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quotedText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 11,
    color: colors.emerald,
  },
  chevronWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Swipe Action Styles
  leftAction: {
    backgroundColor: colors.accentBlue, // Royal Blue for Quote
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  rightAction: {
    backgroundColor: colors.brandNavyLight, // Navy for Archive
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 11,
    color: colors.surface,
  },
});

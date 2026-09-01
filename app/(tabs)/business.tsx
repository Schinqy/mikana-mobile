import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import {
  Building2,
  Package,
  MessageCircle,
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Crown,
  User,
  LogOut,
} from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

function Row({
  icon: Icon,
  iconColor = colors.brandNavy,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
}: {
  icon: React.ComponentType<any>;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={styles.row}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '12' }]}>
        <Icon size={16} color={danger ? colors.rose : iconColor} strokeWidth={2} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.rose }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {showChevron && onPress ? (
        <ChevronRight size={15} color={colors.textMuted} strokeWidth={1.5} />
      ) : null}
    </TouchableOpacity>
  );
}

function SwitchRow({
  icon: Icon,
  iconColor = colors.brandNavy,
  label,
  sublabel,
  value,
  onValueChange,
}: {
  icon: React.ComponentType<any>;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '12' }]}>
        <Icon size={16} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.brandNavy }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function BusinessScreen() {
  const router = useRouter();
  const {
    isWhatsAppConnected,
    whatsappLinkedPhone,
    radarChannels,
  } = useSettingsStore();

  const [autopilotEnabled, setAutopilotEnabled] = React.useState(false);
  const [quietHours, setQuietHours] = React.useState(true);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Business"
        subtitle={isWhatsAppConnected ? `${radarChannels.length} channels monitored` : 'Setup & Integrations'}
        statusDot={isWhatsAppConnected ? 'active' : 'warning'}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

      {/* ── WhatsApp Connection ── */}
      <SectionHeader title="WhatsApp" />
      <View style={styles.section}>
        {isWhatsAppConnected ? (
          <>
            <Row
              icon={CheckCircle2}
              iconColor={colors.emerald}
              label={whatsappLinkedPhone || '+27 82 194 8831'}
              value="Connected"
              showChevron={false}
            />
            <Divider />
            <Row
              icon={MessageCircle}
              iconColor={colors.accentBlue}
              label="Monitored Groups"
              value={`${radarChannels.length} active`}
              onPress={() => {}}
            />
            <Divider />
            <Row
              icon={AlertCircle}
              iconColor={colors.rose}
              label="Disconnect / Re-link WhatsApp"
              value=""
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setWhatsAppConnected(false, '');
              }}
            />
          </>
        ) : (
          <TouchableOpacity style={styles.connectCard} activeOpacity={0.8} onPress={() => {}}>
            <View style={styles.connectCardInner}>
              <AlertCircle size={18} color={colors.amber} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.connectTitle}>WhatsApp not linked</Text>
                <Text style={styles.connectSub}>
                  Link your account to start intercepting buyer requests
                </Text>
              </View>
            </View>
            <View style={styles.connectBtn}>
              <Text style={styles.connectBtnLabel}>Link WhatsApp</Text>
              <ChevronRight size={14} color={colors.surface} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Offerings ── */}
      <SectionHeader title="Offerings" />
      <View style={styles.section}>
        <Row
          icon={Package}
          iconColor={colors.accentBlue}
          label="Products & Services"
          value="0 items"
          onPress={() => {}}
        />
        <Divider />
        <Row
          icon={Building2}
          iconColor={colors.brandNavy}
          label="Business Profile"
          value="Incomplete"
          onPress={() => {}}
        />
      </View>

      {/* ── 24/7 Autopilot ── */}
      <SectionHeader title="24/7 Lead Autopilot" />
      <View style={styles.section}>
        <SwitchRow
          icon={Zap}
          iconColor={colors.amber}
          label="Autopilot"
          sublabel="Auto-draft quotes while you're offline"
          value={autopilotEnabled}
          onValueChange={setAutopilotEnabled}
        />
        {autopilotEnabled && (
          <>
            <Divider />
            <SwitchRow
              icon={Zap}
              iconColor={colors.textMuted}
              label="Quiet Hours"
              sublabel="Pause between 10pm – 7am"
              value={quietHours}
              onValueChange={setQuietHours}
            />
          </>
        )}
      </View>

      {/* ── Subscription ── */}
      <SectionHeader title="Subscription" />
      <View style={styles.section}>
        <Row
          icon={Crown}
          iconColor={colors.amber}
          label="Mikana Pro"
          value="Free Plan"
          onPress={() => {}}
        />
      </View>

      {/* ── Account ── */}
      <SectionHeader title="Account" />
      <View style={styles.section}>
        <Row
          icon={User}
          iconColor={colors.textSecondary}
          label="Account Settings"
          onPress={() => {}}
        />
        <Divider />
        <Row
          icon={LogOut}
          iconColor={colors.rose}
          label="Sign Out"
          danger
          showChevron={false}
          onPress={() => {}}
        />
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: 40,
  },
  sectionHeader: {
    fontFamily: fonts.geist.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingBottom: 6,
    marginTop: 24,
  },
  section: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.geist.regular,
    fontSize: 15,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  rowSublabel: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0,
  },
  rowValue: {
    fontFamily: fonts.geist.medium,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: -0.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 58,
  },
  // WhatsApp connect card
  connectCard: {
    padding: 16,
    gap: 12,
  },
  connectCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  connectTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  connectSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandNavy,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 4,
  },
  connectBtnLabel: {
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.surface,
    letterSpacing: -0.2,
  },
});

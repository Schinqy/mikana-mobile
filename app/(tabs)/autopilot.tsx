import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAutopilotStore } from '../../src/store/useAutopilotStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import {
  Zap,
  Shield,
  Sliders,
  CheckCircle,
  AlertTriangle,
  History,
  Lock,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function AutopilotScreen() {
  const router = useRouter();
  const { config, logs, toggleAutopilot, updateConfig, clearLogs, resetDailyCount } = useAutopilotStore();
  const { status } = useSubscriptionStore();

  const handleToggle = (val: boolean) => {
    if (!status.isPro) {
      router.push('/modal/paywall');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleAutopilot(val);
  };

  const handleSetThreshold = (score: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateConfig({ minimumMatchScore: score });
  };

  const handleSetDailyCap = (cap: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateConfig({ dailyReplyLimit: cap });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>24/7 Lead Autopilot</Text>
            <Badge variant="blue">
              PRO FEATURE
            </Badge>
          </View>
          <Text style={styles.subtitle}>
            Autonomous WhatsApp DM proposal dispatcher for high-confidence leads
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Pro Lock Alert */}
        {!status.isPro && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/modal/paywall')}
            style={styles.proLockBanner}
          >
            <View style={styles.proLockLeft}>
              <Lock size={15} color={colors.amber} />
              <View>
                <Text style={styles.proLockTitle}>Autopilot is Locked on Free Plan</Text>
                <Text style={styles.proLockSub}>
                  Upgrade to Pro to activate 24/7 background pitch dispatching.
                </Text>
              </View>
            </View>
            <ChevronRight size={15} color={colors.amber} />
          </TouchableOpacity>
        )}

        {/* Master Control Card */}
        <Card style={styles.masterCard}>
          <View style={styles.masterHeader}>
            <View style={styles.masterLeft}>
              <View style={[styles.pulseIcon, config.isEnabled && status.isPro && styles.activePulse]}>
                <Zap size={18} color={config.isEnabled && status.isPro ? colors.emerald : colors.textMuted} />
              </View>
              <View>
                <Text style={styles.masterTitle}>
                  {config.isEnabled && status.isPro ? 'Autopilot Active' : 'Autopilot Inactive'}
                </Text>
                <Text style={styles.masterSub}>
                  {config.isEnabled && status.isPro
                    ? 'Monitoring & dispatching proposals'
                    : 'Turn on to auto-respond to high-match RFQs'}
                </Text>
              </View>
            </View>
            <Switch
              value={config.isEnabled && status.isPro}
              onValueChange={handleToggle}
              trackColor={{ false: colors.borderStrong, true: colors.emerald }}
              thumbColor="#FFFFFF"
            />
          </View>

          {config.isEnabled && status.isPro && (
            <View style={styles.activeMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{config.repliesSentToday} / {config.dailyReplyLimit}</Text>
                <Text style={styles.metricSub}>Dispatches Today</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{config.minimumMatchScore}%+</Text>
                <Text style={styles.metricSub}>Min Confidence</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Safety & Thresholds */}
        <View style={styles.sectionHeader}>
          <Sliders size={14} color={colors.brandNavy} />
          <Text style={styles.sectionTitle}>Safety & Confidence Thresholds</Text>
        </View>

        <Card style={styles.configCard}>
          <Text style={styles.configLabel}>MINIMUM AI MATCH CONFIDENCE</Text>
          <Text style={styles.configHint}>Only auto-dispatch proposals if lead matches your service catalog</Text>
          <View style={styles.thresholdRow}>
            {[80, 90, 95].map((score) => {
              const isSelected = config.minimumMatchScore === score;
              return (
                <TouchableOpacity
                  key={score}
                  activeOpacity={0.7}
                  onPress={() => handleSetThreshold(score)}
                  style={[styles.thresholdBtn, isSelected && styles.activeThresholdBtn]}
                >
                  <Text style={[styles.thresholdText, isSelected && styles.activeThresholdText]}>
                    {score}% Match
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={styles.configCard}>
          <Text style={styles.configLabel}>MAX DAILY PROPOSAL CAP</Text>
          <Text style={styles.configHint}>Safeguards your WhatsApp account by capping daily DMs</Text>
          <View style={styles.thresholdRow}>
            {[5, 15, 30].map((cap) => {
              const isSelected = config.dailyReplyLimit === cap;
              return (
                <TouchableOpacity
                  key={cap}
                  activeOpacity={0.7}
                  onPress={() => handleSetDailyCap(cap)}
                  style={[styles.thresholdBtn, isSelected && styles.activeThresholdBtn]}
                >
                  <Text style={[styles.thresholdText, isSelected && styles.activeThresholdText]}>
                    {cap} / day
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Recent Autonomous Logs */}
        <View style={styles.sectionHeader}>
          <History size={14} color={colors.brandNavy} />
          <Text style={styles.sectionTitle}>Recent Autopilot Logs</Text>
        </View>

        <Card style={styles.logCard}>
          {logs.length > 0 ? (
            logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.logSender}>{log.senderContact || log.channel}</Text>
                  <Badge variant="emerald">{log.matchScore}% Match</Badge>
                </View>
                <Text style={styles.logText} numberOfLines={2}>{log.dispatchedPitch || log.leadSummary}</Text>
                <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyLogs}>
              <Text style={styles.emptyLogsText}>No autopilot dispatches yet</Text>
            </View>
          )}
        </Card>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  proLockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  proLockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  proLockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandNavy,
  },
  proLockSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  masterCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 18,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pulseIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePulse: {
    backgroundColor: colors.emeraldBg,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  masterSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  activeMetrics: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    marginTop: 14,
    paddingTop: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  configCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  configLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  configHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  activeThresholdBtn: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  thresholdText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeThresholdText: {
    color: colors.textInverse,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  logItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logSender: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  logTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyLogs: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyLogsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

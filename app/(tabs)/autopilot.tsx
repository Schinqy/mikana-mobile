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
import {
  Zap,
  Shield,
  Sliders,
  CheckCircle,
  AlertTriangle,
  History,
  Lock,
  Radio,
  Clock,
  Sparkles,
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
            <Text style={styles.title}>24/7 Offline Autopilot</Text>
            <Badge variant="violet" icon={<Zap size={11} color="#a78bfa" />}>
              PRO ENGINE
            </Badge>
          </View>
          <Text style={styles.subtitle}>
            Autonomous WhatsApp DM pitch dispatcher for high-confidence leads
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Pro Lock Alert if free tier */}
        {!status.isPro && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/modal/paywall')}
            style={styles.proLockBanner}
          >
            <View style={styles.proLockLeft}>
              <Lock size={16} color="#f59e0b" />
              <View>
                <Text style={styles.proLockTitle}>Autopilot is Locked on Free Plan</Text>
                <Text style={styles.proLockSub}>
                  Upgrade to Pro Trader to activate 24/7 background pitch dispatching.
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#f59e0b" />
          </TouchableOpacity>
        )}

        {/* Master Control Card */}
        <Card elevated style={styles.masterCard}>
          <View style={styles.masterHeader}>
            <View style={styles.masterLeft}>
              <View style={[styles.pulseIcon, config.isEnabled && status.isPro && styles.activePulse]}>
                <Zap size={20} color={config.isEnabled && status.isPro ? '#10b981' : '#71717a'} />
              </View>
              <View>
                <Text style={styles.masterTitle}>Autopilot Engine</Text>
                <Text style={styles.masterStatus}>
                  {config.isEnabled && status.isPro
                    ? 'Active — Running 24/7 in Background'
                    : 'Inactive — Paused'}
                </Text>
              </View>
            </View>

            <Switch
              value={config.isEnabled && status.isPro}
              onValueChange={handleToggle}
              trackColor={{ false: '#27272a', true: '#10b981' }}
              thumbColor="#f4f4f5"
            />
          </View>

          {/* Daily Cap Counter */}
          <View style={styles.capStatsRow}>
            <View style={styles.capStatsItem}>
              <Text style={styles.capLabel}>Dispatched Today</Text>
              <Text style={styles.capValue}>
                {config.repliesSentToday}{' '}
                <Text style={styles.capLimit}>/ {config.dailyReplyLimit} max</Text>
              </Text>
            </View>
            <Button
              size="sm"
              variant="outline"
              onPress={resetDailyCount}
              style={styles.resetBtn}
            >
              Reset Counter
            </Button>
          </View>
        </Card>

        {/* Safety & Threshold Controls */}
        <Text style={styles.sectionHeader}>Safety Guardrails & Rules</Text>

        <Card style={styles.settingsCard}>
          {/* Minimum Confidence Score Selector */}
          <View style={styles.settingItem}>
            <View style={styles.settingMeta}>
              <Shield size={16} color="#3b82f6" />
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Minimum Match Score</Text>
                <Text style={styles.settingHint}>
                  Only auto-reply when lead relevance exceeds this threshold.
                </Text>
              </View>
            </View>

            <View style={styles.selectorRow}>
              {[80, 85, 90, 95].map((score) => (
                <TouchableOpacity
                  key={score}
                  activeOpacity={0.7}
                  onPress={() => handleSetThreshold(score)}
                  style={[
                    styles.selectorPill,
                    config.minimumMatchScore === score && styles.selectedSelectorPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      config.minimumMatchScore === score && styles.selectedSelectorText,
                    ]}
                  >
                    {score}%+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Daily Reply Limit Selector */}
          <View style={[styles.settingItem, styles.borderTop]}>
            <View style={styles.settingMeta}>
              <Sliders size={16} color="#a78bfa" />
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Daily Dispatch Cap</Text>
                <Text style={styles.settingHint}>
                  Prevents spam and stays within WhatsApp anti-ban safety limits.
                </Text>
              </View>
            </View>

            <View style={styles.selectorRow}>
              {[10, 15, 25, 50].map((cap) => (
                <TouchableOpacity
                  key={cap}
                  activeOpacity={0.7}
                  onPress={() => handleSetDailyCap(cap)}
                  style={[
                    styles.selectorPill,
                    config.dailyReplyLimit === cap && styles.selectedSelectorPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      config.dailyReplyLimit === cap && styles.selectedSelectorText,
                    ]}
                  >
                    {cap} / day
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Audit Log Feed */}
        <View style={styles.logHeaderRow}>
          <View style={styles.logHeaderLeft}>
            <History size={15} color="#f4f4f5" />
            <Text style={styles.sectionHeaderNoMargin}>Autopilot Dispatch Activity</Text>
          </View>
          {logs.length > 0 && (
            <TouchableOpacity activeOpacity={0.7} onPress={clearLogs}>
              <Text style={styles.clearLogsText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyLogs}>
            <Text style={styles.emptyLogsText}>No automated replies logged yet.</Text>
          </View>
        ) : (
          logs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logTopRow}>
                <Badge
                  variant={log.status === 'dispatched' ? 'emerald' : 'amber'}
                  showDot
                >
                  {log.status === 'dispatched' ? 'Auto-Dispatched' : 'Skipped (Low Score)'}
                </Badge>
                <Text style={styles.logTime}>
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <Text style={styles.logSummary} numberOfLines={2}>
                {log.leadSummary}
              </Text>

              <View style={styles.logMetaRow}>
                <Text style={styles.logContact} numberOfLines={1}>
                  To: {log.senderContact} ({log.channel})
                </Text>
                <Text style={styles.logScore}>{log.matchScore}% match</Text>
              </View>

              {log.dispatchedPitch ? (
                <View style={styles.pitchPreviewBox}>
                  <Text style={styles.pitchPreviewText} numberOfLines={2}>
                    "{log.dispatchedPitch}"
                  </Text>
                </View>
              ) : null}
            </Card>
          ))
        )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  proLockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
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
    color: '#f59e0b',
  },
  proLockSub: {
    fontSize: 11,
    color: '#d4d4d8',
    marginTop: 2,
  },
  masterCard: {
    marginBottom: 20,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  masterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pulseIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePulse: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  masterStatus: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  capStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  capStatsItem: {
    flex: 1,
  },
  capLabel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  capValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 2,
  },
  capLimit: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
  },
  resetBtn: {
    height: 30,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  sectionHeaderNoMargin: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: -0.2,
  },
  settingsCard: {
    marginBottom: 24,
    padding: 14,
  },
  settingItem: {
    paddingVertical: 6,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 14,
    marginTop: 10,
  },
  settingMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  settingTextCol: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  settingHint: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    lineHeight: 15,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 26,
  },
  selectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  selectedSelectorPill: {
    backgroundColor: '#f4f4f5',
    borderColor: '#f4f4f5',
  },
  selectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  selectedSelectorText: {
    color: '#09090b',
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearLogsText: {
    fontSize: 12,
    color: '#71717a',
  },
  logCard: {
    marginBottom: 10,
    padding: 12,
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logTime: {
    fontSize: 11,
    color: '#71717a',
  },
  logSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
    lineHeight: 18,
    marginBottom: 6,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logContact: {
    fontSize: 11,
    color: '#a1a1aa',
    flex: 1,
  },
  logScore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  pitchPreviewBox: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#18181b',
  },
  pitchPreviewText: {
    fontSize: 11,
    color: '#71717a',
    fontStyle: 'italic',
  },
  emptyLogs: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#18181b',
    borderStyle: 'dashed',
  },
  emptyLogsText: {
    fontSize: 12,
    color: '#52525b',
  },
});

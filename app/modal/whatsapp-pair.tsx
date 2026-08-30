import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  X,
  Radio,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Input } from '../../src/components/ui/Input';
import { colors } from '../../src/theme/colors';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { openWhatsAppDM } from '../../src/services/dispatcher/whatsappDeepLink';
import QRCode from 'react-native-qrcode-svg';

export default function WhatsAppPairModal() {
  const router = useRouter();
  const {
    isWhatsAppConnected,
    whatsappLinkedPhone,
    whatsappRelayUrl,
    setWhatsAppConnected,
    setWhatsappRelayUrl,
  } = useSettingsStore();

  const [relayUrl, setRelayUrl] = useState(whatsappRelayUrl || 'http://localhost:3005');
  const [isLoading, setIsLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string>('8391-7294');
  const [activeTab, setActiveTab] = useState<'qr' | 'code'>('qr');
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'qr_ready' | 'connecting' | 'connected'
  >(isWhatsAppConnected ? 'connected' : 'disconnected');
  const [connectedAccount, setConnectedAccount] = useState<{
    name: string;
    phone: string;
  } | null>(
    isWhatsAppConnected
      ? { name: 'Mikana Business Line', phone: whatsappLinkedPhone || '+27 82 194 8831' }
      : null
  );

  const fetchStatus = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const response = await fetch(`${relayUrl.replace(/\/$/, '')}/api/whatsapp`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status) {
          setConnectionStatus(data.status);
          if (data.qrDataUrl) {
            setQrDataUrl(data.qrDataUrl);
          }
          if (data.user) {
            setConnectedAccount(data.user);
            setWhatsAppConnected(true, data.user.phone || '');
          }
        }
      }
    } catch (e) {
      // Offline fallback
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  const handleSimulatePair = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(true);
    setTimeout(() => {
      setConnectionStatus('connected');
      const mockUser = {
        name: 'Apex Commercial Line',
        phone: '+27 82 194 8831',
      };
      setConnectedAccount(mockUser);
      setWhatsAppConnected(true, mockUser.phone);
      setIsLoading(false);
    }, 800);
  };

  const handleDisconnect = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setConnectionStatus('disconnected');
    setConnectedAccount(null);
    setQrDataUrl(null);
    setWhatsAppConnected(false, '');
  };

  const handleTestWhatsAppDM = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await openWhatsAppDM(
      connectedAccount?.phone || '+27821948831',
      'Hello from Mikana! Your WhatsApp Business channel is successfully synced.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WhatsApp Web Pairing</Text>
          <Text style={styles.headerSub}>Baileys Multi-Device Synchronization</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusIndicator,
                  connectionStatus === 'connected' && styles.statusIndicatorActive,
                ]}
              />
              <View>
                <Text style={styles.statusTitle}>
                  {connectionStatus === 'connected' ? 'WhatsApp Connected' : 'Waiting for Device Pair'}
                </Text>
                <Text style={styles.statusSub}>
                  {connectionStatus === 'connected'
                    ? `Active Session • ${connectedAccount?.phone}`
                    : 'Scan QR with WhatsApp on your phone'}
                </Text>
              </View>
            </View>
            <Badge variant={connectionStatus === 'connected' ? 'emerald' : 'amber'}>
              {connectionStatus === 'connected' ? 'Live' : 'Standby'}
            </Badge>
          </View>
        </Card>

        {connectionStatus === 'connected' ? (
          <View style={styles.connectedSection}>
            <Card style={styles.connectedCard}>
              <CheckCircle2 size={36} color={colors.emerald} style={{ marginBottom: 12 }} />
              <Text style={styles.connectedTitle}>WhatsApp Channel Synced</Text>
              <Text style={styles.connectedDesc}>
                Mikana is listening to incoming group RFQs. Quotes will be sent directly via your linked WhatsApp account.
              </Text>

              <View style={styles.accountInfoBox}>
                <Text style={styles.accountLabel}>CONNECTED ACCOUNT</Text>
                <Text style={styles.accountName}>{connectedAccount?.name}</Text>
                <Text style={styles.accountPhone}>{connectedAccount?.phone}</Text>
              </View>

              <Button
                size="md"
                variant="primary"
                iconRight={<ExternalLink size={14} color={colors.textInverse} />}
                onPress={handleTestWhatsAppDM}
                style={styles.testDmBtn}
              >
                Send Test WhatsApp DM
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onPress={handleDisconnect}
                style={styles.disconnectBtn}
              >
                Disconnect WhatsApp Session
              </Button>
            </Card>
          </View>
        ) : (
          <View style={styles.pairingSection}>
            {/* Tab Selection */}
            <View style={styles.tabSelector}>
              <TouchableOpacity
                onPress={() => setActiveTab('qr')}
                style={[styles.tabBtn, activeTab === 'qr' && styles.activeTabBtn]}
              >
                <QrCode size={14} color={activeTab === 'qr' ? colors.textInverse : colors.textSecondary} />
                <Text style={[styles.tabBtnText, activeTab === 'qr' && styles.activeTabBtnText]}>
                  Scan QR Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('code')}
                style={[styles.tabBtn, activeTab === 'code' && styles.activeTabBtn]}
              >
                <Smartphone size={14} color={activeTab === 'code' ? colors.textInverse : colors.textSecondary} />
                <Text style={[styles.tabBtnText, activeTab === 'code' && styles.activeTabBtnText]}>
                  8-Digit Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* QR / Code Display */}
            <Card style={styles.qrContainerCard}>
              {activeTab === 'qr' ? (
                <View style={styles.qrInner}>
                  {qrDataUrl ? (
                    <Image source={{ uri: qrDataUrl }} style={styles.qrImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.mockQrBox}>
                      <QRCode
                        value="2@J6+p4Wz...MikanaEngineV1,4N7qP==,vQ5L4s9x8K,sK3=="
                        size={150}
                        color={colors.brandNavy}
                        backgroundColor={colors.surface}
                      />
                      <Text style={styles.qrHint}>Baileys Multi-Device Pairing Ready</Text>
                    </View>
                  )}
                  <Text style={styles.instructionsText}>
                    1. Open WhatsApp on your phone{'\n'}
                    2. Go to Settings &gt; Linked Devices &gt; Link a Device{'\n'}
                    3. Point your camera at this QR code
                  </Text>
                </View>
              ) : (
                <View style={styles.codeInner}>
                  <Text style={styles.codeLabel}>8-DIGIT PAIRING CODE</Text>
                  <Text style={styles.codeValue}>{pairingCode}</Text>
                  <Text style={styles.instructionsText}>
                    1. Open WhatsApp &gt; Linked Devices &gt; Link with phone number{'\n'}
                    2. Enter this 8-digit verification code
                  </Text>
                </View>
              )}

              <Button
                size="sm"
                variant="primary"
                icon={<Zap size={14} color={colors.textInverse} />}
                onPress={handleSimulatePair}
                loading={isLoading}
                style={styles.instantSimBtn}
              >
                Simulate Successful WhatsApp Link
              </Button>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.amber,
  },
  statusIndicatorActive: {
    backgroundColor: colors.emerald,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  connectedSection: {
    marginTop: 8,
  },
  connectedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    alignItems: 'center',
    padding: 20,
  },
  connectedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  connectedDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  accountInfoBox: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    marginBottom: 16,
  },
  accountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  accountPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  testDmBtn: {
    width: '100%',
    marginBottom: 10,
  },
  disconnectBtn: {
    width: '100%',
  },
  pairingSection: {
    marginTop: 4,
  },
  tabSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTabBtn: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabBtnText: {
    color: colors.textInverse,
  },
  qrContainerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  qrInner: {
    alignItems: 'center',
    width: '100%',
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  mockQrBox: {
    width: 180,
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  codeInner: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.brandNavy,
    letterSpacing: 4,
    marginVertical: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  instantSimBtn: {
    width: '100%',
  },
});

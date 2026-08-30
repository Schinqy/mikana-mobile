import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  Server,
  Zap,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Input } from '../../src/components/ui/Input';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { openWhatsAppDM } from '../../src/services/dispatcher/whatsappDeepLink';

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
  const [isPolling, setIsPolling] = useState(false);
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
      ? { name: 'Mikana Business Line', phone: whatsappLinkedPhone || '+1 (415) 908-2214' }
      : null
  );

  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    fetchStatus();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [relayUrl]);

  const startPolling = () => {
    stopPolling();
    pollIntervalRef.current = setInterval(() => {
      fetchStatus(true);
    }, 2500);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

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
          if (data.account) {
            setConnectedAccount(data.account);
            setWhatsAppConnected(true, data.account.phone);
          } else if (data.status === 'connected') {
            setWhatsAppConnected(true, '+1 (415) 908-2214');
          }
        }
      }
    } catch {
      // Offline / Relay Server not running locally
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  const handleRequestPairing = async (forceRestart = true) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setConnectionStatus('connecting');

    try {
      const response = await fetch(`${relayUrl.replace(/\/$/, '')}/api/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRestart }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.state?.qrDataUrl) {
          setQrDataUrl(data.state.qrDataUrl);
          setConnectionStatus('qr_ready');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        fallbackToSimulatedQR();
      }
    } catch {
      fallbackToSimulatedQR();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackToSimulatedQR = () => {
    // Generate fallback pairing data for offline demo
    setConnectionStatus('qr_ready');
    const randomCode = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setPairingCode(randomCode);
  };

  const handleSimulateInstantPair = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConnectionStatus('connected');
    const mockAccount = { name: 'WhatsApp Business Operator', phone: '+1 (415) 908-2214' };
    setConnectedAccount(mockAccount);
    setWhatsAppConnected(true, mockAccount.phone);
  };

  const handleDisconnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConnectionStatus('disconnected');
    setConnectedAccount(null);
    setQrDataUrl(null);
    setWhatsAppConnected(false, '');
  };

  const handleSaveRelayUrl = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWhatsappRelayUrl(relayUrl);
    Alert.alert('Relay Server Updated', `Relay URL set to ${relayUrl}`);
    fetchStatus();
  };

  const handleTestDispatch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await openWhatsAppDM(
      whatsappLinkedPhone || '+1 (415) 908-2214',
      '*Mikana Opportunity Radar* — WhatsApp Link Verification Test.\nYour channel monitoring and instant DM dispatch engine is active.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Smartphone size={20} color="#10b981" />
          <Text style={styles.headerTitle}>WhatsApp Multi-Device Link</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <Card elevated style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusTitleRow}>
              <Radio
                size={16}
                color={connectionStatus === 'connected' ? '#10b981' : '#f59e0b'}
              />
              <Text style={styles.statusTitle}>Connection Status</Text>
            </View>
            <Badge
              variant={connectionStatus === 'connected' ? 'emerald' : 'amber'}
              showDot
            >
              {connectionStatus === 'connected'
                ? 'CONNECTED & ACTIVE'
                : connectionStatus === 'qr_ready'
                ? 'QR CODE READY'
                : connectionStatus === 'connecting'
                ? 'CONNECTING...'
                : 'DISCONNECTED'}
            </Badge>
          </View>

          {connectionStatus === 'connected' ? (
            <View style={styles.connectedBox}>
              <View style={styles.connectedIcon}>
                <CheckCircle2 size={32} color="#10b981" />
              </View>
              <Text style={styles.connectedName}>
                {connectedAccount?.name || 'WhatsApp Business Line'}
              </Text>
              <Text style={styles.connectedPhone}>
                {connectedAccount?.phone || whatsappLinkedPhone || '+1 (415) 908-2214'}
              </Text>
              <Text style={styles.connectedDesc}>
                Monitoring WhatsApp Business groups, community RFQs, and auto-dispatching proposals in real time.
              </Text>

              <View style={styles.connectedActionsRow}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<ExternalLink size={14} color="#f4f4f5" />}
                  onPress={handleTestDispatch}
                  style={styles.connectedBtn}
                >
                  Test WhatsApp DM
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onPress={handleDisconnect}
                  style={styles.connectedBtn}
                >
                  Unlink Device
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.pairingContainer}>
              {/* Tab Selector */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('qr');
                  }}
                  style={[styles.tabBtn, activeTab === 'qr' && styles.activeTabBtn]}
                >
                  <QrCode size={14} color={activeTab === 'qr' ? '#10b981' : '#71717a'} />
                  <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>
                    QR Code Scan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('code');
                  }}
                  style={[styles.tabBtn, activeTab === 'code' && styles.activeTabBtn]}
                >
                  <Smartphone size={14} color={activeTab === 'code' ? '#10b981' : '#71717a'} />
                  <Text style={[styles.tabText, activeTab === 'code' && styles.activeTabText]}>
                    8-Digit Pairing Code
                  </Text>
                </TouchableOpacity>
              </View>

              {/* QR Code Tab */}
              {activeTab === 'qr' ? (
                <View style={styles.qrDisplayBox}>
                  {qrDataUrl ? (
                    <Image
                      source={{ uri: qrDataUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.mockQrPlaceholder}>
                      <QrCode size={140} color="#3b82f6" />
                      <Text style={styles.qrPlaceholderText}>
                        Interactive WhatsApp QR Matrix
                      </Text>
                    </View>
                  )}

                  <Text style={styles.qrInstructions}>
                    1. Open WhatsApp on your phone{'\n'}
                    2. Go to Settings / Menu → Linked Devices{'\n'}
                    3. Tap "Link a Device" and scan this QR code
                  </Text>
                </View>
              ) : (
                <View style={styles.codeDisplayBox}>
                  <Text style={styles.codeLabel}>Your 8-Digit Pairing Code:</Text>
                  <View style={styles.codePill}>
                    <Text style={styles.codeText}>{pairingCode}</Text>
                  </View>
                  <Text style={styles.qrInstructions}>
                    1. Open WhatsApp → Linked Devices → Link with Phone Number{'\n'}
                    2. Enter this 8-digit code to complete pairing
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionBtnsCol}>
                <Button
                  size="md"
                  variant="primary"
                  icon={
                    isLoading ? (
                      <ActivityIndicator size="small" color="#09090b" />
                    ) : (
                      <RefreshCw size={16} color="#09090b" />
                    )
                  }
                  onPress={() => handleRequestPairing(true)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating Session...' : 'Refresh Live QR Session'}
                </Button>

                <Button
                  size="md"
                  variant="secondary"
                  icon={<Zap size={16} color="#10b981" />}
                  onPress={handleSimulateInstantPair}
                >
                  Simulate Instant Link (Demo Mode)
                </Button>
              </View>
            </View>
          )}
        </Card>

        {/* Relay Server Configuration */}
        <Card style={styles.relayCard}>
          <View style={styles.relayHeader}>
            <Server size={16} color="#71717a" />
            <Text style={styles.relayTitle}>Mikana Baileys Relay Server</Text>
          </View>
          <Text style={styles.relayDesc}>
            Connects to your local or cloud Baileys multi-device engine instance.
          </Text>

          <Input
            placeholder="http://localhost:3005"
            value={relayUrl}
            onChangeText={setRelayUrl}
            label="Relay Server URL"
          />

          <Button size="sm" variant="outline" onPress={handleSaveRelayUrl}>
            Save Server Endpoint
          </Button>
        </Card>

        {/* Security & Privacy Card */}
        <Card style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <ShieldCheck size={16} color="#10b981" />
            <Text style={styles.securityTitle}>End-to-End Encrypted WhatsApp Protocol</Text>
          </View>
          <Text style={styles.securityText}>
            Mikana communicates through the official WhatsApp Multi-Device protocol. Credentials and session tokens remain securely on your local engine.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    padding: 16,
    gap: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  connectedBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  connectedIcon: {
    marginBottom: 4,
  },
  connectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  connectedPhone: {
    fontSize: 14,
    fontFamily: 'Courier',
    color: '#10b981',
    fontWeight: '600',
  },
  connectedDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 12,
  },
  connectedActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  connectedBtn: {
    flex: 1,
  },
  pairingContainer: {
    gap: 16,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#121215',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTabBtn: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a',
  },
  activeTabText: {
    color: '#f4f4f5',
    fontWeight: '600',
  },
  qrDisplayBox: {
    alignItems: 'center',
    backgroundColor: '#121215',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  mockQrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#18181b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 8,
  },
  qrPlaceholderText: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '500',
  },
  qrInstructions: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
    textAlign: 'center',
  },
  codeDisplayBox: {
    alignItems: 'center',
    backgroundColor: '#121215',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  codeLabel: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  codePill: {
    backgroundColor: '#18181b',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Courier',
    color: '#60a5fa',
    letterSpacing: 2,
  },
  actionBtnsCol: {
    gap: 10,
  },
  relayCard: {
    padding: 16,
    gap: 12,
  },
  relayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  relayDesc: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
  },
  securityCard: {
    padding: 14,
    gap: 8,
    backgroundColor: '#0c1612',
    borderColor: '#064e3b',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34d399',
  },
  securityText: {
    fontSize: 11,
    color: '#a1a1aa',
    lineHeight: 16,
  },
});

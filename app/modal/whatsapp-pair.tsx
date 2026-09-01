import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  X,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react-native';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { openWhatsAppDM } from '../../src/services/dispatcher/whatsappDeepLink';
import {
  relayClient,
  createSession,
  requestPairingCode,
  resolveRelayUrl,
} from '../../src/services/relay/whatsappRelay';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Country, detectUserCountry } from '../../src/utils/countryCodes';
import { CountryCodePickerModal } from '../../src/components/ui/CountryCodePickerModal';

export default function WhatsAppPairModal() {
  const router = useRouter();
  const {
    isWhatsAppConnected,
    whatsappLinkedPhone,
    whatsappRelayUrl,
    setWhatsAppConnected,
  } = useSettingsStore();

  const relayUrl = resolveRelayUrl(whatsappRelayUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [liveQR, setLiveQR] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => detectUserCountry());
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCodeLoading, setPairingCodeLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'qr'>('code');
  const [sessionId, setSessionId] = useState<string>('session_user_default');
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'qr_ready' | 'connecting' | 'connected'
  >(isWhatsAppConnected ? 'connected' : 'disconnected');
  const [connectedAccount, setConnectedAccount] = useState<{
    phone: string;
  } | null>(
    isWhatsAppConnected && whatsappLinkedPhone
      ? { phone: whatsappLinkedPhone }
      : null
  );

  useEffect(() => {
    if (!isWhatsAppConnected) {
      connectToLiveRelay();
    }
  }, [isWhatsAppConnected]);

  const connectToLiveRelay = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    setPairingError(null);
    try {
      const session = await createSession(relayUrl, 'user_default');
      setSessionId(session.sessionId);

      relayClient.connect(relayUrl, session.sessionId, {
        onQR: (qr) => {
          setLiveQR(qr);
          setConnectionStatus('qr_ready');
          setIsLoading(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onConnected: (phone) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setConnectionStatus('connected');
          const cleanPhone = phone || 'Connected Line';
          setConnectedAccount({ phone: cleanPhone });
          setWhatsAppConnected(true, cleanPhone);
          setIsLoading(false);
        },
        onDisconnected: () => {
          setConnectionStatus('disconnected');
          setConnectedAccount(null);
        },
        onError: () => {
          setConnectionStatus('disconnected');
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
      setConnectionStatus('disconnected');
    }
  };

  const handleRequestPairingCode = async () => {
    if (!phoneInput.trim()) {
      setPairingError('Please enter your WhatsApp phone number');
      return;
    }

    const cleanLocal = phoneInput.replace(/\D/g, '').replace(/^0+/, '');
    const cleanCountryCode = selectedCountry.dialCode.replace(/\D/g, '');
    const fullNumber = `+${cleanCountryCode}${cleanLocal}`;

    setPairingCodeLoading(true);
    setPairingError(null);
    setCopiedCode(false);

    try {
      const res = await requestPairingCode(relayUrl, sessionId, fullNumber);
      if (res.code) {
        setPairingCode(res.code);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setPairingError(err.message || 'Failed to request code. Check phone number and retry.');
    } finally {
      setPairingCodeLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!pairingCode) return;
    await Clipboard.setStringAsync(pairingCode);
    setCopiedCode(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDisconnect = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setConnectionStatus('disconnected');
    setConnectedAccount(null);
    setLiveQR(null);
    setPairingCode(null);
    setWhatsAppConnected(false, '');
    connectToLiveRelay();
  };

  const handleTestWhatsAppDM = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (connectedAccount?.phone) {
      await openWhatsAppDM(
        connectedAccount.phone,
        'Hello from Mikana! Your WhatsApp Business channel is successfully synced.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WhatsApp Pairing</Text>
          <Text style={styles.headerSub}>Live Baileys Multi-Device</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={colors.brandNavy} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={50}
      >
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
                    ? `Active Session • ${connectedAccount?.phone || 'Connected'}`
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
                <Text style={styles.accountLabel}>LINKED PHONE NUMBER</Text>
                <Text style={styles.accountPhone}>{connectedAccount?.phone || 'Connected Line'}</Text>
              </View>

              <Button
                size="md"
                variant="primary"
                iconRight={<ExternalLink size={14} color={colors.textInverse} />}
                onPress={handleTestWhatsAppDM}
                style={styles.testDmBtn}
              >
                Send Test WhatsApp Message
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onPress={handleDisconnect}
                style={styles.disconnectBtn}
              >
                Disconnect & Scan New QR
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
                  Phone Number Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* QR / Code Display */}
            <Card style={styles.qrContainerCard}>
              {activeTab === 'qr' ? (
                <View style={styles.qrInner}>
                  <View style={styles.qrBox}>
                    {liveQR ? (
                      <QRCode
                        value={liveQR}
                        size={170}
                        color={colors.brandNavy}
                        backgroundColor={colors.surface}
                      />
                    ) : (
                      <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={colors.accentBlue} />
                        <Text style={styles.loadingText}>Generating live WhatsApp QR from server...</Text>
                        <TouchableOpacity
                          onPress={connectToLiveRelay}
                          style={styles.retryBtn}
                        >
                          <RefreshCw size={12} color={colors.accentBlue} />
                          <Text style={styles.retryText}>Retry Connection</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text style={styles.instructionsText}>
                    1. Open WhatsApp on your phone{'\n'}
                    2. Go to Settings &gt; Linked Devices &gt; Link a Device{'\n'}
                    3. Point your camera at this QR code
                  </Text>
                </View>
              ) : (
                <View style={styles.codeInner}>
                  <Text style={styles.codeInstructions}>
                    Enter your phone number with country code to generate a real 8-digit WhatsApp pairing code.
                  </Text>

                  <View style={styles.phoneInputRow}>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="+1 234 567 8900"
                      placeholderTextColor={colors.textMuted}
                      value={phoneInput}
                      onChangeText={setPhoneInput}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.getCodeBtn}
                      onPress={handleRequestPairingCode}
                      disabled={pairingCodeLoading}
                    >
                      {pairingCodeLoading ? (
                        <ActivityIndicator size="small" color={colors.surface} />
                      ) : (
                        <ArrowRight size={16} color={colors.surface} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {pairingError ? (
                    <Text style={styles.errorText}>{pairingError}</Text>
                  ) : null}

                  {pairingCode ? (
                    <View style={styles.codeDisplayCard}>
                      <Text style={styles.codeLabel}>YOUR 8-DIGIT PAIRING CODE</Text>
                      <Text style={styles.codeValue}>{pairingCode}</Text>
                      <Text style={styles.codeHint}>
                        Open WhatsApp &gt; Linked Devices &gt; Link with phone number &gt; Enter this code.
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </Card>
          </View>
        )}
      </KeyboardAwareScrollView>
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
    fontFamily: fonts.geist.bold,
    fontSize: 18,
    color: colors.brandNavy,
  },
  headerSub: {
    fontFamily: fonts.inter.regular,
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
    fontFamily: fonts.geist.semibold,
    fontSize: 14,
    color: colors.brandNavy,
  },
  statusSub: {
    fontFamily: fonts.inter.regular,
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
    fontFamily: fonts.geist.bold,
    fontSize: 17,
    color: colors.brandNavy,
    marginBottom: 6,
  },
  connectedDesc: {
    fontFamily: fonts.inter.regular,
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
    backgroundColor: colors.canvas,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountLabel: {
    fontFamily: fonts.geist.medium,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  accountPhone: {
    fontFamily: fonts.geist.semibold,
    fontSize: 16,
    color: colors.brandNavy,
    marginTop: 4,
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
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  tabBtnText: {
    fontFamily: fonts.geist.medium,
    fontSize: 12,
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
  qrBox: {
    width: 190,
    height: 190,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 10,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  loadingText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryText: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
    color: colors.accentBlue,
  },
  instructionsText: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  codeInner: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    gap: 12,
  },
  codeInstructions: {
    fontFamily: fonts.inter.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  phoneInputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  getCodeBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.rose,
    textAlign: 'center',
  },
  codeDisplayCard: {
    width: '100%',
    padding: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  codeLabel: {
    fontFamily: fonts.geist.medium,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  codeValue: {
    fontFamily: fonts.geist.bold,
    fontSize: 26,
    color: colors.brandNavy,
    letterSpacing: 4,
  },
  codeHint: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

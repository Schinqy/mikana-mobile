import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  QrCode,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Monitor,
  Share2,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../src/theme/colors';
import {
  relayClient,
  createSession,
  requestPairingCode,
  resolveRelayUrl,
  pushCapabilityProfile,
} from '../../src/services/relay/whatsappRelay';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { Country, detectUserCountry } from '../../src/utils/countryCodes';
import { CountryCodePickerModal } from '../../src/components/ui/CountryCodePickerModal';

type PairMode = 'qr' | 'code';

export default function PairScreen() {
  const router = useRouter();
  const { capabilityProfile, setOnboardingStage } = useAuthStore();
  const { whatsappRelayUrl, setWhatsAppConnected } = useSettingsStore();

  // QR is PRIMARY as agreed
  const [pairMode, setPairMode] = useState<PairMode>('qr');
  const [liveQR, setLiveQR] = useState<string | null>(null);
  const [relayStatus, setRelayStatus] = useState<'idle' | 'connecting' | 'qr_ready' | 'connected' | 'error'>('idle');

  // Phone code states
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => detectUserCountry());
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingCodeLoading, setPairingCodeLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeSecondsLeft, setCodeSecondsLeft] = useState<number>(0);

  const sessionIdRef = useRef<string | null>(null);
  const codeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Connection Success Handler ────────────────────────────────────────────

  const handleConnected = useCallback(
    async (phone: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWhatsAppConnected(true, phone || '');
      setOnboardingStage('paired');

      // Push initial capability profile & filter dictionary to the relay server
      if (capabilityProfile) {
        const sid = sessionIdRef.current || 'session_user_default';
        const url = resolveRelayUrl(whatsappRelayUrl);
        pushCapabilityProfile(url, sid, capabilityProfile);
      }

      router.push('/onboarding/groups');
    },
    [capabilityProfile, whatsappRelayUrl, setWhatsAppConnected, setOnboardingStage, router]
  );

  // ── Baileys Relay Socket Handshake (Matches Home Screen) ───────────────────

  const connectToRelay = useCallback(async () => {
    const targetUrl = resolveRelayUrl(whatsappRelayUrl);
    setRelayStatus('connecting');
    setPairingError(null);

    try {
      const { sessionId } = await createSession(targetUrl, 'user_default');
      sessionIdRef.current = sessionId;

      relayClient.connect(targetUrl, sessionId, {
        onQR: (qr) => {
          setLiveQR(qr);
          setRelayStatus('qr_ready');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onConnected: (phone) => {
          setRelayStatus('connected');
          handleConnected(phone || '');
        },
        onDisconnected: () => {
          setRelayStatus('idle');
        },
        onNewLead: () => {},
        onError: (msg) => {
          setPairingError(msg || 'Relay server error');
          setRelayStatus('error');
        },
      });
    } catch (e: any) {
      setPairingError(e.message || 'Could not connect to relay server');
      setRelayStatus('error');
    }
  }, [whatsappRelayUrl, handleConnected]);

  // Connect on mount for QR streaming
  useEffect(() => {
    connectToRelay();
  }, [connectToRelay]);

  // ── Countdown Timer for Pairing Code ──────────────────────────────────────

  useEffect(() => {
    if (pairingCode) {
      setCodeSecondsLeft(60);
      codeTimerRef.current = setInterval(() => {
        setCodeSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(codeTimerRef.current!);
            setPairingCode(null);
            setPairingError('Code expired. Generate a new code and enter it immediately in WhatsApp.');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (codeTimerRef.current) clearInterval(codeTimerRef.current);
    }
    return () => {
      if (codeTimerRef.current) clearInterval(codeTimerRef.current);
    };
  }, [pairingCode]);

  // ── Request Pairing Code ──────────────────────────────────────────────────

  const handleRequestCode = useCallback(async () => {
    if (!phoneInput.trim()) return;

    setPairingCodeLoading(true);
    setPairingError(null);
    setPairingCode(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const targetUrl = resolveRelayUrl(whatsappRelayUrl);
    let sid = sessionIdRef.current;

    try {
      if (!sid) {
        const { sessionId } = await createSession(targetUrl, 'user_default');
        sessionIdRef.current = sessionId;
        sid = sessionId;
        relayClient.connect(targetUrl, sid, {
          onQR: () => {},
          onConnected: (phone) => handleConnected(phone || ''),
          onDisconnected: () => {},
          onNewLead: () => {},
          onError: (msg) => setPairingError(msg),
        });
        await new Promise((r) => setTimeout(r, 600));
      }

      const fullPhone = `${selectedCountry.dialCode}${phoneInput.replace(/\D/g, '')}`;
      const result = await requestPairingCode(targetUrl, sid, fullPhone);
      setPairingCode(result.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setPairingError(e.message || 'Could not generate pairing code. Try scanning QR code.');
    } finally {
      setPairingCodeLoading(false);
    }
  }, [phoneInput, selectedCountry, whatsappRelayUrl, handleConnected]);

  const handleCopyCode = async () => {
    if (!pairingCode) return;
    await Clipboard.setStringAsync(pairingCode);
    setCopiedCode(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWebQR = async () => {
    const url = resolveRelayUrl(whatsappRelayUrl);
    const webQrUrl = `${url}/qr/${sessionIdRef.current || 'session_user_default'}`;
    await Share.share({
      message: `Open this link on your computer or tablet screen to scan Mikana WhatsApp QR:\n${webQrUrl}`,
      url: webQrUrl,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── 1. Top Header & 6-Segment Progress Bar ──────────────────────────── */}
      <View className="px-6 pt-2 pb-3 border-b border-border bg-canvas">
        <View className="flex-row items-center gap-1.5 mb-3">
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-brand-navy" />
          <View className="flex-1 h-1 rounded-full bg-slate-200" />
          <View className="flex-1 h-1 rounded-full bg-slate-200" />
          <View className="flex-1 h-1 rounded-full bg-slate-200" />
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            className="p-1 -ml-1 active:opacity-60"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/onboarding/discover');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color="#486581" strokeWidth={1.75} />
          </Pressable>
          <Text className="font-geist-medium text-xs text-content-muted tracking-wide">
            Step 3 of 6 · Connect WhatsApp
          </Text>
          <View className="w-8" />
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pt-5 pb-24"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Privacy Guarantee */}
        <View className="mb-5">
          <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1.5">
            Connect your WhatsApp
          </Text>
          <Text className="font-inter text-sm leading-5 text-content-secondary">
            Mikana only monitors selected groups for trade inquiries. Your private chats and calls are never accessed or stored.
          </Text>
        </View>

        {/* ── Mode Toggle (QR Scanner is Primary) ───────────────────────── */}
        <View className="flex-row bg-surface-elevated p-1 rounded-xl border border-border mb-5">
          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg ${
              pairMode === 'qr' ? 'bg-surface shadow-xs border border-border' : ''
            }`}
            onPress={() => {
              setPairMode('qr');
              Haptics.selectionAsync();
            }}
          >
            <QrCode
              size={15}
              color={pairMode === 'qr' ? '#1E56A0' : '#829AB1'}
              strokeWidth={2}
            />
            <Text
              className={`font-geist-medium text-xs ${
                pairMode === 'qr' ? 'text-brand-blue font-geist-semibold' : 'text-content-secondary'
              }`}
            >
              QR Scanner (Primary)
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg ${
              pairMode === 'code' ? 'bg-surface shadow-xs border border-border' : ''
            }`}
            onPress={() => {
              setPairMode('code');
              Haptics.selectionAsync();
            }}
          >
            <Smartphone
              size={15}
              color={pairMode === 'code' ? '#1E56A0' : '#829AB1'}
              strokeWidth={2}
            />
            <Text
              className={`font-geist-medium text-xs ${
                pairMode === 'code' ? 'text-brand-blue font-geist-semibold' : 'text-content-secondary'
              }`}
            >
              Phone Number (Secondary)
            </Text>
          </Pressable>
        </View>

        {/* ── QR Mode (Primary) ─────────────────────────────────────────── */}
        {pairMode === 'qr' ? (
          <View className="items-center bg-surface border border-border rounded-2xl p-6 shadow-xs">
            <View className="w-[200px] h-[200px] items-center justify-center bg-white border border-border rounded-xl p-2 mb-4">
              {liveQR ? (
                <QRCode
                  value={liveQR}
                  size={180}
                  color="#0B2545"
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <View className="items-center justify-center gap-2 px-4">
                  <ActivityIndicator size="large" color="#1E56A0" />
                  <Text className="font-inter text-xs text-content-muted text-center leading-4">
                    {relayStatus === 'error'
                      ? 'Relay server unreachable'
                      : 'Generating live WhatsApp QR...'}
                  </Text>
                  {relayStatus === 'error' && (
                    <Pressable
                      onPress={connectToRelay}
                      className="flex-row items-center gap-1.5 bg-brand-blue-tint border border-brand-blue-border px-3 py-1.5 rounded-lg mt-1"
                    >
                      <RefreshCw size={12} color="#1E56A0" />
                      <Text className="font-geist-medium text-xs text-brand-blue">Retry</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            {/* Share to PC button (for single phone users) */}
            <Pressable
              className="flex-row items-center justify-between w-full bg-brand-blue-tint border border-brand-blue-border rounded-xl px-4 py-3 mb-4 active:opacity-85"
              onPress={handleShareWebQR}
            >
              <View className="flex-row items-center gap-2.5">
                <Monitor size={16} color="#1E56A0" strokeWidth={2} />
                <Text className="font-geist-semibold text-xs text-brand-blue">
                  Open / Share Live QR on PC Screen
                </Text>
              </View>
              <Share2 size={14} color="#1E56A0" strokeWidth={2} />
            </Pressable>

            {/* Step-by-step guidance */}
            <View className="w-full gap-2 pt-2 border-t border-border">
              {[
                'Open WhatsApp on your phone',
                'Tap Settings → Linked Devices → Link a Device',
                'Scan this QR code or open the link on PC to scan',
              ].map((instruction, idx) => (
                <View key={idx} className="flex-row items-start gap-2.5">
                  <View className="w-5 h-5 rounded-full bg-surface-elevated border border-border items-center justify-center mt-0.5">
                    <Text className="font-geist-semibold text-[10px] text-content-secondary">
                      {idx + 1}
                    </Text>
                  </View>
                  <Text className="flex-1 font-inter text-xs text-content-secondary leading-4">
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* ── Pairing Code Mode (Secondary) ─────────────────────────────── */
          <View className="bg-surface border border-border rounded-2xl p-5 shadow-xs">
            {!pairingCode ? (
              <View className="gap-3.5">
                <Text className="font-geist-semibold text-[11px] text-content-muted uppercase tracking-wider">
                  ENTER WHATSAPP PHONE NUMBER
                </Text>

                {/* Country selector */}
                <Pressable
                  className="flex-row items-center justify-between bg-surface-elevated border border-border rounded-xl px-3.5 py-3"
                  onPress={() => setIsCountryModalOpen(true)}
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">{selectedCountry.flag}</Text>
                    <Text className="font-geist-medium text-xs text-content-primary">
                      {selectedCountry.name}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#829AB1" />
                </Pressable>

                {/* Phone row with dial code */}
                <View className="flex-row gap-2">
                  <Pressable
                    className="bg-surface-elevated border border-border rounded-xl px-3.5 justify-center"
                    onPress={() => setIsCountryModalOpen(true)}
                  >
                    <Text className="font-geist-semibold text-sm text-content-primary">
                      {selectedCountry.dialCode}
                    </Text>
                  </Pressable>
                  <TextInput
                    className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-3 font-inter text-sm text-content-primary"
                    placeholder="77 123 4567"
                    placeholderTextColor="#829AB1"
                    value={phoneInput}
                    onChangeText={text => {
                      setPhoneInput(text);
                      if (pairingError) setPairingError(null);
                    }}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleRequestCode}
                  />
                </View>

                <Pressable
                  className={`flex-row items-center justify-center gap-2 bg-brand-navy py-3.5 rounded-xl border border-brand-navy-dark ${
                    !phoneInput.trim() || pairingCodeLoading
                      ? 'opacity-40'
                      : 'active:scale-[0.98] active:opacity-95'
                  }`}
                  onPress={handleRequestCode}
                  disabled={!phoneInput.trim() || pairingCodeLoading}
                >
                  {pairingCodeLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="font-geist-semibold text-sm text-content-inverse">
                      Generate 8-Digit Code
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              /* Display Generated Code */
              <View className="items-center gap-3">
                <Text className="font-geist-semibold text-[11px] text-content-muted uppercase tracking-wider">
                  YOUR 8-DIGIT PAIRING CODE
                </Text>

                <Pressable
                  className="flex-row items-center justify-between w-full bg-brand-blue-tint border-2 border-brand-blue rounded-xl px-5 py-4 active:opacity-80"
                  onPress={handleCopyCode}
                >
                  <Text className="font-geist-bold text-2xl text-brand-navy tracking-widest">
                    {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
                  </Text>
                  {copiedCode ? (
                    <View className="flex-row items-center gap-1 bg-emerald-600 px-2 py-1 rounded">
                      <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
                      <Text className="font-geist-semibold text-[10px] text-white">COPIED</Text>
                    </View>
                  ) : (
                    <Copy size={18} color="#1E56A0" strokeWidth={2} />
                  )}
                </Pressable>

                {codeSecondsLeft > 0 && (
                  <Text className="font-inter text-xs text-content-muted">
                    Expires in {codeSecondsLeft}s · Enter immediately in WhatsApp
                  </Text>
                )}

                {/* Instructions */}
                <View className="w-full gap-2 pt-2 border-t border-border mt-2">
                  {[
                    'Open WhatsApp on this phone',
                    'Tap Settings → Linked Devices → Link a Device',
                    'Tap "Link with phone number instead" and paste this code',
                  ].map((instruction, idx) => (
                    <View key={idx} className="flex-row items-start gap-2.5">
                      <View className="w-5 h-5 rounded-full bg-surface-elevated border border-border items-center justify-center mt-0.5">
                        <Text className="font-geist-semibold text-[10px] text-content-secondary">
                          {idx + 1}
                        </Text>
                      </View>
                      <Text className="flex-1 font-inter text-xs text-content-secondary leading-4">
                        {instruction}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  className="flex-row items-center gap-1.5 pt-2"
                  onPress={() => {
                    setPairingCode(null);
                    setPairingError(null);
                  }}
                >
                  <RefreshCw size={12} color="#829AB1" />
                  <Text className="font-inter text-xs text-content-muted">Generate new code</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {pairingError && (
          <View className="bg-status-rose-bg border border-status-rose-border rounded-xl p-3 mt-4">
            <Text className="font-inter text-xs text-status-rose leading-4">
              {pairingError}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Country picker modal */}
      <CountryCodePickerModal
        visible={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSelect={(c) => {
          setSelectedCountry(c);
          setIsCountryModalOpen(false);
        }}
        selectedCountry={selectedCountry}
      />
    </SafeAreaView>
  );
}

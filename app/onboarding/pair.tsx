import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ActivityIndicator, Clipboard, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, Check, RefreshCw, Smartphone, QrCode } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '../../src/theme/colors';
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

type Mode = 'code' | 'qr';

export default function PairScreen() {
  const router = useRouter();
  const { capabilityProfile, setOnboardingStage } = useAuthStore();
  const { whatsappRelayUrl, setWhatsAppConnected } = useSettingsStore();

  const [mode, setMode] = useState<Mode>('code');
  const [country, setCountry] = useState<Country>(() => detectUserCountry());
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [liveQR, setLiveQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startCountdown = (secs: number) => {
    clearTimer();
    setSecondsLeft(secs);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearTimer(); setPairingCode(null); setError('Code expired. Generate a new one.'); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearTimer(), []);

  const handleConnected = useCallback(async (phone: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWhatsAppConnected(true, phone || '');
    setOnboardingStage('paired');

    // Push capability profile to relay
    if (capabilityProfile && sessionIdRef.current) {
      const url = resolveRelayUrl(whatsappRelayUrl);
      pushCapabilityProfile(url, sessionIdRef.current, capabilityProfile);
    }
    router.push('/onboarding/groups');
  }, [capabilityProfile, whatsappRelayUrl]);

  const startSession = useCallback(async () => {
    const url = resolveRelayUrl(whatsappRelayUrl);
    setLoading(true);
    setError(null);
    try {
      const { sessionId } = await createSession(url, 'user_default');
      sessionIdRef.current = sessionId;
      relayClient.connect(url, sessionId, {
        onQR: (qr) => { setLiveQR(qr); setLoading(false); },
        onConnected: (phone) => handleConnected(phone || ''),
        onDisconnected: () => {},
        onNewLead: () => {},
        

        onError: (msg) => { setError(msg); setLoading(false); },
      });
    } catch (e: any) {
      setError(e.message || 'Could not connect to relay. Check your internet.');
      setLoading(false);
    }
  }, [whatsappRelayUrl, handleConnected]);

  const handleRequestCode = useCallback(async () => {
    if (!phoneInput.trim()) return;
    setLoading(true);
    setError(null);
    setPairingCode(null);

    const url = resolveRelayUrl(whatsappRelayUrl);
    let sid = sessionIdRef.current;
    try {
      if (!sid) {
        const { sessionId } = await createSession(url, 'user_default');
        sessionIdRef.current = sessionId;
        sid = sessionId;
        relayClient.connect(url, sid, {
          onQR: () => {},
          onConnected: (phone) => handleConnected(phone || ''),
          onDisconnected: () => {},
          onNewLead: () => {},
          

          onError: (msg) => setError(msg),
        });
        await new Promise(r => setTimeout(r, 800));
      }
      const fullPhone = `${country.dialCode}${phoneInput.replace(/\D/g, '')}`;
      const result = await requestPairingCode(url, sid, fullPhone);
      setPairingCode(result.code);
      startCountdown(60);
    } catch (e: any) {
      setError(e.message || 'Could not generate code. Try QR code instead.');
    } finally {
      setLoading(false);
    }
  }, [phoneInput, country, whatsappRelayUrl, handleConnected]);

  const handleCopy = () => {
    if (!pairingCode) return;
    Clipboard.setString(pairingCode);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchToQR = () => {
    setMode('qr');
    setPairingCode(null);
    setError(null);
    clearTimer();
    if (!sessionIdRef.current) startSession();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.stepIndicator}>2 of 3</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.heading}>Connect your WhatsApp</Text>
        <Text style={styles.subtext}>
          Mikana only reads the groups you choose. Personal chats are never accessed.
        </Text>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          {(['code', 'qr'] as Mode[]).map(m => (
            <Pressable
              key={m}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
              onPress={() => {
                setMode(m);
                if (m === 'qr' && !liveQR) startSession();
              }}
            >
              {m === 'code'
                ? <Smartphone size={15} color={mode === m ? colors.accentBlue : colors.textMuted} strokeWidth={1.5} />
                : <QrCode size={15} color={mode === m ? colors.accentBlue : colors.textMuted} strokeWidth={1.5} />
              }
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {m === 'code' ? 'Pairing Code' : 'QR Code'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Pairing code mode */}
        {mode === 'code' && (
          <View style={styles.codeSection}>
            {!pairingCode ? (
              <>
                <Text style={styles.fieldLabel}>Your WhatsApp number</Text>
                <View style={styles.phoneRow}>
                  <Pressable style={styles.countryButton} onPress={() => setIsCountryModalOpen(true)}>
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={styles.countryCode}>{country.dialCode}</Text>
                  </Pressable>
                  <TextInput
                    style={styles.phoneInput}
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    placeholder="77 123 4567"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleRequestCode}
                  />
                </View>
                <Pressable
                  style={[styles.generateButton, (loading || !phoneInput.trim()) && styles.buttonDisabled]}
                  onPress={handleRequestCode}
                  disabled={loading || !phoneInput.trim()}
                  accessibilityRole="button"
                >
                  {loading
                    ? <ActivityIndicator color={colors.textInverse} size="small" />
                    : <Text style={styles.generateButtonText}>Generate 8-Digit Code</Text>
                  }
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.codeLabel}>Your pairing code</Text>
                <Pressable style={styles.codeDisplay} onPress={handleCopy} accessibilityRole="button">
                  <Text style={styles.codeText}>
                    {pairingCode.slice(0, 4)}-{pairingCode.slice(4)}
                  </Text>
                  {copied
                    ? <Check size={18} color={colors.emerald} strokeWidth={2} />
                    : <Copy size={18} color={colors.textMuted} strokeWidth={1.5} />
                  }
                </Pressable>
                {secondsLeft > 0 && (
                  <Text style={styles.expiryText}>Expires in {secondsLeft}s</Text>
                )}
                <View style={styles.instructionList}>
                  {[
                    'Open WhatsApp on this phone',
                    'Tap Settings ? Linked Devices ? Link a Device',
                    'Tap "Link with phone number instead" and enter this code',
                  ].map((step, i) => (
                    <View key={i} style={styles.instructionRow}>
                      <View style={styles.instructionNum}>
                        <Text style={styles.instructionNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{step}</Text>
                    </View>
                  ))}
                </View>
                <Pressable style={styles.resetButton} onPress={() => { setPairingCode(null); clearTimer(); setError(null); }}>
                  <RefreshCw size={14} color={colors.textMuted} strokeWidth={1.5} />
                  <Text style={styles.resetButtonText}>Generate new code</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* QR mode */}
        {mode === 'qr' && (
          <View style={styles.qrSection}>
            {loading && <ActivityIndicator color={colors.accentBlue} size="large" style={{ marginTop: spacing.xxxl }} />}
            {liveQR && !loading && (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR code appears here</Text>
                <Text style={styles.qrSubtext}>Open WhatsApp ? Settings ? Linked Devices ? Scan QR</Text>
              </View>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            {mode === 'code' && (
              <Pressable onPress={switchToQR}>
                <Text style={styles.errorLink}>Try QR code instead</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <CountryCodePickerModal
        visible={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSelect={(c) => { setCountry(c); setIsCountryModalOpen(false); }}
        selectedCountry={country}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: spacing.xs },
  stepIndicator: { fontFamily: 'Geist_500Medium', fontSize: 13, color: colors.textMuted },
  body: { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl },
  heading: { fontFamily: 'Geist_700Bold', fontSize: 22, lineHeight: 28, color: colors.textHeading, marginBottom: spacing.sm, letterSpacing: -0.3 },
  subtext: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: spacing.xl },
  modeToggle: { flexDirection: 'row', backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: 3, marginBottom: spacing.xxl },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.sm },
  modeTabActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  modeTabText: { fontFamily: 'Geist_500Medium', fontSize: 13, color: colors.textMuted },
  modeTabTextActive: { color: colors.accentBlue },
  codeSection: { gap: spacing.md },
  fieldLabel: { fontFamily: 'Geist_500Medium', fontSize: 13, color: colors.textPrimary },
  phoneRow: { flexDirection: 'row', gap: spacing.sm },
  countryButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12 },
  countryFlag: { fontSize: 18 },
  countryCode: { fontFamily: 'Geist_500Medium', fontSize: 14, color: colors.textPrimary },
  phoneInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textPrimary },
  generateButton: { backgroundColor: colors.brandNavy, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.45 },
  generateButtonText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.textInverse },
  codeLabel: { fontFamily: 'Geist_500Medium', fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.accentBlueBorder, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  codeText: { fontFamily: 'Geist_700Bold', fontSize: 28, color: colors.brandNavy, letterSpacing: 4 },
  expiryText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  instructionList: { gap: spacing.md, marginTop: spacing.md },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  instructionNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accentBlueTint, borderWidth: 1, borderColor: colors.accentBlueBorder, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  instructionNumText: { fontFamily: 'Geist_600SemiBold', fontSize: 12, color: colors.accentBlue },
  instructionText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center', marginTop: spacing.md },
  resetButtonText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted },
  qrSection: { alignItems: 'center', paddingTop: spacing.xl },
  qrPlaceholder: { width: 220, height: 220, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  qrPlaceholderText: { fontFamily: 'Geist_500Medium', fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm },
  qrSubtext: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  errorBox: { backgroundColor: colors.roseBg, borderWidth: 1, borderColor: colors.roseBorder, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl, gap: spacing.xs },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.rose },
  errorLink: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: colors.accentBlue },
});

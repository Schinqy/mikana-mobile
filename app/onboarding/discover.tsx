import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft, MapPin, X, Plus } from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/useAuthStore';

// -- Example prompts and location quick-picks ----------------------------------

const EXAMPLE_PROMPTS = [
  'I repair commercial equipment and appliances',
  'I supply wholesale grain, foodstuff and commodities',
  'I build mobile apps, websites and software',
  'I install commercial solar systems and inverters',
  'I provide plumbing, electrical and maintenance services',
  'I wholesale automotive parts and vehicles',
];

const QUICK_LOCATIONS = [
  'Worldwide / Remote',
  'Nationwide',
  'Local Metro Area',
  'Multi-Region',
];

// ── Gemini-powered capability extractor (inline, no extra service file needed) ─

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

async function extractCapabilities(description: string): Promise<{
  categories: string[];
  capabilities: string[];
  products: string[];
  followUpChips: string[];
}> {
  if (!GEMINI_API_KEY) {
    // Offline fallback — simple heuristic chips
    return {
      categories: ['Commercial Services'],
      capabilities: [description.slice(0, 40)],
      products: [],
      followUpChips: ['Installation', 'Repairs', 'Supply & Distribution', 'Consulting', 'Maintenance'],
    };
  }

  const prompt = `A user described their business, work, or trade in these words: "${description}"

Extract a structured capability profile in JSON:
{
  "categories": ["up to 2 relevant industry categories"],
  "capabilities": ["3-5 specific commercial services or offerings"],
  "products": ["any physical goods they sell, or empty array"],
  "followUpChips": ["5-7 short chip options for the user to refine what they offer, tailored to their industry"]
}

Rules:
- categories should be concise 2-4 word industry labels (e.g. "Solar & Renewable Energy", "Commodity Trading", "Software Engineering")
- capabilities should be actionable offering phrases (e.g. "commercial inverter installation", "bulk grain supply", "React Native development")
- followUpChips should be concise 1-3 word options specific to their stated trade
- Multilingual: understand any language globally (English, Spanish, Portuguese, Arabic, French, Swahili, Hindi, etc.) naturally
- Return ONLY valid JSON, no markdown`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(raw || '{}');
}

// -- Screen --------------------------------------------------------------------

type Step = 'input' | 'refine' | 'location';

export default function DiscoverScreen() {
  const router = useRouter();
  const { setCapabilityProfile, setOnboardingStage } = useAuthStore();

  const [step, setStep] = useState<Step>('input');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extracted from AI
  const [extractedCategories, setExtractedCategories] = useState<string[]>([]);
  const [allChips, setAllChips] = useState<string[]>([]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  // Location
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Worldwide / Remote']);
  const [customLocation, setCustomLocation] = useState('');

  const inputRef = useRef<TextInput>(null);

  // -- Handlers --------------------------------------------------------------

  const handleDescriptionSubmit = useCallback(async () => {
    if (description.trim().length < 3) return;
    setLoading(true);
    setError(null);

    try {
      const result = await extractCapabilities(description.trim());
      setExtractedCategories(result.categories || []);
      const chips = [...(result.capabilities || []), ...(result.followUpChips || [])];
      const unique = [...new Set(chips)];
      setAllChips(unique);
      setSelectedChips(result.capabilities?.slice(0, 4) || unique.slice(0, 3));
      setStep('refine');
    } catch {
      setError('Could not process your description. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [description]);

  const toggleChip = useCallback((chip: string) => {
    setSelectedChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  }, []);

  const toggleLocation = useCallback((loc: string) => {
    setSelectedLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  }, []);

  const handleContinue = useCallback(() => {
    const locations = customLocation.trim()
      ? [...selectedLocations, customLocation.trim()]
      : selectedLocations;

    const profile = {
      displayName: '',
      description: description.trim(),
      location: locations[0] || 'Worldwide',
      serviceAreas: locations,
      categories: extractedCategories,
      capabilities: selectedChips,
      products: [],
      keywords: [
        ...extractedCategories.map(c => c.toLowerCase()),
        ...selectedChips.map(c => c.toLowerCase()),
        ...locations.map(l => l.toLowerCase()),
      ],
    };

    setCapabilityProfile(profile);
    setOnboardingStage('discovered');
    router.push('/onboarding/pair');
  }, [description, extractedCategories, selectedChips, selectedLocations, customLocation]);

  // -- Render ----------------------------------------------------------------

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (step === 'refine') { setStep('input'); return; }
              if (step === 'location') { setStep('refine'); return; }
              router.back();
            }}
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={colors.textSecondary} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.stepIndicator}>
            {step === 'input' ? '1 of 3' : step === 'refine' ? '2 of 3' : '3 of 3'}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* -- STEP 1: Free-text description ------------------------------- */}
          {step === 'input' && (
            <View>
              <Text style={styles.heading}>What do you do?</Text>
              <Text style={styles.subtext}>
                Describe what you sell, offer, or trade in plain words. Any language is fine.
              </Text>

              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. I supply commercial solar systems, inverters and batteries..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                autoFocus
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={handleDescriptionSubmit}
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Quick-tap examples */}
              <Text style={styles.examplesLabel}>Examples</Text>
              <View style={styles.examplesList}>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [styles.examplePill, pressed && styles.examplePillPressed]}
                    onPress={() => setDescription(ex)}
                  >
                    <Text style={styles.examplePillText}>{ex}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* -- STEP 2: Refine chips ---------------------------------------- */}
          {step === 'refine' && (
            <View>
              <Text style={styles.heading}>What do you offer?</Text>
              <Text style={styles.subtext}>
                Select everything that applies to you. Tap to toggle.
              </Text>

              {extractedCategories.length > 0 && (
                <View style={styles.categoryRow}>
                  {extractedCategories.map(cat => (
                    <View key={cat} style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.chipsGrid}>
                {allChips.map(chip => {
                  const selected = selectedChips.includes(chip);
                  return (
                    <Pressable
                      key={chip}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleChip(chip)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {chip}
                      </Text>
                      {selected && <X size={12} color={colors.accentBlue} strokeWidth={2} />}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.selectionNote}>
                {selectedChips.length} selected
              </Text>
            </View>
          )}

          {/* -- STEP 3: Location ------------------------------------------- */}
          {step === 'location' && (
            <View>
              <Text style={styles.heading}>Where do you operate?</Text>
              <Text style={styles.subtext}>
                Mikana will prioritise opportunities in your service areas.
              </Text>

              <View style={styles.chipsGrid}>
                {QUICK_LOCATIONS.map(loc => {
                  const selected = selectedLocations.includes(loc);
                  return (
                    <Pressable
                      key={loc}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => toggleLocation(loc)}
                    >
                      <MapPin
                        size={12}
                        color={selected ? colors.accentBlue : colors.textMuted}
                        strokeWidth={1.5}
                      />
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {loc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.customLocationRow}>
                <TextInput
                  style={styles.customLocationInput}
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  placeholder="Add another area..."
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                />
                {customLocation.trim().length > 0 && (
                  <Pressable
                    style={styles.addLocationButton}
                    onPress={() => {
                      toggleLocation(customLocation.trim());
                      setCustomLocation('');
                    }}
                  >
                    <Plus size={16} color={colors.accentBlue} strokeWidth={2} />
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.ctaContainer}>
          {step === 'input' && (
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                description.trim().length < 3 && styles.ctaButtonDisabled,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handleDescriptionSubmit}
              disabled={loading || description.trim().length < 3}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <>
                  <Text style={styles.ctaButtonText}>Continue</Text>
                  <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
                </>
              )}
            </Pressable>
          )}

          {step === 'refine' && (
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                selectedChips.length === 0 && styles.ctaButtonDisabled,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={() => setStep('location')}
              disabled={selectedChips.length === 0}
              accessibilityRole="button"
            >
              <Text style={styles.ctaButtonText}>Looks good</Text>
              <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
            </Pressable>
          )}

          {step === 'location' && (
            <Pressable
              style={({ pressed }) => [
                styles.ctaButton,
                selectedLocations.length === 0 && styles.ctaButtonDisabled,
                pressed && styles.ctaButtonPressed,
              ]}
              onPress={handleContinue}
              disabled={selectedLocations.length === 0}
              accessibilityRole="button"
            >
              <Text style={styles.ctaButtonText}>Connect WhatsApp</Text>
              <ArrowRight size={18} color={colors.textInverse} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: spacing.xs },
  stepIndicator: { fontFamily: 'Geist_500Medium', fontSize: 13, color: colors.textMuted },
  scroll: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: 120 },
  heading: { fontFamily: 'Geist_700Bold', fontSize: 22, lineHeight: 28, color: colors.textHeading, marginBottom: spacing.sm, letterSpacing: -0.3 },
  subtext: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: spacing.xl },
  textInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textPrimary, lineHeight: 22, minHeight: 90, textAlignVertical: 'top', marginBottom: spacing.sm },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.rose, marginBottom: spacing.md },
  examplesLabel: { fontFamily: 'Geist_500Medium', fontSize: 12, color: colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: spacing.md, marginTop: spacing.lg },
  examplesList: { gap: spacing.sm },
  examplePill: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  examplePillPressed: { backgroundColor: colors.surfaceElevated },
  examplePillText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  categoryBadge: { backgroundColor: colors.accentBlueTint, borderWidth: 1, borderColor: colors.accentBlueBorder, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  categoryBadgeText: { fontFamily: 'Geist_600SemiBold', fontSize: 12, color: colors.accentBlue },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipSelected: { backgroundColor: colors.accentBlueTint, borderColor: colors.accentBlue },
  chipText: { fontFamily: 'Geist_500Medium', fontSize: 13, color: colors.textSecondary },
  chipTextSelected: { color: colors.accentBlue },
  selectionNote: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  customLocationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  customLocationInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textPrimary },
  addLocationButton: { backgroundColor: colors.accentBlueTint, borderWidth: 1, borderColor: colors.accentBlueBorder, borderRadius: radius.md, padding: spacing.sm },
  ctaContainer: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.canvas },
  ctaButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brandNavy, paddingVertical: 15, borderRadius: radius.md },
  ctaButtonDisabled: { opacity: 0.45 },
  ctaButtonPressed: { opacity: 0.88 },
  ctaButtonText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: colors.textInverse },
});

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
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
import { useAuthStore } from '../../src/store/useAuthStore';

// ── Example prompts and location quick-picks ──────────────────────────────────

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

// ── Gemini-powered capability extractor ───────────────────────────────────────

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

async function extractCapabilities(description: string): Promise<{
  categories: string[];
  capabilities: string[];
  products: string[];
  followUpChips: string[];
}> {
  if (!GEMINI_API_KEY) {
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

// ── Screen ────────────────────────────────────────────────────────────────────

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

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-3.5 border-b border-border">
          <Pressable
            className="p-1"
            onPress={() => {
              if (step === 'refine') { setStep('input'); return; }
              if (step === 'location') { setStep('refine'); return; }
              router.back();
            }}
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color="#486581" strokeWidth={1.5} />
          </Pressable>
          <Text className="font-geist-medium text-xs text-content-muted">
            {step === 'input' ? '1 of 3' : step === 'refine' ? '2 of 3' : '3 of 3'}
          </Text>
        </View>

        <ScrollView
          contentContainerClassName="px-6 pt-5 pb-32"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── STEP 1: Free-text description ─────────────────────────────── */}
          {step === 'input' && (
            <View>
              <Text className="font-geist-bold text-xl leading-7 text-content-heading mb-1 tracking-tight">
                What do you offer?
              </Text>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-4">
                Describe what you sell, supply, or trade in plain words. Any language is fine.
              </Text>

              <TextInput
                ref={inputRef}
                className="bg-surface border border-border rounded-xl p-3.5 font-inter text-sm text-content-primary leading-5 min-h-[90px] mb-2"
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. I supply commercial solar systems, inverters and batteries..."
                placeholderTextColor="#829AB1"
                multiline
                numberOfLines={3}
                autoFocus
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={handleDescriptionSubmit}
              />

              {error && <Text className="font-inter text-xs text-status-rose mb-3">{error}</Text>}

              {/* Quick-tap examples */}
              <Text className="font-geist-medium text-[11px] text-content-muted uppercase tracking-wider mb-2.5 mt-4">
                EXAMPLES
              </Text>
              <View className="gap-2">
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <Pressable
                    key={i}
                    className="bg-surface border border-border rounded-xl px-3.5 py-2.5 active:bg-surface-elevated"
                    onPress={() => setDescription(ex)}
                  >
                    <Text className="font-inter text-xs text-content-secondary">{ex}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ── STEP 2: Refine chips ──────────────────────────────────────── */}
          {step === 'refine' && (
            <View>
              <Text className="font-geist-bold text-xl leading-7 text-content-heading mb-1 tracking-tight">
                Refine your offerings
              </Text>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-4">
                Select everything that applies to your business. Tap to toggle.
              </Text>

              {extractedCategories.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mb-3.5">
                  {extractedCategories.map(cat => (
                    <View key={cat} className="bg-brand-blue-tint border border-brand-blue-border rounded-md px-2.5 py-1">
                      <Text className="font-geist-semibold text-xs text-brand-blue">{cat}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View className="flex-row flex-wrap gap-2 mb-3">
                {allChips.map(chip => {
                  const selected = selectedChips.includes(chip);
                  return (
                    <Pressable
                      key={chip}
                      className={`flex-row items-center gap-1.5 border rounded-full px-3 py-1.5 ${
                        selected
                          ? 'bg-brand-blue-tint border-brand-blue'
                          : 'bg-surface border-border'
                      }`}
                      onPress={() => toggleChip(chip)}
                    >
                      <Text
                        className={`font-geist-medium text-xs ${
                          selected ? 'text-brand-blue' : 'text-content-secondary'
                        }`}
                      >
                        {chip}
                      </Text>
                      {selected && <X size={12} color="#1E56A0" strokeWidth={2} />}
                    </Pressable>
                  );
                })}
              </View>

              <Text className="font-inter text-xs text-content-muted mt-1">
                {selectedChips.length} selected
              </Text>
            </View>
          )}

          {/* ── STEP 3: Location ─────────────────────────────────────────── */}
          {step === 'location' && (
            <View>
              <Text className="font-geist-bold text-xl leading-7 text-content-heading mb-1 tracking-tight">
                Where do you operate?
              </Text>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-4">
                Mikana will prioritize opportunities in your operating areas.
              </Text>

              <View className="flex-row flex-wrap gap-2 mb-3">
                {QUICK_LOCATIONS.map(loc => {
                  const selected = selectedLocations.includes(loc);
                  return (
                    <Pressable
                      key={loc}
                      className={`flex-row items-center gap-1.5 border rounded-full px-3.5 py-2 ${
                        selected
                          ? 'bg-brand-blue-tint border-brand-blue'
                          : 'bg-surface border-border'
                      }`}
                      onPress={() => toggleLocation(loc)}
                    >
                      <MapPin
                        size={12}
                        color={selected ? '#1E56A0' : '#829AB1'}
                        strokeWidth={1.5}
                      />
                      <Text
                        className={`font-geist-medium text-xs ${
                          selected ? 'text-brand-blue' : 'text-content-secondary'
                        }`}
                      >
                        {loc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="flex-row items-center gap-2 mt-3">
                <TextInput
                  className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2 font-inter text-sm text-content-primary"
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  placeholder="Add specific country, city or region..."
                  placeholderTextColor="#829AB1"
                  returnKeyType="done"
                />
                {customLocation.trim().length > 0 && (
                  <Pressable
                    className="bg-brand-blue-tint border border-brand-blue-border rounded-xl p-2.5"
                    onPress={() => {
                      toggleLocation(customLocation.trim());
                      setCustomLocation('');
                    }}
                  >
                    <Plus size={16} color="#1E56A0" strokeWidth={2} />
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View className="px-6 pb-6 pt-3 border-t border-border bg-canvas">
          {step === 'input' && (
            <Pressable
              className={`flex-row items-center justify-center gap-2 bg-brand-navy py-3.5 rounded-xl ${
                description.trim().length < 3 ? 'opacity-40' : 'active:opacity-90'
              }`}
              onPress={handleDescriptionSubmit}
              disabled={loading || description.trim().length < 3}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="font-geist-semibold text-sm text-content-inverse">Continue</Text>
                  <ArrowRight size={17} color="#FFFFFF" strokeWidth={2} />
                </>
              )}
            </Pressable>
          )}

          {step === 'refine' && (
            <Pressable
              className={`flex-row items-center justify-center gap-2 bg-brand-navy py-3.5 rounded-xl ${
                selectedChips.length === 0 ? 'opacity-40' : 'active:opacity-90'
              }`}
              onPress={() => setStep('location')}
              disabled={selectedChips.length === 0}
              accessibilityRole="button"
            >
              <Text className="font-geist-semibold text-sm text-content-inverse">Looks good</Text>
              <ArrowRight size={17} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}

          {step === 'location' && (
            <Pressable
              className={`flex-row items-center justify-center gap-2 bg-brand-navy py-3.5 rounded-xl ${
                selectedLocations.length === 0 ? 'opacity-40' : 'active:opacity-90'
              }`}
              onPress={handleContinue}
              disabled={selectedLocations.length === 0}
              accessibilityRole="button"
            >
              <Text className="font-geist-semibold text-sm text-content-inverse">Connect WhatsApp</Text>
              <ArrowRight size={17} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
import React, { useState, useCallback, useMemo } from 'react';
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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Sparkles,
  MapPin,
  Globe,
  User,
  X,
  Briefcase,
  Layers,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/useAuthStore';

// ── Comprehensive Global Language Catalog ──────────────────────────────────────

interface GlobalLanguage {
  id: string;
  label: string;
  native: string;
}

const GLOBAL_LANGUAGES: GlobalLanguage[] = [
  // Major International Lingua Francas
  { id: 'en', label: 'English', native: 'English' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
  { id: 'pt', label: 'Portuguese', native: 'Português' },
  { id: 'zh', label: 'Mandarin Chinese', native: '中文' },
  { id: 'de', label: 'German', native: 'Deutsch' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'ru', label: 'Russian', native: 'Русский' },
  { id: 'ja', label: 'Japanese', native: '日本語' },
  { id: 'it', label: 'Italian', native: 'Italiano' },
  { id: 'tr', label: 'Turkish', native: 'Türkçe' },
  { id: 'ko', label: 'Korean', native: '한국어' },
  { id: 'nl', label: 'Dutch', native: 'Nederlands' },
  { id: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { id: 'vi', label: 'Vietnamese', native: 'Tiếng Việt' },
  { id: 'pl', label: 'Polish', native: 'Polski' },
  { id: 'fa', label: 'Persian / Farsi', native: 'فارسی' },
  { id: 'ur', label: 'Urdu', native: 'اردو' },
  { id: 'th', label: 'Thai', native: 'ไทย' },
  { id: 'bn', label: 'Bengali', native: 'বাংলা' },
  { id: 'he', label: 'Hebrew', native: 'עברית' },
  { id: 'el', label: 'Greek', native: 'Ελληνικά' },
  { id: 'sv', label: 'Swedish', native: 'Svenska' },
  { id: 'uk', label: 'Ukrainian', native: 'Українська' },

  // African Commercial & Regional Languages
  { id: 'sw', label: 'Swahili', native: 'Kiswahili' },
  { id: 'sn', label: 'Shona', native: 'chiShona' },
  { id: 'nd', label: 'Ndebele', native: 'isiNdebele' },
  { id: 'zu', label: 'Zulu', native: 'isiZulu' },
  { id: 'xh', label: 'Xhosa', native: 'isiXhosa' },
  { id: 'af', label: 'Afrikaans', native: 'Afrikaans' },
  { id: 'yo', label: 'Yoruba', native: 'Èdè Yorùbá' },
  { id: 'ig', label: 'Igbo', native: 'Asụsụ Igbo' },
  { id: 'ha', label: 'Hausa', native: 'Harshen Hausa' },
  { id: 'am', label: 'Amharic', native: 'አማርኛ' },
  { id: 'so', label: 'Somali', native: 'Af-Soomaali' },
  { id: 'ln', label: 'Lingala', native: 'Lingála' },
  { id: 'ny', label: 'Chewa / Nyanja', native: 'Chichewa' },
  { id: 'tn', label: 'Tswana', native: 'Setswana' },
  { id: 'st', label: 'Sotho', native: 'Sesotho' },
  { id: 've', label: 'Venda', native: 'Tshivenḓa' },
  { id: 'ts', label: 'Tsonga / Shangaan', native: 'Xitsonga' },
  { id: 'bem', label: 'Bemba', native: 'Chibemba' },
  { id: 'to', label: 'Tonga', native: 'Chitonga' },
];

// ── Global Hubs & Region Presets ───────────────────────────────────────────────

const GLOBAL_PRESETS = [
  'Worldwide / Remote',
  'North America (US & Canada)',
  'United Kingdom & Ireland',
  'European Union',
  'Middle East & UAE',
  'Southern Africa',
  'East Africa',
  'West Africa',
  'Latin America',
  'Asia-Pacific',
];

const POPULAR_GLOBAL_CITIES = [
  'London, UK',
  'New York, USA',
  'Dubai, UAE',
  'Johannesburg, SA',
  'Harare, Zimbabwe',
  'Nairobi, Kenya',
  'Singapore',
  'Toronto, Canada',
  'Sydney, Australia',
  'São Paulo, Brazil',
  'Berlin, Germany',
  'Mumbai, India',
];

// ── Simple Trade Quick Examples ───────────────────────────────────────────────

const QUICK_EXAMPLES = [
  { label: 'Commodities & Grain', text: 'Wholesale supplier of bulk white maize, sugar beans, soybeans, cooking oil, and rice in 50kg bags.' },
  { label: 'Solar & Inverters', text: 'I supply 5kVA solar inverters, 48V lithium batteries, solar geysers, and commercial PV installations.' },
  { label: 'Freight & Haulage', text: 'Cross-border cargo freight, 30t flatbed superlink haulage, local courier dispatch, and warehousing.' },
  { label: 'Boreholes & Plumbing', text: 'Borehole siting, drilling, casing, submersible solar pumps, water tanks, and commercial plumbing.' },
  { label: 'Building Materials', text: 'Supplier of bulk cement, deformed steel bars, roofing sheets, timber, and construction hardware.' },
  { label: 'Software & Tech', text: 'Custom web platforms, mobile apps, enterprise IT infrastructure, hardware maintenance, and networking.' },
];

// ── 6 Progressive Steps ────────────────────────────────────────────────────────

type DiscoverStep =
  | 'name'         // Step 1: Business / User Name (Skippable)
  | 'languages'    // Step 2: Global Languages (Asked BEFORE AI extraction)
  | 'location'     // Step 3: Operating Region & Corridors (Skippable)
  | 'trade'        // Step 4: Core Trade Description (Required)
  | 'ai_response'  // Step 5: Conversational AI Understanding & Dictionary Expansion
  | 'ready';       // Step 6: Calibrated Radar Summary & Hand-off

const STEP_ORDER: DiscoverStep[] = [
  'name',
  'languages',
  'location',
  'trade',
  'ai_response',
  'ready',
];

interface ExtractedProfile {
  categories: string[];
  capabilities: string[];
  products: string[];
  keywords: string[];
}

// ── Gemini Capability Engine with Rich Buyer Intent Prompts ────────────────────

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  'AIzaSyBPMtdBw3WfPJdeuqi1CBE1541PslE8mio';

async function extractTradeWithIntelligence(
  description: string,
  languages: string[],
  location: string
): Promise<ExtractedProfile> {
  if (!GEMINI_API_KEY) {
    return localFallbackExtract(description, languages);
  }

  const prompt = `A merchant or business owner described what they supply or do:
"${description}"

Target Locations/Markets: ${location}
Operating Languages: ${languages.join(', ')}

You are building the Layer 0 and Layer 4 matching dictionary for an automated WhatsApp lead radar that scans group messages for BUYING REQUESTS.

In WhatsApp groups, real buyers don't talk like textbooks. They post fast, casual requests in (${languages.join(', ')}), often mixing colloquial slang, abbreviations, demand verbs, specifications, and regional terminology.

Extract a high-accuracy match profile:
1. "categories": 1-2 standard commercial sectors (e.g. "Wholesale & Agricultural Commodities", "Solar & Clean Energy", "Freight & Logistics").
2. "capabilities": 4-6 specific actionable services/products they offer.
3. "products": Specific equipment, commodities, materials, or model types.
4. "keywords": 30-50 normalized lowercase tokens that real customers write when looking to BUY this. Include:
   - Product variations, grades, packaging, specifications, and units (e.g. for grain: "white maize", "yellow corn", "50kg", "sacks", "tonnes", "bulk", "grain", "sugar beans", "soya", "moisture").
   - Real buyer intent verbs and RFQ demand markers in ALL selected languages (${languages.join(', ')}) (e.g. "looking for", "need supplier", "who sells", "in stock", "quote pls", "urgent", "dm price", plus exact local phrasing in the chosen languages like "busco", "recherche", "nditsvagireiwo", "compro", "nahitaji", "ari kutengesa", "mari yacho", "مطلوب").
   - Brand names, models, common misspellings, and industry trade slang.

Return ONLY valid JSON in this exact structure:
{
  "categories": ["..."],
  "capabilities": ["..."],
  "products": ["..."],
  "keywords": ["..."]
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.15 },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      return localFallbackExtract(description, languages);
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return localFallbackExtract(description, languages);

    const parsed = JSON.parse(raw);
    return {
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : ['Commercial Trade'],
      capabilities: Array.isArray(parsed.capabilities) && parsed.capabilities.length > 0
        ? parsed.capabilities
        : [description.slice(0, 40)],
      products: Array.isArray(parsed.products) ? parsed.products : [],
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0
        ? parsed.keywords.map((k: string) => k.toLowerCase().trim())
        : localFallbackExtract(description, languages).keywords,
    };
  } catch {
    return localFallbackExtract(description, languages);
  }
}

function localFallbackExtract(text: string, languages: string[]): ExtractedProfile {
  const clean = text.trim().toLowerCase();
  const tokens = clean
    .split(/[\s,./\-+]+/)
    .filter(w => w.length > 2 && !['with', 'from', 'have', 'need', 'that', 'this', 'your', 'provide', 'services'].includes(w));

  let categories = ['Commercial Trade'];
  let capabilities = [clean.slice(0, 45)];
  let extraKeywords: string[] = [
    'looking for', 'supplier', 'who has', 'price', 'cost', 'quote', 'bulk', 'urgent', 'in stock', 'delivery'
  ];

  if (clean.includes('solar') || clean.includes('inverter') || clean.includes('battery') || clean.includes('pv')) {
    categories = ['Solar & Clean Energy'];
    capabilities = ['Commercial Inverter Setup', 'Lithium Battery Storage', 'Solar PV Installation', 'System Maintenance', 'Solar Boreholes'];
    extraKeywords.push(
      'solar', 'inverter', '5kva', '10kva', 'lithium', 'battery', 'gel', 'pv', 'panels', 'backup', 'power',
      'magetsi', 'geyser', 'deye', 'sunsynk', 'growatt', 'monocrystalline', '48v', 'bms', 'load shedding'
    );
  } else if (clean.includes('food') || clean.includes('grain') || clean.includes('wholesale') || clean.includes('maize') || clean.includes('bean')) {
    categories = ['Wholesale & Agricultural Commodities'];
    capabilities = ['Bulk Commodity Supply', 'Grain Distribution', 'Foodstuffs Supply', 'Packaging Materials', 'Produce Sourcing'];
    extraKeywords.push(
      'wholesale', 'bulk', 'grain', 'maize', 'beans', 'sugar', 'cooking oil', 'rice', 'mealie', 'chibage',
      'nyimo', 'tonnes', 'fmcg', 'sacks', '50kg', 'bags', 'grade a', 'white maize', 'sugar beans', 'super refined', 'producer'
    );
  } else if (clean.includes('code') || clean.includes('app') || clean.includes('software') || clean.includes('web')) {
    categories = ['Software & Digital Tech'];
    capabilities = ['Mobile App Development', 'Web Platforms & APIs', 'IT Infrastructure', 'Cloud Systems'];
    extraKeywords.push(
      'app', 'software', 'website', 'dev', 'developer', 'react', 'mobile', 'api', 'database', 'system',
      'engineer', 'design', 'ui', 'hosting', 'domain', 'integration', 'frontend', 'backend'
    );
  } else if (clean.includes('truck') || clean.includes('haulage') || clean.includes('transport') || clean.includes('freight')) {
    categories = ['Freight & Logistics'];
    capabilities = ['Cross-Border Haulage', 'Local Courier Dispatch', 'Refrigerated Transport', 'Flatbed Loads'];
    extraKeywords.push(
      'truck', 'haulage', 'transport', 'freight', 'cargo', 'delivery', 'dispatch', '30t', 'triaxle', 'superlink',
      'cross-border', 'loads', 'empty leg', 'logistics', 'fleet', 'driver', 'rates per km', 'breakdown'
    );
  } else if (clean.includes('plumb') || clean.includes('drain') || clean.includes('pipe') || clean.includes('borehole')) {
    categories = ['Plumbing & Water Infrastructure'];
    capabilities = ['Borehole Siting & Pump Setup', 'Plumbing & Drainage', 'Water Tank Installation', 'Pipe Repairs'];
    extraKeywords.push(
      'plumber', 'plumbing', 'borehole', 'pump', 'pipes', 'tank', 'casing', 'drainage', 'leaks', 'submersible',
      'solar pump', 'booster', 'fittings', 'drilling', 'pressure', 'poly pipe'
    );
  }

  // Multilingual intent tokens
  if (languages.includes('Shona')) {
    extraKeywords.push('ndinoda', 'nditsvagireiwo', 'ari kutengesa', 'mari yacho', 'mutengo', 'zvinhu');
  }
  if (languages.includes('Spanish')) {
    extraKeywords.push('busco', 'compro', 'proveedor', 'precio', 'en bulto', 'disponible', 'cotización');
  }
  if (languages.includes('French')) {
    extraKeywords.push('recherche', 'besoin de', 'fournisseur', 'prix', 'en gros', 'devis', 'disponible');
  }
  if (languages.includes('Portuguese')) {
    extraKeywords.push('procuro', 'compro', 'fornecedor', 'preço', 'orçamento', 'disponível');
  }
  if (languages.includes('Swahili')) {
    extraKeywords.push('nahitaji', 'nani anauza', 'bei gani', 'gunia', 'gharama');
  }

  const allKeywords = Array.from(
    new Set([...tokens, ...extraKeywords, ...categories.map(c => c.toLowerCase())])
  );

  return {
    categories,
    capabilities,
    products: [],
    keywords: allKeywords,
  };
}

// ── Main Discover Screen ───────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const router = useRouter();
  const { capabilityProfile, setCapabilityProfile, setOnboardingStage } = useAuthStore();

  // Current Step in 6-step flow
  const [currentStep, setCurrentStep] = useState<DiscoverStep>('name');

  // Form State
  const [businessName, setBusinessName] = useState(capabilityProfile?.displayName || '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    capabilityProfile?.languages?.length ? capabilityProfile.languages : ['English']
  );
  const [languageSearch, setLanguageSearch] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    capabilityProfile?.serviceAreas?.length ? capabilityProfile.serviceAreas : ['Worldwide / Remote']
  );
  const [customLocation, setCustomLocation] = useState('');
  const [tradeDescription, setTradeDescription] = useState(capabilityProfile?.description || '');

  // AI Extraction State & Interactive Follow-ups
  const [extracted, setExtracted] = useState<ExtractedProfile | null>(null);
  const [activeCapabilities, setActiveCapabilities] = useState<string[]>(
    capabilityProfile?.capabilities || []
  );
  const [activeKeywords, setActiveKeywords] = useState<string[]>(
    capabilityProfile?.keywords || []
  );
  const [customWordInput, setCustomWordInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercent = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  // Personalized Entity Label
  const entityName = businessName.trim() || 'your business';

  // ── Sync State To Store Helper ────────────────────────────────────────────

  const syncStateToStore = useCallback(() => {
    const trimmedCustom = customLocation.trim();
    let locations = [...selectedLocations];
    if (trimmedCustom && !locations.includes(trimmedCustom)) {
      locations = [trimmedCustom, ...locations];
    }
    if (locations.length === 0) {
      locations = ['Worldwide / Remote'];
    }

    setCapabilityProfile({
      displayName: businessName.trim() || 'My Business',
      description: tradeDescription.trim(),
      languages: selectedLanguages.length > 0 ? selectedLanguages : ['English'],
      location: locations[0],
      serviceAreas: locations,
      categories: extracted?.categories || ['Commercial Trade'],
      capabilities: activeCapabilities.length > 0 ? activeCapabilities : [tradeDescription.slice(0, 40) || 'General Trade'],
      products: extracted?.products || [],
      keywords: activeKeywords.length > 0 ? activeKeywords : ['trade', 'sales', 'quotes'],
    });
  }, [
    businessName,
    tradeDescription,
    selectedLanguages,
    selectedLocations,
    customLocation,
    extracted,
    activeCapabilities,
    activeKeywords,
    setCapabilityProfile,
  ]);

  // ── Step Navigation ───────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    Haptics.selectionAsync();
    if (stepIndex > 0) {
      setCurrentStep(STEP_ORDER[stepIndex - 1]);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/onboarding/welcome');
      }
    }
  }, [stepIndex, router]);

  const goToNextStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If on location screen and typed something without clicking add, auto-add it!
    if (currentStep === 'location' && customLocation.trim()) {
      const trimmed = customLocation.trim();
      setSelectedLocations(prev => {
        const withoutWorldwide = prev.filter(l => l !== 'Worldwide / Remote');
        return withoutWorldwide.includes(trimmed) ? withoutWorldwide : [trimmed, ...withoutWorldwide];
      });
      setCustomLocation('');
    }

    syncStateToStore();

    if (stepIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[stepIndex + 1]);
    } else {
      handleFinalComplete();
    }
  }, [stepIndex, currentStep, customLocation, syncStateToStore]);

  // ── Step 4: AI Analysis with Tactile Haptic Reveal ────────────────────────

  const handleAnalyzeTrade = useCallback(async () => {
    if (tradeDescription.trim().length < 3) {
      setError('Please provide a brief description of what you supply or sell.');
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const primaryLoc = selectedLocations.join(', ') || 'Worldwide';

    try {
      const result = await extractTradeWithIntelligence(
        tradeDescription.trim(),
        selectedLanguages,
        primaryLoc
      );
      setExtracted(result);
      setActiveCapabilities(result.capabilities);
      setActiveKeywords(result.keywords);
      syncStateToStore();

      // Haptic celebration response
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentStep('ai_response');
    } catch {
      const fallback = localFallbackExtract(tradeDescription.trim(), selectedLanguages);
      setExtracted(fallback);
      setActiveCapabilities(fallback.capabilities);
      setActiveKeywords(fallback.keywords);
      syncStateToStore();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentStep('ai_response');
    } finally {
      setLoading(false);
    }
  }, [tradeDescription, selectedLanguages, selectedLocations, syncStateToStore]);

  // ── Final Hand-off ────────────────────────────────────────────────────────

  const handleFinalComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    syncStateToStore();
    setOnboardingStage('discovered');
    router.push('/onboarding/pair');
  }, [syncStateToStore, setOnboardingStage, router]);

  // ── Location Actions ──────────────────────────────────────────────────────

  const toggleLocation = useCallback((loc: string) => {
    Haptics.selectionAsync();
    setSelectedLocations(prev => {
      if (loc === 'Worldwide / Remote') {
        return ['Worldwide / Remote'];
      }
      const withoutWorldwide = prev.filter(l => l !== 'Worldwide / Remote');
      if (withoutWorldwide.includes(loc)) {
        const next = withoutWorldwide.filter(l => l !== loc);
        return next.length > 0 ? next : ['Worldwide / Remote'];
      } else {
        return [...withoutWorldwide, loc];
      }
    });
  }, []);

  const addCustomLocation = useCallback(() => {
    const trimmed = customLocation.trim();
    if (!trimmed) return;
    Haptics.selectionAsync();
    setSelectedLocations(prev => {
      const withoutWorldwide = prev.filter(l => l !== 'Worldwide / Remote');
      return withoutWorldwide.includes(trimmed) ? withoutWorldwide : [trimmed, ...withoutWorldwide];
    });
    setCustomLocation('');
  }, [customLocation]);

  // ── Language Actions ──────────────────────────────────────────────────────

  const toggleLanguage = useCallback((lang: string) => {
    Haptics.selectionAsync();
    setSelectedLanguages(prev =>
      prev.includes(lang) ? (prev.length > 1 ? prev.filter(l => l !== lang) : prev) : [...prev, lang]
    );
  }, []);

  const addCustomLanguage = useCallback((langName: string) => {
    const trimmed = langName.trim();
    if (!trimmed) return;
    Haptics.selectionAsync();
    setSelectedLanguages(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setLanguageSearch('');
    setIsLangDropdownOpen(false);
  }, []);

  // ── Capability & Keyword Actions ──────────────────────────────────────────

  const toggleCapability = useCallback((cap: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCapabilities(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  }, []);

  const removeKeyword = useCallback((kw: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveKeywords(prev => prev.filter(k => k !== kw));
  }, []);

  const addCustomWord = useCallback(() => {
    const trimmed = customWordInput.trim().toLowerCase();
    if (!trimmed) return;
    Haptics.selectionAsync();
    setActiveKeywords(prev => Array.from(new Set([...prev, trimmed])));
    setCustomWordInput('');
  }, [customWordInput]);

  const isSkippable = currentStep !== 'trade' && currentStep !== 'ready';

  // Language Filtering
  const filteredLanguages = useMemo(() => {
    const query = languageSearch.trim().toLowerCase();
    if (!query) return GLOBAL_LANGUAGES;
    return GLOBAL_LANGUAGES.filter(
      l => l.label.toLowerCase().includes(query) || l.native.toLowerCase().includes(query)
    );
  }, [languageSearch]);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Top Bar with Continuous Progress & Skip ───────────────────── */}
        <View className="px-6 pt-2 pb-3 border-b border-border bg-canvas">
          <View className="h-1 w-full bg-slate-200 rounded-full mb-3 overflow-hidden">
            <View
              className="h-full bg-brand-navy rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Pressable
              className="p-1 -ml-1 active:opacity-60"
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} color="#486581" strokeWidth={1.75} />
            </Pressable>

            <Text className="font-geist-medium text-xs text-content-muted">
              Step {stepIndex + 1} of {STEP_ORDER.length}
            </Text>

            {isSkippable ? (
              <Pressable
                className="p-1 active:opacity-60"
                onPress={goToNextStep}
                accessibilityRole="button"
                accessibilityLabel="Skip"
              >
                <Text className="font-geist-medium text-xs text-brand-blue">Skip</Text>
              </Pressable>
            ) : (
              <View className="w-8" />
            )}
          </View>
        </View>

        {/* ── Step Content ──────────────────────────────────────────────── */}
        <ScrollView
          contentContainerClassName="px-6 pt-6 pb-36"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── STEP 1: Name / Business Name (Skippable) ────────────────── */}
          {currentStep === 'name' && (
            <View>
              <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1.5">
                What is your name or business called?
              </Text>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-6">
                Mikana uses this to tailor your alerts and personalize proposal messages when you respond to buyers.
              </Text>

              <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5 shadow-xs mb-3">
                <User size={18} color="#829AB1" strokeWidth={1.75} />
                <TextInput
                  className="flex-1 ml-3 font-inter text-base text-content-primary"
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. Apex Commodities, or David"
                  placeholderTextColor="#829AB1"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={goToNextStep}
                />
              </View>
              <Text className="font-inter text-xs text-content-muted">
                Optional · You can adjust this anytime in Settings.
              </Text>
            </View>
          )}

          {/* ── STEP 2: Global Multilingual Selection (Dropdown + Custom) ───── */}
          {currentStep === 'languages' && (
            <View>
              <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1.5">
                Which languages do you trade in?
              </Text>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-4">
                Mikana monitors buyer requests, slang, and mixed code-switching in these languages across all your groups.
              </Text>

              {/* Selected Languages Row */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-geist-semibold text-xs text-content-muted uppercase tracking-wider">
                  Active Languages ({selectedLanguages.length})
                </Text>
              </View>

              {/* Selected Badges */}
              <View className="flex-row flex-wrap gap-1.5 mb-4">
                {selectedLanguages.map(lang => (
                  <View
                    key={lang}
                    className="flex-row items-center gap-1.5 bg-brand-blue-tint border border-brand-blue rounded-xl px-3 py-1.5 shadow-xs"
                  >
                    <Globe size={13} color="#1E56A0" strokeWidth={1.75} />
                    <Text className="font-geist-medium text-xs text-brand-blue">{lang}</Text>
                    {selectedLanguages.length > 1 && (
                      <Pressable onPress={() => toggleLanguage(lang)} className="p-0.5 ml-0.5">
                        <X size={11} color="#1E56A0" strokeWidth={2} />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>

              {/* Searchable Dropdown Input */}
              <View className="relative mb-2">
                <Pressable
                  className="flex-row items-center bg-surface border border-border rounded-xl px-3.5 py-3 shadow-xs"
                  onPress={() => setIsLangDropdownOpen(prev => !prev)}
                >
                  <Search size={15} color="#829AB1" strokeWidth={1.75} />
                  <TextInput
                    className="flex-1 ml-2 font-inter text-xs text-content-primary"
                    value={languageSearch}
                    onChangeText={text => {
                      setLanguageSearch(text);
                      if (!isLangDropdownOpen) setIsLangDropdownOpen(true);
                    }}
                    onFocus={() => setIsLangDropdownOpen(true)}
                    placeholder="Search languages or type custom..."
                    placeholderTextColor="#829AB1"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      if (languageSearch.trim()) {
                        addCustomLanguage(languageSearch.trim());
                      }
                    }}
                  />
                  {languageSearch.length > 0 ? (
                    <Pressable onPress={() => setLanguageSearch('')} className="p-1">
                      <X size={13} color="#829AB1" />
                    </Pressable>
                  ) : (
                    <ChevronDown size={16} color="#829AB1" />
                  )}
                </Pressable>

                {/* Dropdown Menu */}
                {isLangDropdownOpen && (
                  <View className="mt-1.5 bg-surface border border-border rounded-xl max-h-56 shadow-md overflow-hidden">
                    <ScrollView
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      className="p-1"
                    >
                      {/* If typed language is not in preset, offer to add as custom! */}
                      {languageSearch.trim().length > 0 &&
                        !GLOBAL_LANGUAGES.some(
                          l => l.label.toLowerCase() === languageSearch.trim().toLowerCase()
                        ) && (
                          <Pressable
                            className="flex-row items-center gap-2 p-2.5 rounded-lg bg-brand-blue-tint mb-1 active:opacity-80"
                            onPress={() => addCustomLanguage(languageSearch.trim())}
                          >
                            <Plus size={14} color="#1E56A0" strokeWidth={2} />
                            <Text className="font-geist-medium text-xs text-brand-blue">
                              Add "{languageSearch.trim()}" as custom language
                            </Text>
                          </Pressable>
                        )}

                      {/* Filtered Preset Languages */}
                      {filteredLanguages.map(lang => {
                        const isSelected = selectedLanguages.includes(lang.label);
                        return (
                          <Pressable
                            key={lang.id}
                            className={`flex-row items-center justify-between p-2.5 rounded-lg ${
                              isSelected ? 'bg-brand-blue-tint' : 'active:bg-surface-elevated'
                            }`}
                            onPress={() => {
                              toggleLanguage(lang.label);
                              setLanguageSearch('');
                            }}
                          >
                            <View className="flex-row items-center gap-2">
                              <Globe size={13} color={isSelected ? '#1E56A0' : '#829AB1'} strokeWidth={1.5} />
                              <Text
                                className={`font-geist-medium text-xs ${
                                  isSelected ? 'text-brand-blue font-geist-semibold' : 'text-content-primary'
                                }`}
                              >
                                {lang.label}
                              </Text>
                              {lang.native !== lang.label && (
                                <Text className="font-inter text-[10px] text-content-muted">
                                  ({lang.native})
                                </Text>
                              )}
                            </View>
                            {isSelected && <Check size={14} color="#1E56A0" strokeWidth={2.5} />}
                          </Pressable>
                        );
                      })}

                      {filteredLanguages.length === 0 && !languageSearch.trim() && (
                        <View className="p-3 items-center">
                          <Text className="font-inter text-xs text-content-muted">No languages found</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              <Text className="font-inter text-[11px] text-content-muted mt-1">
                You can select multiple languages. Custom dialects will be used for keyword matching.
              </Text>
            </View>
          )}

          {/* ── STEP 3: Global Locations & Trading Corridors ───────────── */}
          {currentStep === 'location' && (
            <View>
              <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1.5">
                Where does {entityName} operate?
              </Text>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-4">
                Opportunities within your delivery areas, corridors, or remote coverage receive highest match priority.
              </Text>

              {/* Active Locations Pills */}
              {selectedLocations.length > 0 && (
                <View className="mb-4 p-3 bg-brand-blue-tint border border-brand-blue-border rounded-xl">
                  <Text className="font-geist-semibold text-[11px] text-brand-blue uppercase tracking-wider mb-2">
                    Active Coverage Areas ({selectedLocations.length})
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {selectedLocations.map(loc => (
                      <View
                        key={loc}
                        className="flex-row items-center gap-1 bg-surface border border-brand-blue rounded-lg px-2.5 py-1"
                      >
                        <MapPin size={11} color="#1E56A0" strokeWidth={2} />
                        <Text className="font-geist-medium text-xs text-brand-blue">{loc}</Text>
                        <Pressable onPress={() => toggleLocation(loc)} className="p-0.5 ml-0.5">
                          <X size={11} color="#1E56A0" strokeWidth={2} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Add Any Custom Location */}
              <Text className="font-geist-semibold text-xs text-content-muted uppercase tracking-wider mb-2">
                Add your city, region, or corridor:
              </Text>
              <View className="flex-row items-center gap-2 mb-4">
                <TextInput
                  className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-3 font-inter text-xs text-content-primary shadow-xs"
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  placeholder="e.g. London, New York, Harare, Dubai, São Paulo, Sydney..."
                  placeholderTextColor="#829AB1"
                  returnKeyType="done"
                  onSubmitEditing={addCustomLocation}
                />
                <Pressable
                  className="bg-brand-navy px-4 py-3 rounded-xl flex-row items-center gap-1 active:opacity-90"
                  onPress={addCustomLocation}
                >
                  <Plus size={14} color="#FFFFFF" strokeWidth={2} />
                  <Text className="font-geist-medium text-xs text-content-inverse">Add</Text>
                </Pressable>
              </View>

              {/* Global Regions & Corridors */}
              <Text className="font-geist-semibold text-xs text-content-muted uppercase tracking-wider mb-2">
                Global Regions:
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {GLOBAL_PRESETS.map(preset => {
                  const isSelected = selectedLocations.includes(preset);
                  return (
                    <Pressable
                      key={preset}
                      className={`flex-row items-center gap-1.5 border rounded-full px-3.5 py-2 ${
                        isSelected
                          ? 'bg-brand-blue border-brand-navy'
                          : 'bg-surface border-border active:bg-surface-elevated'
                      }`}
                      onPress={() => toggleLocation(preset)}
                    >
                      <MapPin
                        size={12}
                        color={isSelected ? '#FFFFFF' : '#829AB1'}
                        strokeWidth={1.5}
                      />
                      <Text
                        className={`font-geist-medium text-xs ${
                          isSelected ? 'text-white font-geist-semibold' : 'text-content-secondary'
                        }`}
                      >
                        {preset}
                      </Text>
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Popular Hubs */}
              <Text className="font-geist-semibold text-xs text-content-muted uppercase tracking-wider mb-2">
                Major Business Hubs:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {POPULAR_GLOBAL_CITIES.map(city => {
                  const isSelected = selectedLocations.includes(city);
                  return (
                    <Pressable
                      key={city}
                      className={`flex-row items-center gap-1.5 border rounded-full px-3 py-1.5 ${
                        isSelected
                          ? 'bg-brand-blue border-brand-navy'
                          : 'bg-surface border-border active:bg-surface-elevated'
                      }`}
                      onPress={() => toggleLocation(city)}
                    >
                      <Text
                        className={`font-geist-medium text-xs ${
                          isSelected ? 'text-white font-geist-semibold' : 'text-content-secondary'
                        }`}
                      >
                        {city}
                      </Text>
                      {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── STEP 4: Core Trade (Zero Fluff, Real Input) ─────────────── */}
          {currentStep === 'trade' && (
            <View>
              <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1.5">
                What does {entityName} supply or sell?
              </Text>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-4">
                Describe your offerings in everyday words, regional terms, or any language.
              </Text>

              {/* Pure Clean Text Area */}
              <TextInput
                className="bg-surface border border-border rounded-2xl p-4 font-inter text-sm text-content-primary leading-5 min-h-[140px] shadow-xs mb-3"
                value={tradeDescription}
                onChangeText={text => {
                  setTradeDescription(text);
                  if (error) setError(null);
                }}
                placeholder="e.g. I supply bulk white maize, sugar beans, and soybeans in 50kg bags... or 5kVA solar inverters, lithium batteries, and electrical installations..."
                placeholderTextColor="#829AB1"
                multiline
                numberOfLines={5}
                autoFocus
                textAlignVertical="top"
                returnKeyType="done"
              />

              {error && <Text className="font-inter text-xs text-status-rose mb-3">{error}</Text>}

              {/* Clean Quick Examples */}
              <Text className="font-geist-medium text-xs text-content-muted mb-2">
                Quick examples:
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                {QUICK_EXAMPLES.map(item => (
                  <Pressable
                    key={item.label}
                    className="bg-surface border border-border rounded-lg px-3 py-1.5 active:bg-surface-elevated"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTradeDescription(item.text);
                      if (error) setError(null);
                    }}
                  >
                    <Text className="font-inter text-xs text-content-secondary">{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ── STEP 5: Conversational AI Understanding & Deep Dictionary ─── */}
          {currentStep === 'ai_response' && (
            <View>
              {/* Intelligent Assistant Conversational Reply Card */}
              <View className="bg-brand-blue-tint border border-brand-blue-border rounded-2xl p-5 mb-5">
                <View className="flex-row items-center gap-2 mb-2">
                  <Sparkles size={18} color="#1E56A0" strokeWidth={2} />
                  <Text className="font-geist-bold text-base text-brand-blue">
                    Radar calibrated for {entityName}
                  </Text>
                </View>
                <Text className="font-inter text-xs text-content-primary leading-5">
                  I identified your primary sector in{' '}
                  <Text className="font-geist-semibold text-brand-blue">
                    {extracted?.categories?.[0] || 'Commercial Trade'}
                  </Text>
                  . Mikana will scan WhatsApp conversations across{' '}
                  <Text className="font-geist-medium">
                    {selectedLanguages.join(', ')}
                  </Text>{' '}
                  for real-time buyer demand signals and buyer RFQs.
                </Text>
              </View>

              {/* Interactive Follow-up: Monitored Capabilities */}
              <View className="mb-5">
                <Text className="font-geist-semibold text-xs text-content-muted uppercase tracking-wider mb-2">
                  Monitored Offerings & Capabilities
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {activeCapabilities.map(cap => (
                    <Pressable
                      key={cap}
                      className="flex-row items-center gap-1.5 bg-surface border border-brand-blue rounded-full px-3.5 py-2 active:opacity-70"
                      onPress={() => toggleCapability(cap)}
                    >
                      <Check size={12} color="#1E56A0" strokeWidth={2.5} />
                      <Text className="font-geist-medium text-xs text-brand-blue">{cap}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Match Triggers & Buyer Demand Signals */}
              <View className="mb-4">
                <Text className="font-geist-semibold text-xs text-content-muted uppercase tracking-wider mb-1.5">
                  Match Trigger Dictionary ({activeKeywords.length} terms)
                </Text>
                <Text className="font-inter text-xs text-content-secondary mb-3">
                  These product tokens, packaging specs, and buyer request phrases trigger high-priority alerts:
                </Text>

                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {activeKeywords.slice(0, 30).map(kw => (
                    <View
                      key={kw}
                      className="flex-row items-center gap-1 bg-surface border border-border rounded-md px-2.5 py-1"
                    >
                      <Text className="font-inter text-xs text-content-primary">{kw}</Text>
                      <Pressable onPress={() => removeKeyword(kw)} className="p-0.5">
                        <X size={11} color="#829AB1" strokeWidth={2} />
                      </Pressable>
                    </View>
                  ))}
                  {activeKeywords.length > 30 && (
                    <View className="bg-surface-elevated border border-border rounded-md px-2 py-1">
                      <Text className="font-inter text-xs text-content-muted">
                        +{activeKeywords.length - 30} more
                      </Text>
                    </View>
                  )}
                </View>

                {/* Add Custom Term Field */}
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 font-inter text-xs text-content-primary"
                    value={customWordInput}
                    onChangeText={setCustomWordInput}
                    placeholder="Add specific slang, model, brand, or phrase..."
                    placeholderTextColor="#829AB1"
                    returnKeyType="done"
                    onSubmitEditing={addCustomWord}
                  />
                  <Pressable
                    className="bg-brand-navy px-4 py-2.5 rounded-xl flex-row items-center gap-1"
                    onPress={addCustomWord}
                  >
                    <Plus size={14} color="#FFFFFF" strokeWidth={2} />
                    <Text className="font-geist-medium text-xs text-content-inverse">Add</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* ── STEP 6: Final Ready & Summary Card ──────────────────────── */}
          {currentStep === 'ready' && (
            <View>
              <View className="flex-row items-center gap-2 mb-1.5">
                <CheckCircle2 size={22} color="#1E56A0" strokeWidth={2} />
                <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight">
                  Ready to Connect
                </Text>
              </View>
              <Text className="font-inter text-sm leading-5 text-content-secondary mb-6">
                Your trade filters and match dictionary are primed. Connect WhatsApp to start catching live buyer RFQs in your groups.
              </Text>

              {/* Linear-style summary card */}
              <View className="bg-surface border border-border rounded-2xl p-5 shadow-xs mb-6">
                <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
                  <View className="flex-row items-center gap-2">
                    <User size={15} color="#486581" strokeWidth={1.75} />
                    <Text className="font-geist-medium text-xs text-content-secondary">Business Profile</Text>
                  </View>
                  <Text className="font-geist-semibold text-xs text-content-primary">
                    {businessName.trim() || 'My Business'}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
                  <View className="flex-row items-center gap-2">
                    <Briefcase size={15} color="#486581" strokeWidth={1.75} />
                    <Text className="font-geist-medium text-xs text-content-secondary">Primary Sector</Text>
                  </View>
                  <Text className="font-geist-semibold text-xs text-brand-blue">
                    {extracted?.categories?.[0] || 'Commercial Trade'}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
                  <View className="flex-row items-center gap-2">
                    <Layers size={15} color="#486581" strokeWidth={1.75} />
                    <Text className="font-geist-medium text-xs text-content-secondary">Active Dictionary</Text>
                  </View>
                  <Text className="font-geist-semibold text-xs text-content-primary">
                    {activeKeywords.length} triggers · {activeCapabilities.length} capabilities
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Globe size={15} color="#486581" strokeWidth={1.75} />
                    <Text className="font-geist-medium text-xs text-content-secondary">Languages & Coverage</Text>
                  </View>
                  <Text className="font-geist-semibold text-xs text-content-primary">
                    {selectedLanguages.length} languages · {selectedLocations[0] || 'Worldwide'}
                  </Text>
                </View>
              </View>

              <View className="p-4 bg-brand-blue-tint border border-brand-blue-border rounded-xl">
                <Text className="font-geist-semibold text-xs text-brand-blue mb-1">
                  Next: WhatsApp Link Console
                </Text>
                <Text className="font-inter text-xs text-content-secondary leading-4">
                  Scan the live QR code or enter your 8-digit code to start monitoring your selected trade groups.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Docked Bottom CTA Bar ─────────────────────────────────────── */}
        <View className="absolute bottom-0 left-0 right-0 px-6 pt-3 pb-6 border-t border-border bg-canvas shadow-lg">
          {currentStep === 'trade' ? (
            <Pressable
              className={`flex-row items-center justify-center gap-2.5 bg-brand-navy py-4 rounded-xl border border-brand-navy-dark ${
                tradeDescription.trim().length < 3 || loading
                  ? 'opacity-40'
                  : 'active:scale-[0.98] active:opacity-95'
              }`}
              onPress={handleAnalyzeTrade}
              disabled={tradeDescription.trim().length < 3 || loading}
              accessibilityRole="button"
              accessibilityLabel="Calibrate Radar"
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="font-geist-semibold text-sm text-content-inverse">
                    Calibrating Radar...
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="font-geist-semibold text-sm text-content-inverse tracking-wide">
                    Calibrate Radar
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.25} />
                </>
              )}
            </Pressable>
          ) : currentStep === 'ready' ? (
            <Pressable
              className="flex-row items-center justify-center gap-2.5 bg-brand-navy py-4 rounded-xl border border-brand-navy-dark active:scale-[0.98] active:opacity-95"
              onPress={handleFinalComplete}
              accessibilityRole="button"
              accessibilityLabel="Connect WhatsApp"
            >
              <Text className="font-geist-semibold text-sm text-content-inverse tracking-wide">
                Connect WhatsApp
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.25} />
            </Pressable>
          ) : (
            <Pressable
              className="flex-row items-center justify-center gap-2.5 bg-brand-navy py-4 rounded-xl border border-brand-navy-dark active:scale-[0.98] active:opacity-95"
              onPress={goToNextStep}
              accessibilityRole="button"
              accessibilityLabel="Continue"
            >
              <Text className="font-geist-semibold text-sm text-content-inverse tracking-wide">
                Continue
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.25} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
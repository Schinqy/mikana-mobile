import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Globe,
  Sparkles,
  Save,
  Check,
  Languages,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useCatalogStore } from '../../src/store/useCatalogStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function BusinessProfileModal() {
  const router = useRouter();
  const { profile, updateProfile } = useCatalogStore();
  const { whatsappLinkedPhone, setWhatsAppConnected } = useSettingsStore();
  const { capabilityProfile, setCapabilityProfile } = useAuthStore();

  const [businessName, setBusinessName] = useState(
    profile.businessName || capabilityProfile?.displayName || ''
  );
  const [tagline, setTagline] = useState(
    profile.tagline || capabilityProfile?.description || ''
  );
  const [industry, setIndustry] = useState(
    profile.industry || capabilityProfile?.categories?.[0] || 'Commercial Trade'
  );
  const [location, setLocation] = useState(
    profile.location || capabilityProfile?.location || 'Harare'
  );
  const [serviceAreas, setServiceAreas] = useState(
    profile.serviceAreas?.join(', ') || capabilityProfile?.serviceAreas?.join(', ') || 'Nationwide'
  );
  const [languages, setLanguages] = useState(
    profile.languages?.join(', ') || capabilityProfile?.languages?.join(', ') || 'English'
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    profile.whatsappNumber || whatsappLinkedPhone || ''
  );
  const [customPitchGuidelines, setCustomPitchGuidelines] = useState(
    profile.customPitchGuidelines || ''
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const parsedAreas = serviceAreas
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const parsedLanguages = languages
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Save to catalog store
    updateProfile({
      businessName: businessName.trim(),
      tagline: tagline.trim(),
      industry: industry.trim(),
      location: location.trim(),
      serviceAreas: parsedAreas.length > 0 ? parsedAreas : [location.trim()],
      languages: parsedLanguages.length > 0 ? parsedLanguages : ['English'],
      whatsappNumber: whatsappNumber.trim(),
      customPitchGuidelines: customPitchGuidelines.trim(),
    });

    // Also update settings store if WhatsApp phone was modified
    if (whatsappNumber.trim()) {
      setWhatsAppConnected(true, whatsappNumber.trim());
    }

    // Sync to capabilityProfile in auth store
    if (capabilityProfile) {
      setCapabilityProfile({
        ...capabilityProfile,
        displayName: businessName.trim() || capabilityProfile.displayName,
        description: tagline.trim() || capabilityProfile.description,
        location: location.trim() || capabilityProfile.location,
        serviceAreas: parsedAreas.length > 0 ? parsedAreas : capabilityProfile.serviceAreas,
        languages: parsedLanguages.length > 0 ? parsedLanguages : capabilityProfile.languages,
      });
    }

    setIsSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setIsSaved(false);
      router.back();
    }, 400);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-canvas">
        <View>
          <Text className="font-geist-bold text-lg text-content-heading">
            Business Profile
          </Text>
          <Text className="font-inter text-xs text-content-secondary">
            Identity, locations, and WhatsApp contact details
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-surface-elevated items-center justify-center active:bg-slate-200"
          hitSlop={8}
        >
          <X size={18} color="#486581" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-5 pb-12"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Section 1: Business Identity ───────────────────────────────────── */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Building2 size={15} color="#0B2545" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
              Trade Identity
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 gap-3.5 shadow-xs">
            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Business / Trader Name
              </Text>
              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Apex Hardware & Spares"
                placeholderTextColor="#829AB1"
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5"
              />
            </View>

            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Tagline & Specialty
              </Text>
              <TextInput
                value={tagline}
                onChangeText={setTagline}
                placeholder="e.g. Wholesale commercial auto spares and replacement units"
                placeholderTextColor="#829AB1"
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5"
                multiline
              />
            </View>

            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Industry / Category
              </Text>
              <TextInput
                value={industry}
                onChangeText={setIndustry}
                placeholder="e.g. Auto Parts & Hardware"
                placeholderTextColor="#829AB1"
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5"
              />
            </View>
          </View>
        </View>

        {/* ── Section 2: Location & Coverage ─────────────────────────────────── */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <MapPin size={15} color="#0B2545" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
              Location & Coverage
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 gap-3.5 shadow-xs">
            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Primary Operating City / Hub
              </Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Harare, Sandton, Nairobi, Dubai"
                placeholderTextColor="#829AB1"
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5"
              />
            </View>

            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Service Areas (comma-separated)
              </Text>
              <TextInput
                value={serviceAreas}
                onChangeText={setServiceAreas}
                placeholder="e.g. Harare, Bulawayo, Mutare, Nationwide"
                placeholderTextColor="#829AB1"
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5"
              />
            </View>

            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Languages (comma-separated)
              </Text>
              <TextInput
                value={languages}
                onChangeText={setLanguages}
                placeholder="e.g. English, Shona, Ndebele"
                placeholderTextColor="#829AB1"
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5"
              />
            </View>
          </View>
        </View>

        {/* ── Section 3: Contact & AI Guidelines ─────────────────────────────── */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Phone size={15} color="#0B2545" strokeWidth={2} />
            <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
              Contact & Response Guidelines
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 gap-3.5 shadow-xs">
            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                WhatsApp Contact Number
              </Text>
              <TextInput
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                placeholder="e.g. +263771234567 or +27821234567"
                placeholderTextColor="#829AB1"
                keyboardType="phone-pad"
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5"
              />
            </View>

            <View>
              <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                Custom AI Pitch & Quote Guidelines
              </Text>
              <TextInput
                value={customPitchGuidelines}
                onChangeText={setCustomPitchGuidelines}
                placeholder="e.g. Always mention 1-year replacement warranty and free delivery on orders over $500"
                placeholderTextColor="#829AB1"
                multiline
                numberOfLines={3}
                className="font-inter text-sm text-content-primary bg-surface-elevated border border-border rounded-xl px-3.5 py-2.5 min-h-[72px]"
              />
            </View>
          </View>
        </View>

        {/* ── Save Action Button ────────────────────────────────────────────── */}
        <Pressable
          onPress={handleSave}
          className="w-full bg-brand-navy py-4 rounded-xl flex-row items-center justify-center gap-2 border border-brand-navy-dark active:opacity-95 shadow-xs"
        >
          {isSaved ? (
            <>
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="font-geist-semibold text-sm text-white">
                Profile Saved!
              </Text>
            </>
          ) : (
            <>
              <Save size={16} color="#FFFFFF" strokeWidth={2} />
              <Text className="font-geist-semibold text-sm text-white">
                Save Profile Changes
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

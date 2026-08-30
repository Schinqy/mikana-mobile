import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  geminiApiKey: string;
  geminiModel: string;
  revenueCatApiKey: string;
  isWhatsAppConnected: boolean;
  whatsappLinkedPhone: string;
  whatsappRelayUrl: string;
  radarChannels: string[];
  enableSoundHaptics: boolean;
  enablePushNotifications: boolean;

  // Actions
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  setRevenueCatApiKey: (key: string) => void;
  setWhatsAppConnected: (connected: boolean, phone?: string) => void;
  setWhatsappRelayUrl: (url: string) => void;
  addRadarChannel: (channel: string) => void;
  removeRadarChannel: (channel: string) => void;
  toggleHaptics: () => void;
  togglePushNotifications: () => void;
}

const DEFAULT_RADAR_CHANNELS = [
  'B2B Contractors & Commerce Network',
  'Tech Startups & Founders Hub',
  'Creative Marketplace & Freelancers',
  'FMCG & Wholesale Buyers Hub',
  'Commercial Solar & Energy Leads',
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geminiApiKey: '',
      geminiModel: 'gemini-3.5-flash-lite',
      revenueCatApiKey: 'appl_mock_revenuecat_key_shipaton_2026',
      isWhatsAppConnected: false,
      whatsappLinkedPhone: '',
      whatsappRelayUrl: 'http://localhost:3005',
      radarChannels: DEFAULT_RADAR_CHANNELS,
      enableSoundHaptics: true,
      enablePushNotifications: true,

      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setGeminiModel: (geminiModel) => set({ geminiModel }),
      setRevenueCatApiKey: (revenueCatApiKey) => set({ revenueCatApiKey }),
      setWhatsAppConnected: (isWhatsAppConnected, whatsappLinkedPhone = '') =>
        set({ isWhatsAppConnected, whatsappLinkedPhone }),
      setWhatsappRelayUrl: (whatsappRelayUrl) => set({ whatsappRelayUrl }),
      addRadarChannel: (channel) =>
        set((state) => ({
          radarChannels: [...state.radarChannels.filter((c) => c !== channel), channel],
        })),
      removeRadarChannel: (channel) =>
        set((state) => ({
          radarChannels: state.radarChannels.filter((c) => c !== channel),
        })),
      toggleHaptics: () =>
        set((state) => ({ enableSoundHaptics: !state.enableSoundHaptics })),
      togglePushNotifications: () =>
        set((state) => ({ enablePushNotifications: !state.enablePushNotifications })),
    }),
    {
      name: 'mikana-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

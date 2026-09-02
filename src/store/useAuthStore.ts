import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase/client';

export type OnboardingStage = 'welcome' | 'discovered' | 'paired' | 'groups' | 'completed';

interface UserCapabilityProfile {
  displayName: string;
  description: string;
  location: string;
  serviceAreas: string[];
  categories: string[];
  capabilities: string[];
  products: string[];
  keywords: string[];
}

interface AuthState {
  // Auth
  session: any | null;
  userId: string | null;
  isLoading: boolean;

  // Onboarding progress
  onboardingStage: OnboardingStage;
  onboardingCompleted: boolean;

  // Capability profile built during onboarding
  capabilityProfile: UserCapabilityProfile | null;

  // Actions
  setSession: (session: any | null) => void;
  setOnboardingStage: (stage: OnboardingStage) => void;
  completeOnboarding: () => void;
  setCapabilityProfile: (profile: UserCapabilityProfile) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

const EMPTY_PROFILE: UserCapabilityProfile = {
  displayName: '',
  description: '',
  location: '',
  serviceAreas: [],
  categories: [],
  capabilities: [],
  products: [],
  keywords: [],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      userId: null,
      isLoading: true,
      onboardingStage: 'welcome',
      onboardingCompleted: false,
      capabilityProfile: null,

      setSession: (session) =>
        set({
          session,
          userId: session?.user?.id ?? null,
          isLoading: false,
        }),

      setOnboardingStage: (stage) => set({ onboardingStage: stage }),

      completeOnboarding: () =>
        set({ onboardingStage: 'completed', onboardingCompleted: true }),

      setCapabilityProfile: (profile) => set({ capabilityProfile: profile }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          session: null,
          userId: null,
          onboardingStage: 'welcome',
          onboardingCompleted: false,
          capabilityProfile: null,
        });
      },

      initialize: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        set({
          session,
          userId: session?.user?.id ?? null,
          isLoading: false,
        });

        // Listen for auth state changes (sign in/out, token refresh)
        supabase.auth.onAuthStateChange((_event, session) => {
          set({
            session,
            userId: session?.user?.id ?? null,
            isLoading: false,
          });
        });
      },
    }),
    {
      name: 'mikana-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist onboarding state — session is re-fetched from Supabase on mount
      partialize: (state) => ({
        onboardingStage: state.onboardingStage,
        onboardingCompleted: state.onboardingCompleted,
        capabilityProfile: state.capabilityProfile,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionStatus, SubscriptionTier } from '../types/subscription';

interface SubscriptionState {
  status: SubscriptionStatus;
  isPaywallVisible: boolean;

  // Actions
  setTier: (tier: SubscriptionTier) => void;
  setPaywallVisible: (visible: boolean) => void;
  toggleSandbox: () => void;
  consumeLeadCredit: () => boolean;
  addBoostCredits: (amount: number) => void;
  resetWeeklyLimit: () => void;
}

const DEFAULT_STATUS: SubscriptionStatus = {
  tier: 'free',
  isPro: false,
  isAgency: false,
  expirationDate: null,
  leadsRemainingThisWeek: 5,
  boostCredits: 3,
  isSandboxMode: true, // Sandbox mode enabled by default for seamless hackathon testing & demos
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      status: DEFAULT_STATUS,
      isPaywallVisible: false,

      setTier: (tier) => {
        const isPro = tier === 'pro_monthly' || tier === 'pro_annual' || tier === 'agency';
        const isAgency = tier === 'agency';
        
        set((state) => ({
          status: {
            ...state.status,
            tier,
            isPro,
            isAgency,
            expirationDate: isPro ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() : null,
          },
          isPaywallVisible: false,
        }));
      },

      setPaywallVisible: (isPaywallVisible) => set({ isPaywallVisible }),

      toggleSandbox: () => {
        set((state) => ({
          status: {
            ...state.status,
            isSandboxMode: !state.status.isSandboxMode,
          },
        }));
      },

      consumeLeadCredit: () => {
        const { status } = get();
        if (status.isPro) return true; // Unlimited for Pro

        if (status.leadsRemainingThisWeek > 0) {
          set((state) => ({
            status: {
              ...state.status,
              leadsRemainingThisWeek: state.status.leadsRemainingThisWeek - 1,
            },
          }));
          return true;
        }

        // Out of leads -> trigger paywall
        set({ isPaywallVisible: true });
        return false;
      },

      addBoostCredits: (amount) => {
        set((state) => ({
          status: {
            ...state.status,
            boostCredits: state.status.boostCredits + amount,
          },
        }));
      },

      resetWeeklyLimit: () => {
        set((state) => ({
          status: {
            ...state.status,
            leadsRemainingThisWeek: 5,
          },
        }));
      },
    }),
    {
      name: 'mikana-subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

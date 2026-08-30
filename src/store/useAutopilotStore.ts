import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AutopilotConfig, AutopilotLog } from '../types/autopilot';

interface AutopilotState {
  config: AutopilotConfig;
  logs: AutopilotLog[];

  // Actions
  toggleAutopilot: (enabled?: boolean) => void;
  updateConfig: (updates: Partial<AutopilotConfig>) => void;
  addLog: (log: Omit<AutopilotLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  resetDailyCount: () => void;
}

const DEFAULT_CONFIG: AutopilotConfig = {
  isEnabled: true,
  minimumMatchScore: 85,
  dailyReplyLimit: 15,
  repliesSentToday: 4,
  autoQuoteAllowed: true,
  includePortfolioLinks: true,
  blacklistedKeywords: ['spam', 'crypto', 'giveaway', 'forex', 'mlm'],
  whitelistChannels: ['B2B Contractors & Commerce Network', 'Tech Startups & Founders Hub'],
  lastActiveTimestamp: new Date().toISOString(),
};

const INITIAL_LOGS: AutopilotLog[] = [
  {
    id: 'log-001',
    leadId: 'lead-002',
    leadSummary: 'React Native / Expo MVP finalization ($2,500 budget)',
    senderContact: '+14159082214 (Alex Rivera)',
    channel: 'Tech Startups & Founders Hub',
    dispatchedPitch: 'Hi Alex! Saw your request in Tech Founders Hub. We specialize in rapid Expo & React Native deployments with zero-rejection store approvals...',
    matchScore: 98,
    status: 'dispatched',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'log-002',
    leadId: 'lead-raw-982',
    leadSummary: 'Inquiry for secondhand laptop parts ($50)',
    senderContact: '+27712398471',
    channel: 'General Classifieds Chat',
    dispatchedPitch: '',
    matchScore: 42,
    status: 'skipped_score',
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  }
];

export const useAutopilotStore = create<AutopilotState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      logs: INITIAL_LOGS,

      toggleAutopilot: (enabled) => {
        set((state) => ({
          config: {
            ...state.config,
            isEnabled: enabled !== undefined ? enabled : !state.config.isEnabled,
            lastActiveTimestamp: new Date().toISOString(),
          },
        }));
      },

      updateConfig: (updates) => {
        set((state) => ({
          config: {
            ...state.config,
            ...updates,
            lastActiveTimestamp: new Date().toISOString(),
          },
        }));
      },

      addLog: (logData) => {
        const newLog: AutopilotLog = {
          ...logData,
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          logs: [newLog, ...state.logs],
          config: {
            ...state.config,
            repliesSentToday:
              logData.status === 'dispatched'
                ? state.config.repliesSentToday + 1
                : state.config.repliesSentToday,
            lastActiveTimestamp: new Date().toISOString(),
          },
        }));
      },

      clearLogs: () => {
        set({ logs: [] });
      },

      resetDailyCount: () => {
        set((state) => ({
          config: { ...state.config, repliesSentToday: 0 },
        }));
      },
    }),
    {
      name: 'mikana-autopilot-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

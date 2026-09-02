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
  isEnabled: false,
  minimumMatchScore: 85,
  dailyReplyLimit: 15,
  repliesSentToday: 0,
  autoQuoteAllowed: true,
  includePortfolioLinks: true,
  blacklistedKeywords: ['spam', 'crypto', 'giveaway', 'forex', 'mlm'],
  whitelistChannels: [],
  lastActiveTimestamp: new Date().toISOString(),
};

const INITIAL_LOGS: AutopilotLog[] = [];

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

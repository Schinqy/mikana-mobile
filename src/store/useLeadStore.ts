import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lead, DealStage, LeadFilter } from '../types/lead';

interface LeadState {
  leads: Lead[];
  filter: LeadFilter;
  searchQuery: string;
  selectedLeadId: string | null;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  updateStage: (id: string, stage: DealStage) => void;
  deleteLead: (id: string) => void;
  setFilter: (filter: LeadFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedLeadId: (id: string | null) => void;
  getFilteredLeads: () => Lead[];
  simulateIncomingLead: () => Lead;
  resetToSampleData: () => void;
  clearAllLeads: () => void;
}

const INITIAL_SAMPLE_LEADS: Lead[] = [];

const SIMULATED_LEAD_POOL: Array<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>> = [];

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      leads: [],
      filter: 'all',
      searchQuery: '',
      selectedLeadId: null,

      addLead: (leadData) => {
        const newLead: Lead = {
          ...leadData,
          id: `lead-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          leads: [newLead, ...state.leads],
        }));

        return newLead;
      },

      updateLead: (id, updates) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id
              ? { ...lead, ...updates, updatedAt: new Date().toISOString() }
              : lead
          ),
        }));
      },

      updateStage: (id, stage) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id
              ? { ...lead, stage, updatedAt: new Date().toISOString() }
              : lead
          ),
        }));
      },

      deleteLead: (id) => {
        set((state) => ({
          leads: state.leads.filter((lead) => lead.id !== id),
          selectedLeadId: state.selectedLeadId === id ? null : state.selectedLeadId,
        }));
      },

      setFilter: (filter) => set({ filter }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setSelectedLeadId: (selectedLeadId) => set({ selectedLeadId }),

      getFilteredLeads: () => {
        const { leads, filter, searchQuery } = get();
        let result = [...leads];

        if (filter === 'hot') {
          result = result.filter((l) => l.matchScore >= 90);
        } else if (filter === 'urgent') {
          result = result.filter((l) => l.urgency === 'urgent');
        } else if (filter === 'captured' || filter === 'quoted' || filter === 'won') {
          result = result.filter((l) => l.stage === filter);
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter(
            (l) =>
              l.rawText.toLowerCase().includes(q) ||
              l.senderName.toLowerCase().includes(q) ||
              l.category.toLowerCase().includes(q) ||
              l.channelName.toLowerCase().includes(q) ||
              l.aiSummary.toLowerCase().includes(q)
          );
        }

        return result;
      },

      simulateIncomingLead: () => {
        const randomIndex = Math.floor(Math.random() * SIMULATED_LEAD_POOL.length);
        const template = SIMULATED_LEAD_POOL[randomIndex];
        return get().addLead(template);
      },

      clearAllLeads: () => {
        set({ leads: [], selectedLeadId: null });
      },

      resetToSampleData: () => {
        set({ leads: [], filter: 'all', searchQuery: '', selectedLeadId: null });
      },
    }),
    {
      name: 'mikana-leads-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.leads)) {
          // Immediately purge any legacy dummy or sample leads
          state.leads = state.leads.filter(
            (l) => !l.id.startsWith('lead-00') && !l.id.startsWith('sample-')
          );
        }
      },
    }
  )
);

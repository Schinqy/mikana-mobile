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
}

const INITIAL_SAMPLE_LEADS: Lead[] = [
  {
    id: 'lead-001',
    rawText: 'Looking for a reliable commercial electrician / solar installer in Harare/Sandton. Need 10kVA hybrid backup system with 15kWh lithium storage for our medical clinic before next Friday. Budget ~$6,500. Drop quotes and past work.',
    senderName: 'Dr. T. Sithole',
    senderPhone: '+27821948831',
    channelName: 'B2B Contractors & Commerce Network',
    category: 'Solar & Electrical',
    urgency: 'urgent',
    budgetEstimate: '$6,500',
    location: 'Sandton / Harare',
    matchScore: 96,
    stage: 'captured',
    aiSummary: 'Clinic backup system installation (10kVA Hybrid + 15kWh Lithium). Hard deadline before next Friday.',
    extractedNeeds: [
      '10kVA Hybrid Inverter',
      '15kWh Lithium Battery Bank',
      'Medical clinic safety compliance',
      'Installation within 5 days'
    ],
    currency: 'USD',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'lead-002',
    rawText: 'Urgent: Need a React Native / Expo mobile engineer to finalize and ship our MVP to App Store & Play Store. Figma designs complete, backend API ready. Paying $2,500 flat for 2-week sprint.',
    senderName: 'Alex Rivera (Apex Labs)',
    senderPhone: '+14159082214',
    channelName: 'Tech Startups & Founders Hub',
    category: 'Software & Mobile Dev',
    urgency: 'urgent',
    budgetEstimate: '$2,500',
    location: 'Remote (US/Global)',
    matchScore: 98,
    stage: 'quoted',
    aiSummary: 'React Native Expo MVP finalization and App Store deployment sprint. 2-week turnaround.',
    extractedNeeds: [
      'Expo / React Native expertise',
      'App Store & TestFlight submission',
      'API integration & UI polish'
    ],
    quotedAmount: 2500,
    generatedPitch: 'Hi Alex! Saw your request in Tech Founders Hub. We specialize in rapid Expo & React Native deployments with zero-rejection store approvals. We can take your completed Figma and API to live TestFlight in 10 days flat. Here is our portfolio and recent store builds: https://github.com/apex-sample',
    currency: 'USD',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'lead-003',
    rawText: 'We need corporate branding & packaging design for a new artisan coffee brand. Looking for 3 packaging SKUs, logo vector pack, and brand guide. Budget around $1,200. Please send Behance/Portfolio.',
    senderName: 'Clara Ndlovu',
    senderPhone: '+263773901122',
    channelName: 'Creative Marketplace & Freelancers',
    category: 'Branding & Design',
    urgency: 'medium',
    budgetEstimate: '$1,200',
    location: 'Hybrid / Remote',
    matchScore: 88,
    stage: 'negotiating',
    aiSummary: 'Coffee brand identity package: 3 packaging SKUs, vector logo kit, and brand style guide.',
    extractedNeeds: [
      '3 Packaging label SKUs',
      'Vector logo files',
      'Brand guideline PDF'
    ],
    quotedAmount: 1150,
    currency: 'USD',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'lead-004',
    rawText: 'Any wholesale food distributor who has 200 bags of grade-1 Basmati Rice (25kg) ready for warehouse dispatch? Send unit price delivered to Midrand.',
    senderName: 'Marcus Chen',
    senderPhone: '+27718904321',
    channelName: 'FMCG & Wholesale Buyers Hub',
    category: 'Wholesale & Goods',
    urgency: 'medium',
    budgetEstimate: '$7,000',
    location: 'Midrand, ZA',
    matchScore: 74,
    stage: 'captured',
    aiSummary: 'Bulk purchase: 200 bags of 25kg Grade-1 Basmati Rice with Midrand warehouse delivery.',
    extractedNeeds: [
      '200 units x 25kg Grade-1 Basmati',
      'Immediate warehouse dispatch',
      'Midrand transport included'
    ],
    currency: 'ZAR',
    createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  }
];

const SIMULATED_LEAD_POOL: Array<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    rawText: 'Looking for a seasoned UI/UX designer for our B2B fintech web app. 15 core screens in Figma with clean dark-first components. Budget is $1,800. Timeline 10 days.',
    senderName: 'David K. (FinPay)',
    senderPhone: '+447911123456',
    channelName: 'Global UI/UX & Design Leads',
    category: 'Design & UI/UX',
    urgency: 'urgent',
    budgetEstimate: '$1,800',
    location: 'London / Remote',
    matchScore: 95,
    stage: 'captured',
    aiSummary: '15-screen fintech B2B web app UI design in Figma. Dark-first design standard.',
    extractedNeeds: ['15 Figma screens', 'Design system tokens', 'Interactive prototype'],
    currency: 'USD',
  },
  {
    rawText: 'Need 50 custom screen-printed heavy cotton hoodies for a university tech summit. Delivery needed by 15th next month in Johannesburg. Quote with samples.',
    senderName: 'Sarah M.',
    senderPhone: '+27834567890',
    channelName: 'Merchandise & Print Suppliers',
    category: 'Merchandise & Print',
    urgency: 'medium',
    budgetEstimate: '$1,500',
    location: 'Johannesburg, ZA',
    matchScore: 82,
    stage: 'captured',
    aiSummary: '50 custom printed 350gsm hoodies for tech event with strict delivery deadline.',
    extractedNeeds: ['50 hoodies', 'Screen printing front/back', 'Door delivery'],
    currency: 'ZAR',
  },
  {
    rawText: 'URGENT: Generator service and alternator rewinding needed for a 50kVA Perkins industrial unit on site. Location: Msasa Industrial Park. Contact immediately.',
    senderName: 'Eng. G. Mutasa',
    senderPhone: '+263712345678',
    channelName: 'Heavy Industry & Engineering Services',
    category: 'Engineering & Maintenance',
    urgency: 'urgent',
    budgetEstimate: '$1,400',
    location: 'Harare, ZW',
    matchScore: 91,
    stage: 'captured',
    aiSummary: 'On-site emergency alternator rewinding and major service for 50kVA Perkins generator.',
    extractedNeeds: ['50kVA Perkins diagnosis', 'Alternator rewinding', 'Same-day site visit'],
    currency: 'USD',
  }
];

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      leads: INITIAL_SAMPLE_LEADS,
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

      resetToSampleData: () => {
        set({ leads: INITIAL_SAMPLE_LEADS, filter: 'all', searchQuery: '', selectedLeadId: null });
      },
    }),
    {
      name: 'mikana-leads-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

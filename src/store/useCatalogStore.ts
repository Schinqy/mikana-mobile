import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceItem, BusinessProfile } from '../types/catalog';

interface CatalogState {
  profile: BusinessProfile;
  services: ServiceItem[];

  // Actions
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  addService: (service: Omit<ServiceItem, 'id'>) => ServiceItem;
  updateService: (id: string, updates: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
}

const DEFAULT_PROFILE: BusinessProfile = {
  businessName: 'Vanguard Solutions Ltd',
  tagline: 'High-Impact Engineering, Renewable Energy & Commercial Services',
  industry: 'Engineering & Technology Services',
  contactName: 'Operations Team',
  phone: '+14159082214',
  whatsappNumber: '+14159082214',
  email: 'deals@vanguardsolutions.io',
  website: 'https://vanguardsolutions.io',
  defaultCurrency: 'USD',
  customPitchGuidelines: 'Tone: Professional, direct, value-first. State exact timeline, warranty, and highlight relevant completed projects.',
};

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'srv-001',
    title: 'Mobile App & Full-Stack Web Development',
    category: 'Software & Mobile Dev',
    description: 'End-to-end React Native / Expo & Next.js production builds with rapid App Store & Google Play deployment.',
    pricingModel: 'fixed',
    price: 2500,
    currency: 'USD',
    turnaroundTime: '10–14 Days',
    keyDeliverables: ['Native iOS & Android builds', 'Backend API integration', 'TestFlight & Play Console approvals'],
    portfolioLinks: ['https://github.com/vanguard/mobile-showcase'],
    isActive: true,
  },
  {
    id: 'srv-002',
    title: 'Commercial Solar & Lithium Backup Systems',
    category: 'Solar & Electrical',
    description: 'Tier-1 Deye/Sunsynk hybrid inverters and Freedom Won/Dyness lithium energy storage with full safety certification.',
    pricingModel: 'starting_at',
    price: 4500,
    currency: 'USD',
    turnaroundTime: '3–5 Days',
    keyDeliverables: ['System sizing & CAD design', 'On-site installation & cabling', '5-Year Inverter / 10-Year Battery Warranty'],
    portfolioLinks: ['https://vanguardsolutions.io/solar-portfolio'],
    isActive: true,
  },
  {
    id: 'srv-003',
    title: 'Product UI/UX & Brand Design System',
    category: 'Design & UI/UX',
    description: 'Clean dark-first design systems in Figma, responsive web apps, vector logo suites, and packaging labels.',
    pricingModel: 'fixed',
    price: 1200,
    currency: 'USD',
    turnaroundTime: '5–7 Days',
    keyDeliverables: ['Figma design files with autolayout', 'Token architecture & component library', 'Interactive prototype'],
    portfolioLinks: ['https://behance.net/vanguard-design'],
    isActive: true,
  }
];

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      services: DEFAULT_SERVICES,

      updateProfile: (updates) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
      },

      addService: (serviceData) => {
        const newService: ServiceItem = {
          ...serviceData,
          id: `srv-${Date.now()}`,
        };

        set((state) => ({
          services: [newService, ...state.services],
        }));

        return newService;
      },

      updateService: (id, updates) => {
        set((state) => ({
          services: state.services.map((srv) =>
            srv.id === id ? { ...srv, ...updates } : srv
          ),
        }));
      },

      deleteService: (id) => {
        set((state) => ({
          services: state.services.filter((srv) => srv.id !== id),
        }));
      },

      toggleServiceActive: (id) => {
        set((state) => ({
          services: state.services.map((srv) =>
            srv.id === id ? { ...srv, isActive: !srv.isActive } : srv
          ),
        }));
      },
    }),
    {
      name: 'mikana-catalog-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

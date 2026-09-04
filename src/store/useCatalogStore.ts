import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceItem, BusinessProfile } from '../types/catalog';

interface CatalogState {
  profile: BusinessProfile;
  services: ServiceItem[];
  _hasHydrated: boolean;

  // Actions
  updateProfile: (updates: Partial<BusinessProfile>) => void;
  addService: (service: Omit<ServiceItem, 'id'>) => ServiceItem;
  updateService: (id: string, updates: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  setHasHydrated: (state: boolean) => void;
}

const DEFAULT_PROFILE: BusinessProfile = {
  businessName: '',
  tagline: '',
  industry: '',
  contactName: '',
  phone: '',
  whatsappNumber: '',
  email: '',
  website: '',
  defaultCurrency: 'USD',
  customPitchGuidelines: '',
};

const DEFAULT_SERVICES: ServiceItem[] = [];

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      services: DEFAULT_SERVICES,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

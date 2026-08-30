export type PricingModel = 'fixed' | 'hourly' | 'starting_at' | 'quote';

export interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  pricingModel: PricingModel;
  price: number;
  currency: string;
  turnaroundTime: string;
  keyDeliverables: string[];
  portfolioLinks: string[];
  isActive: boolean;
}

export interface BusinessProfile {
  businessName: string;
  tagline: string;
  industry: string;
  contactName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  website: string;
  defaultCurrency: string;
  customPitchGuidelines: string;
}

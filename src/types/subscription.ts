export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_annual' | 'agency';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isPro: boolean;
  isAgency: boolean;
  expirationDate: string | null;
  leadsRemainingThisWeek: number;
  boostCredits: number;
  isSandboxMode: boolean;
}

export interface PaywallPackage {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'CUSTOM';
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

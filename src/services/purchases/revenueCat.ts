import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { SubscriptionTier, PaywallPackage } from '../../types/subscription';

export const REVENUECAT_ENTITLEMENT_ID = 'mikana_pro';

// Fallback / Mock packages for sandbox and instant previewing
export const MOCK_PAYWALL_PACKAGES: PaywallPackage[] = [
  {
    identifier: 'pro_monthly',
    packageType: 'MONTHLY',
    product: {
      identifier: 'mikana_pro_monthly_999',
      title: 'Pro Trader Monthly',
      description: 'Unlimited lead radar, Gemini AI Pitch Studio, 24/7 Offline Autopilot (15 replies/day), and deal pipeline CRM.',
      price: 9.99,
      priceString: '$9.99 / month',
      currencyCode: 'USD',
    },
  },
  {
    identifier: 'pro_annual',
    packageType: 'ANNUAL',
    product: {
      identifier: 'mikana_pro_annual_7999',
      title: 'Pro Trader Annual',
      description: 'Everything in Pro with 35% discount, priority lead alerts, and 2 months free.',
      price: 79.99,
      priceString: '$79.99 / year ($6.66/mo)',
      currencyCode: 'USD',
    },
  },
  {
    identifier: 'agency',
    packageType: 'MONTHLY',
    product: {
      identifier: 'mikana_agency_monthly_2499',
      title: 'Agency & High-Volume',
      description: 'Unlimited 24/7 Autopilot, multi-catalog matching, team seats, and direct CRM webhook integration.',
      price: 24.99,
      priceString: '$24.99 / month',
      currencyCode: 'USD',
    },
  },
];

export async function initializeRevenueCat(apiKey?: string): Promise<boolean> {
  try {
    const key = apiKey || (Platform.OS === 'ios' ? 'appl_mock_ios_key' : 'goog_mock_android_key');
    if (!key || key.startsWith('appl_mock') || key.startsWith('goog_mock')) {
      console.log('RevenueCat: Running in Sandbox / Hackathon Demo mode.');
      return true;
    }

    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: key });
    return true;
  } catch (error) {
    console.warn('RevenueCat initialization failed, falling back to mock mode:', error);
    return false;
  }
}

export async function getRevenueCatPackages(): Promise<PaywallPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages.map((pkg: PurchasesPackage) => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType as any,
        product: {
          identifier: pkg.product.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
          currencyCode: pkg.product.currencyCode,
        },
      }));
    }
  } catch (e) {
    console.log('RevenueCat getOfferings using mock sandbox packages');
  }

  return MOCK_PAYWALL_PACKAGES;
}

export async function purchaseSubscriptionPackage(
  packageId: string,
  isSandbox: boolean
): Promise<{ success: boolean; tier: SubscriptionTier; error?: string }> {
  if (isSandbox) {
    // Immediate simulated purchase for Hackathon review & sandbox testing
    let tier: SubscriptionTier = 'pro_monthly';
    if (packageId.includes('annual')) tier = 'pro_annual';
    if (packageId.includes('agency')) tier = 'agency';

    return { success: true, tier };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.identifier === packageId);
    if (!pkg) {
      return { success: false, tier: 'free', error: 'Selected package unavailable in store.' };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const hasPro = typeof customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== 'undefined';
    
    return {
      success: hasPro,
      tier: hasPro ? 'pro_monthly' : 'free',
    };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, tier: 'free', error: 'Purchase cancelled.' };
    }
    return { success: false, tier: 'free', error: error?.message || 'Transaction failed.' };
  }
}

export async function restoreRevenueCatPurchases(): Promise<{ success: boolean; isPro: boolean }> {
  try {
    const customerInfo: CustomerInfo = await Purchases.restorePurchases();
    const isPro = typeof customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== 'undefined';
    return { success: true, isPro };
  } catch (error) {
    return { success: false, isPro: false };
  }
}

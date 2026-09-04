import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { colors } from '../src/theme/colors';

export default function Index() {
  const router = useRouter();
  const { onboardingCompleted, onboardingStage, isLoading, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isLoading) {
      if (onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        switch (onboardingStage) {
          case 'discovered':
            router.replace('/onboarding/pair');
            break;
          case 'paired':
            router.replace('/onboarding/groups');
            break;
          case 'groups':
            router.replace('/onboarding/notifications');
            break;
          case 'notifications':
            router.replace('/onboarding/paywall');
            break;
          case 'paywall':
            router.replace('/onboarding/paywall');
            break;
          case 'welcome':
          default:
            router.replace('/onboarding/welcome');
            break;
        }
      }
    }
  }, [_hasHydrated, isLoading, onboardingCompleted, onboardingStage]);

  return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
}
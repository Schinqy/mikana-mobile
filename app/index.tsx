import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { colors } from '../src/theme/colors';

export default function Index() {
  const router = useRouter();
  const { onboardingCompleted, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!onboardingCompleted) {
        router.replace('/onboarding/welcome');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isLoading, onboardingCompleted]);

  return <View style={{ flex: 1, backgroundColor: colors.canvas }} />;
}
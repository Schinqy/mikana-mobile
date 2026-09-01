import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, TrendingUp, Building2 } from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import * as Haptics from 'expo-haptics';

interface TabBarProps {
  state: any;
  navigation: any;
  descriptors?: any;
  insets?: any;
}

const TABS = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'pipeline', label: 'Deals', Icon: TrendingUp },
  { name: 'business', label: 'Business', Icon: Building2 },
];

function FloatingGlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPosition = Math.max(insets.bottom, 16);

  const visibleRoutes = state.routes.filter((r: any) =>
    ['index', 'pipeline', 'business'].includes(r.name)
  );

  return (
    <View style={[styles.floatingWrapper, { bottom: bottomPosition }]} pointerEvents="box-none">
      <View style={styles.glassPill}>
        {visibleRoutes.map((route: any) => {
          const tabDef = TABS.find((t) => t.name === route.name);
          if (!tabDef) return null;

          const { label, Icon } = tabDef;
          const globalIndex = state.routes.findIndex((r: any) => r.name === route.name);
          const isFocused = state.index === globalIndex;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              activeOpacity={0.7}
              style={[styles.pillItem, isFocused && styles.pillItemActive]}
            >
              <Icon
                size={18}
                color={isFocused ? colors.textInverse : colors.textMuted}
                strokeWidth={isFocused ? 2.5 : 1.75}
              />
              {isFocused && <Text style={styles.pillLabel}>{label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pipeline" />
      <Tabs.Screen name="business" />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="autopilot" options={{ href: null }} />
      <Tabs.Screen name="catalog" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandNavyDark, // Deep solid Midnight Navy
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#1E3A5F', // Subtle hairline border
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    gap: 4,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    flexShrink: 0,
  },
  pillItemActive: {
    backgroundColor: colors.accentBlue, // Royal Blue highlight from logo
    paddingHorizontal: 16,
  },
  pillLabel: {
    fontFamily: fonts.geist.semibold,
    fontSize: 13,
    color: colors.textInverse,
    flexShrink: 0,
  },
});

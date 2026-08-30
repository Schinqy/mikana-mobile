import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, TrendingUp, Building2 } from 'lucide-react-native';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/fonts';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TABS = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'pipeline', label: 'Deals', Icon: TrendingUp },
  { name: 'business', label: 'Business', Icon: Building2 },
];

function MikanaTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 10);

  const visibleRoutes = state.routes.filter((r) =>
    ['index', 'pipeline', 'business'].includes(r.name)
  );

  return (
    <View style={[styles.tabBar, { paddingBottom }]}>
      <View style={styles.tabBarInner}>
        {visibleRoutes.map((route) => {
          const tabDef = TABS.find((t) => t.name === route.name);
          if (!tabDef) return null;

          const { label, Icon } = tabDef;
          const globalIndex = state.routes.findIndex((r) => r.name === route.name);
          const isFocused = state.index === globalIndex;

          const onPress = () => {
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
              style={styles.tabItem}
            >
              <Icon
                size={20}
                color={isFocused ? colors.brandNavy : colors.textMuted}
                strokeWidth={isFocused ? 2.5 : 1.75}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>
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
      tabBar={(props) => <MikanaTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pipeline" />
      <Tabs.Screen name="business" />
      {/* Routes accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="autopilot" options={{ href: null }} />
      <Tabs.Screen name="catalog" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  tabLabel: {
    fontFamily: fonts.geist.medium,
    fontSize: 11,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: colors.brandNavy,
    fontFamily: fonts.geist.semibold,
  },
  tabLabelInactive: {
    color: colors.textMuted,
  },
});

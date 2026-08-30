import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LeadFilter } from '../../types/lead';
import * as Haptics from 'expo-haptics';

interface FilterItem {
  id: LeadFilter;
  label: string;
  count?: number;
}

interface LeadFilterBarProps {
  activeFilter: LeadFilter;
  onSelectFilter: (filter: LeadFilter) => void;
  counts: Record<LeadFilter, number>;
}

export const LeadFilterBar: React.FC<LeadFilterBarProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const filterTabs: FilterItem[] = [
    { id: 'all', label: 'All Leads', count: counts.all },
    { id: 'hot', label: 'Hot Deals (90%+)', count: counts.hot },
    { id: 'urgent', label: 'Urgent', count: counts.urgent },
    { id: 'captured', label: 'Captured', count: counts.captured },
    { id: 'quoted', label: 'Quoted', count: counts.quoted },
    { id: 'won', label: 'Won', count: counts.won },
  ];

  const handlePress = (filter: LeadFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectFilter(filter);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => handlePress(tab.id)}
              style={[styles.pill, isActive && styles.activePill]}
            >
              <Text style={[styles.pillText, isActive && styles.activePillText]}>
                {tab.label}
              </Text>
              {typeof tab.count === 'number' && (
                <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
                  <Text style={[styles.countText, isActive && styles.activeCountText]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
  },
  activePill: {
    backgroundColor: '#f4f4f5',
    borderColor: '#f4f4f5',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  activePillText: {
    color: '#09090b',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#18181b',
  },
  activeCountBadge: {
    backgroundColor: '#e4e4e7',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  activeCountText: {
    color: '#09090b',
  },
});

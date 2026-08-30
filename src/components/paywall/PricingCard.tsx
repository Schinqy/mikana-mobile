import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PaywallPackage } from '../../types/subscription';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { colors } from '../../theme/colors';
import { Check, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PricingCardProps {
  pkg: PaywallPackage;
  isSelected: boolean;
  onSelect: () => void;
  isPopular?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  pkg,
  isSelected,
  onSelect,
  isPopular = false,
}) => {
  const handleSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  const getFeatures = () => {
    if (pkg.identifier.includes('annual')) {
      return [
        'Unlimited AI Lead Radar Sweeps',
        '24/7 Offline Autopilot (15 replies/day)',
        'Gemini Flash AI Pitch Studio',
        '35% Annual Savings (2 Months Free)',
      ];
    }
    return [
      'Unlimited AI Lead Radar Sweeps',
      '24/7 Offline Autopilot (15 replies/day)',
      'Gemini Flash AI Pitch Studio',
      'Deal Pipeline CRM Tracker',
    ];
  };

  return (
    <Card
      onPress={handleSelect}
      style={[styles.card, isSelected && styles.selectedCard]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{pkg.product.title}</Text>
          <Text style={styles.price}>{pkg.product.priceString}</Text>
        </View>
        {isPopular && (
          <Badge variant="emerald" icon={<Zap size={10} color={colors.emerald} />}>
            Most Popular
          </Badge>
        )}
      </View>

      <Text style={styles.description}>{pkg.product.description}</Text>

      <View style={styles.featuresWrapper}>
        {getFeatures().map((feature, idx) => (
          <View key={idx} style={styles.featureItem}>
            <View style={styles.checkWrapper}>
              <Check size={11} color={colors.emerald} />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectedCard: {
    borderColor: colors.brandNavy,
    backgroundColor: colors.surfaceSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.emerald,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  featuresWrapper: {
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkWrapper: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.emeraldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});

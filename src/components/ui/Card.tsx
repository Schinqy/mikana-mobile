import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewProps,
  TouchableOpacityProps,
} from 'react-native';
import { colors } from '../../theme/colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
  onPress?: () => void;
  activeOpacity?: number;
  highlightBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  onPress,
  activeOpacity = 0.85,
  highlightBorder = false,
  style,
  ...rest
}) => {
  const containerStyles = [
    styles.baseCard,
    elevated ? styles.elevatedCard : styles.surfaceCard,
    highlightBorder && styles.highlightBorder,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={containerStyles}
        {...(rest as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyles} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  surfaceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  elevatedCard: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderStrong,
  },
  highlightBorder: {
    borderColor: colors.accentBlue,
  },
});

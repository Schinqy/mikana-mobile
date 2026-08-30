import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewProps,
  TouchableOpacityProps,
} from 'react-native';

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
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  surfaceCard: {
    backgroundColor: '#121215',
    borderColor: '#27272a',
  },
  elevatedCard: {
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
  highlightBorder: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
});

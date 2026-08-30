import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            style={styles.backButton}
          >
            <ChevronLeft size={20} color="#f4f4f5" />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightAction && <View style={styles.rightWrapper}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    backgroundColor: '#09090b',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#18181b',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  rightWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

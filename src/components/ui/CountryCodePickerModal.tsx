import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { Country, COUNTRIES } from '../../utils/countryCodes';
import { Search, X, Check } from 'lucide-react-native';

interface CountryCodePickerModalProps {
  visible: boolean;
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export function CountryCodePickerModal({
  visible,
  selectedCountry,
  onSelect,
  onClose,
}: CountryCodePickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Country</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCountry.code;
              return (
                <TouchableOpacity
                  style={[styles.countryRow, isSelected && styles.countryRowSelected]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={styles.flagContainer}>
                    <Text style={styles.flagEmoji}>{item.flag}</Text>
                  </View>
                  <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
                    {item.name}
                  </Text>
                  <Text style={styles.dialCode}>{item.dialCode}</Text>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Check size={16} color={colors.accentBlue} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.geist.semibold,
    fontSize: 16,
    color: colors.brandNavy,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    color: colors.textPrimary,
    height: '100%',
  },
  listContent: {
    paddingVertical: 8,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  countryRowSelected: {
    backgroundColor: colors.accentBlueTint,
  },
  flagContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  flagEmoji: {
    fontSize: 20,
  },
  countryName: {
    flex: 1,
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  countryNameSelected: {
    fontFamily: fonts.inter.bold,
    color: colors.brandNavy,
  },
  dialCode: {
    fontFamily: fonts.geist.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  checkIcon: {
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 64,
  },
});

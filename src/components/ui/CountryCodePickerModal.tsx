import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { Country, COUNTRIES, detectUserCountry } from '../../utils/countryCodes';
import { Search, X, Check, MapPin, Globe } from 'lucide-react-native';

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
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  // Handle Android & iOS status bar padding properly inside native Modal
  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 0, 24)
    : insets.top;

  const detectedCountry = useMemo(() => {
    return selectedCountry || detectUserCountry();
  }, [selectedCountry]);

  const { listData, hasDetectedTop } = useMemo(() => {
    if (!search.trim()) {
      // Put detected country at top followed by all other countries alphabetically
      const others = COUNTRIES.filter((c) => c.code !== detectedCountry.code);
      return {
        listData: [detectedCountry, ...others],
        hasDetectedTop: true,
      };
    }
    const q = search.toLowerCase().trim();
    const matches = COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
    return {
      listData: matches,
      hasDetectedTop: false,
    };
  }, [search, detectedCountry]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          {/* Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Select Country</Text>
              <Text style={styles.headerSub}>Choose your WhatsApp international code</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <X size={20} color={colors.brandNavy} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or dial code (e.g. +263, Zimbabwe)..."
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
            data={listData}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const isSelected = item.code === selectedCountry.code;
              const isDetectedItem = hasDetectedTop && index === 0 && !search.trim();

              return (
                <View>
                  {/* Section Label for Detected Location */}
                  {isDetectedItem && (
                    <View style={styles.sectionHeaderRow}>
                      <MapPin size={11} color={colors.accentBlue} />
                      <Text style={styles.sectionHeaderText}>DETECTED LOCATION</Text>
                    </View>
                  )}

                  {/* Section Label for All Countries */}
                  {hasDetectedTop && index === 1 && !search.trim() && (
                    <View style={styles.sectionHeaderRow}>
                      <Globe size={11} color={colors.textMuted} />
                      <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>
                        ALL COUNTRIES
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.countryRow,
                      isSelected && styles.countryRowSelected,
                      isDetectedItem && styles.detectedRowHighlight,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <View style={styles.flagContainer}>
                      <Text style={styles.flagEmoji}>{item.flag}</Text>
                    </View>
                    <View style={styles.countryInfo}>
                      <Text style={[styles.countryName, isSelected && styles.countryNameSelected]}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={styles.dialCode}>{item.dialCode}</Text>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Check size={16} color={colors.accentBlue} />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontFamily: fonts.geist.bold,
    fontSize: 17,
    color: colors.brandNavy,
  },
  headerSub: {
    fontFamily: fonts.inter.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.inter.medium,
    fontSize: 13.5,
    color: colors.textPrimary,
    height: '100%',
  },
  listContent: {
    paddingVertical: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: colors.canvas,
  },
  sectionHeaderText: {
    fontFamily: fonts.geist.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.accentBlue,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
  },
  countryRowSelected: {
    backgroundColor: colors.accentBlueTint,
  },
  detectedRowHighlight: {
    backgroundColor: colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flagContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  flagEmoji: {
    fontSize: 20,
  },
  countryInfo: {
    flex: 1,
    gap: 2,
  },
  countryName: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  countryNameSelected: {
    fontFamily: fonts.inter.bold,
    color: colors.brandNavy,
  },
  detectedBadge: {
    fontFamily: fonts.inter.medium,
    fontSize: 10,
    color: colors.accentBlue,
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

import { Platform } from 'react-native';

// Mikana Font System
// Primary: Geist — sharp, purposeful, Vercel-grade. Used for UI chrome, labels, metadata.
// Secondary: Inter — screen-optimised. Used for body copy and secondary text.

export const fonts = {
  // Geist on iOS, Inter on Android (prevents Android OTF advance-width bounding box clipping)
  geist: {
    thin: Platform.OS === 'android' ? 'Inter_400Regular' : 'Geist_100Thin',
    light: Platform.OS === 'android' ? 'Inter_400Regular' : 'Geist_300Light',
    regular: Platform.OS === 'android' ? 'Inter_400Regular' : 'Geist_400Regular',
    medium: Platform.OS === 'android' ? 'Inter_500Medium' : 'Geist_500Medium',
    semibold: Platform.OS === 'android' ? 'Inter_600SemiBold' : 'Geist_600SemiBold',
    bold: Platform.OS === 'android' ? 'Inter_700Bold' : 'Geist_700Bold',
    black: Platform.OS === 'android' ? 'Inter_700Bold' : 'Geist_900Black',
  },
  // Inter — body copy, descriptions, secondary metadata
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
};

// Safe letter spacing for Android to prevent text truncation
const ls = (val: number) => (Platform.OS === 'android' ? 0 : val);

// Type scale
export const type = {
  // Headings — Geist
  displayLg: { fontFamily: fonts.geist.bold, fontSize: 28, lineHeight: 34, letterSpacing: ls(-0.5) },
  displayMd: { fontFamily: fonts.geist.semibold, fontSize: 22, lineHeight: 28, letterSpacing: ls(-0.4) },
  heading: { fontFamily: fonts.geist.semibold, fontSize: 17, lineHeight: 22, letterSpacing: ls(-0.3) },
  subheading: { fontFamily: fonts.geist.medium, fontSize: 15, lineHeight: 20, letterSpacing: ls(-0.2) },

  // Body — Inter
  bodyLg: { fontFamily: fonts.inter.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  body: { fontFamily: fonts.inter.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  bodyMedium: { fontFamily: fonts.inter.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0 },

  // UI Labels — Geist
  label: { fontFamily: fonts.geist.medium, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  labelSm: { fontFamily: fonts.geist.medium, fontSize: 11, lineHeight: 16, letterSpacing: 0 },

  // Metadata — Inter
  caption: { fontFamily: fonts.inter.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  captionMedium: { fontFamily: fonts.inter.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0 },

  // Mono values (prices, IDs) — Geist Bold
  value: { fontFamily: fonts.geist.semibold, fontSize: 14, lineHeight: 20, letterSpacing: 0 },
  valueLg: { fontFamily: fonts.geist.bold, fontSize: 20, lineHeight: 26, letterSpacing: 0 },
};

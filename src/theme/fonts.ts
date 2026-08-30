// Mikana Font System
// Primary: Geist — sharp, purposeful, Vercel-grade. Used for UI chrome, labels, metadata.
// Secondary: Inter — screen-optimised. Used for body copy and secondary text.

export const fonts = {
  // Geist — UI chrome, headings, tab labels, stat values
  geist: {
    thin: 'Geist_100Thin',
    light: 'Geist_300Light',
    regular: 'Geist_400Regular',
    medium: 'Geist_500Medium',
    semibold: 'Geist_600SemiBold',
    bold: 'Geist_700Bold',
    black: 'Geist_900Black',
  },
  // Inter — body copy, descriptions, secondary metadata
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
};

// Type scale
export const type = {
  // Headings — Geist
  displayLg: { fontFamily: fonts.geist.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  displayMd: { fontFamily: fonts.geist.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.geist.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },
  subheading: { fontFamily: fonts.geist.medium, fontSize: 15, lineHeight: 20, letterSpacing: -0.2 },

  // Body — Inter
  bodyLg: { fontFamily: fonts.inter.regular, fontSize: 16, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontFamily: fonts.inter.regular, fontSize: 14, lineHeight: 20, letterSpacing: -0.1 },
  bodyMedium: { fontFamily: fonts.inter.medium, fontSize: 14, lineHeight: 20, letterSpacing: -0.1 },

  // UI Labels — Geist
  label: { fontFamily: fonts.geist.medium, fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
  labelSm: { fontFamily: fonts.geist.medium, fontSize: 11, lineHeight: 16, letterSpacing: 0 },

  // Metadata — Inter
  caption: { fontFamily: fonts.inter.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  captionMedium: { fontFamily: fonts.inter.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0 },

  // Mono values (prices, IDs) — Geist Bold
  value: { fontFamily: fonts.geist.semibold, fontSize: 14, lineHeight: 20, letterSpacing: -0.2 },
  valueLg: { fontFamily: fonts.geist.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
};

export interface Country {
  name: string;
  code: string; // ISO 2-letter
  dialCode: string; // e.g. "+263"
  flag: string; // Emoji flag
}

export const COUNTRIES: Country[] = [
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263', flag: '🇿🇼' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Botswana', code: 'BW', dialCode: '+267', flag: '🇧🇼' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260', flag: '🇿🇲' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258', flag: '🇲🇿' },
  { name: 'Namibia', code: 'NA', dialCode: '+264', flag: '🇳🇦' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Malawi', code: 'MW', dialCode: '+265', flag: '🇲🇼' },
  { name: 'Angola', code: 'AO', dialCode: '+244', flag: '🇦🇴' },
  { name: 'Mauritius', code: 'MU', dialCode: '+230', flag: '🇲🇺' },
  { name: 'Seychelles', code: 'SC', dialCode: '+248', flag: '🇸🇨' },
  { name: 'Lesotho', code: 'LS', dialCode: '+266', flag: '🇱🇸' },
  { name: 'Eswatini', code: 'SZ', dialCode: '+268', flag: '🇸🇿' },
  { name: 'DR Congo', code: 'CD', dialCode: '+243', flag: '🇨🇩' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251', flag: '🇪🇹' },
];

/**
 * Timezone to ISO Country Code Mapping for instant auto-detection
 */
const TIMEZONE_MAP: Record<string, string> = {
  'Africa/Harare': 'ZW',
  'Africa/Johannesburg': 'ZA',
  'Africa/Gaborone': 'BW',
  'Africa/Lusaka': 'ZM',
  'Africa/Maputo': 'MZ',
  'Africa/Windhoek': 'NA',
  'Africa/Nairobi': 'KE',
  'Africa/Lagos': 'NG',
  'Africa/Accra': 'GH',
  'Africa/Kigali': 'RW',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Kampala': 'UG',
  'Africa/Cairo': 'EG',
  'Africa/Blantyre': 'MW',
  'Africa/Luanda': 'AO',
  'Europe/London': 'GB',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Asia/Dubai': 'AE',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Asia/Singapore': 'SG',
};

/**
 * Detect user's country from system timezone or default to Zimbabwe (+263)
 */
export function detectUserCountry(): Country {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const code = TIMEZONE_MAP[tz];
      if (code) {
        const found = COUNTRIES.find((c) => c.code === code);
        if (found) return found;
      }

      // Check partial match (e.g. Africa/...)
      if (tz.startsWith('Africa/')) {
        const city = tz.split('/')[1];
        if (city === 'Harare') return COUNTRIES.find((c) => c.code === 'ZW') || COUNTRIES[0];
        if (city === 'Johannesburg') return COUNTRIES.find((c) => c.code === 'ZA') || COUNTRIES[0];
      }
    }
  } catch {
    // ignore
  }

  // Default to Zimbabwe (+263)
  return COUNTRIES[0];
}

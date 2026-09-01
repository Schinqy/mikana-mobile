/**
 * Supabase Client for Mikana Mobile
 *
 * Connects to your Supabase project for:
 * - Real-time lead subscriptions (new inquiries push instantly)
 * - Lead CRUD operations
 * - Business profile & service catalog storage
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These come from your Supabase project dashboard
// Settings > API > Project URL & anon/public key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Check if Supabase is configured (keys are set)
 */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 10 && SUPABASE_ANON_KEY.length > 10;
}

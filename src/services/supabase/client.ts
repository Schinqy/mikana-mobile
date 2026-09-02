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
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pxdprchczhegglaknydn.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4ZHByY2hjemhlZ2dsYWtueWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzEyMjQsImV4cCI6MjEwMzk0NzIyNH0.b_gxZ8Jv0ZaE-swH8dY-RA_Q48xBdkKpmjDAnLnh9v8';


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

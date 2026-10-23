/**
 * Supabase Browser Client Singleton
 * Configured for Next.js static export & Capacitor Android WebView.
 * Handles persistent authentication sessions and token auto-refresh.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const { url, anonKey, isConfigured, errorMessage } = getSupabaseConfig();
  if (!isConfigured) {
    if (typeof window !== 'undefined') {
      console.warn('[TrackVest Supabase]', errorMessage);
    }
    return null;
  }

  clientInstance = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'trackvest_supabase_auth_session',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

  return clientInstance;
}


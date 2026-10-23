/**
 * Centralized Supabase Configuration Module
 * Validates and exposes Supabase environment configuration safely.
 * Never exposes secret or service-role keys.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  errorMessage?: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ''
  );

  if (!url || !anonKey) {
    return {
      url,
      anonKey,
      isConfigured: false,
      errorMessage: 'Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum disetel.',
    };
  }

  // Basic URL syntax validation
  try {
    new URL(url);
  } catch {
    return {
      url,
      anonKey,
      isConfigured: false,
      errorMessage: 'Format NEXT_PUBLIC_SUPABASE_URL tidak valid.',
    };
  }

  return {
    url,
    anonKey,
    isConfigured: true,
  };
}


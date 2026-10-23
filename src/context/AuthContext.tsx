'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase/client';
import { dataRepository } from '../lib/repository/dataRepository';
import { syncService, SyncState } from '../lib/sync/syncService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  syncState: SyncState;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  triggerSync: () => Promise<boolean>;
  migrateLegacyData: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>(syncService.getState());

  // Listen to syncService state changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  // Initialize Supabase session & auth listener
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      dataRepository.setUserId('local');
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        dataRepository.setUserId(initialSession.user.id);
        dataRepository.migrateLegacyDataToUser(initialSession.user.id).catch(console.error);
      } else {
        dataRepository.setUserId('local');
      }

      setLoading(false);
    });

    // 2. Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          dataRepository.setUserId(currentSession.user.id);
          if (event === 'SIGNED_IN') {
            await dataRepository.migrateLegacyDataToUser(currentSession.user.id);
            syncService.triggerSync();
          }
        } else if (event === 'SIGNED_OUT') {
          dataRepository.setUserId('local');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: new Error('Koneksi Supabase belum terkonfigurasi pada file .env.local.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data.user) {
        dataRepository.setUserId(data.user.id);
        await dataRepository.migrateLegacyDataToUser(data.user.id);
        syncService.triggerSync();
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message || 'Gagal login. Periksa koneksi internet.') };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: new Error('Koneksi Supabase belum terkonfigurasi pada file .env.local.') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || 'TrackVest User',
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      const needsEmailConfirmation = !data.session;
      if (data.user && data.session) {
        dataRepository.setUserId(data.user.id);
        await dataRepository.migrateLegacyDataToUser(data.user.id);
        syncService.triggerSync();
      }

      return { error: null, needsEmailConfirmation };
    } catch (err: any) {
      return { error: new Error(err?.message || 'Gagal mendaftar akun.') };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    dataRepository.setUserId('local');
    setUser(null);
    setSession(null);
  };

  const triggerSync = async () => {
    return syncService.triggerSync();
  };

  const migrateLegacyData = async () => {
    if (!user) return 0;
    return dataRepository.migrateLegacyDataToUser(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthenticated: Boolean(user),
        syncState,
        signIn,
        signUp,
        signOut,
        triggerSync,
        migrateLegacyData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


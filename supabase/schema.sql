-- ==============================================================================
-- TRACKVEST - SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Version: 1.1 (Security Hardened & Production Verified)
-- Target: Supabase PostgreSQL (Standard Cloud / Local)
-- Purpose: Multi-platform cross-sync (Vercel Web + Capacitor Android)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES DDL
-- ==============================================================================

-- 2.1 PROFILES TABLE
-- Menyimpan data profil pengguna yang terhubung langsung ke auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  last_valuation_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 ASSETS TABLE
-- Menyimpan instrumen aset portofolio (Crypto, Emas, Saham, ETF, Kas, dll.)
CREATE TABLE IF NOT EXISTS public.assets (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  color text NOT NULL,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (user_id, id)
);

-- 2.3 INVESTMENTS TABLE
-- Menyimpan catatan riwayat setoran modal investasi
CREATE TABLE IF NOT EXISTS public.investments (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id text NOT NULL,
  date date NOT NULL,
  amount numeric(18, 2) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (user_id, id)
);

-- 2.4 SNAPSHOTS TABLE
-- Menyimpan snapshot historis portofolio pada tanggal tertentu
CREATE TABLE IF NOT EXISTS public.snapshots (
  id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_invested numeric(18, 2) NOT NULL,
  total_value numeric(18, 2) NOT NULL,
  total_profit numeric(18, 2) NOT NULL,
  total_return_percent numeric(8, 4) NOT NULL,
  assets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (user_id, id),
  CONSTRAINT unique_user_snapshot_date UNIQUE (user_id, date)
);

-- 2.5 LATEST VALUATIONS TABLE
-- Menyimpan nilai valuasi pasar terkini untuk masing-masing aset
CREATE TABLE IF NOT EXISTS public.latest_valuations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id text NOT NULL,
  current_value numeric(18, 2) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, asset_id)
);

-- ==============================================================================
-- 3. INDEXES FOR PERFORMANCE & SYNC EFFICIENCY
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_assets_user_updated ON public.assets (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_investments_user_updated ON public.investments (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_investments_user_asset ON public.investments (user_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON public.snapshots (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_updated ON public.snapshots (user_id, updated_at);

-- ==============================================================================
-- 4. AUTOMATIC TIMESTAMPS & USER INITIALIZATION TRIGGERS
-- ==============================================================================

-- 4.1 Trigger fungsi pembaruan kolom updated_at otomatis
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_assets_updated_at ON public.assets;
CREATE TRIGGER set_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_investments_updated_at ON public.investments;
CREATE TRIGGER set_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_snapshots_updated_at ON public.snapshots;
CREATE TRIGGER set_snapshots_updated_at BEFORE UPDATE ON public.snapshots FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_valuations_updated_at ON public.latest_valuations;
CREATE TRIGGER set_valuations_updated_at BEFORE UPDATE ON public.latest_valuations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4.2 Trigger otomatis pembuatan profil saat ada pengguna baru mendaftar di auth.users (Security Hardened)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'TrackVest User'
    ),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latest_valuations ENABLE ROW LEVEL SECURITY;

-- 5.1 Kebijakan Profiles
DROP POLICY IF EXISTS "Users can view and manage their own profile" ON public.profiles;
CREATE POLICY "Users can view and manage their own profile" ON public.profiles
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 5.2 Kebijakan Assets
DROP POLICY IF EXISTS "Users can view and manage their own assets" ON public.assets;
CREATE POLICY "Users can view and manage their own assets" ON public.assets
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5.3 Kebijakan Investments
DROP POLICY IF EXISTS "Users can view and manage their own investments" ON public.investments;
CREATE POLICY "Users can view and manage their own investments" ON public.investments
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5.4 Kebijakan Snapshots
DROP POLICY IF EXISTS "Users can view and manage their own snapshots" ON public.snapshots;
CREATE POLICY "Users can view and manage their own snapshots" ON public.snapshots
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5.5 Kebijakan Valuations
DROP POLICY IF EXISTS "Users can view and manage their own valuations" ON public.latest_valuations;
CREATE POLICY "Users can view and manage their own valuations" ON public.latest_valuations
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ==============================================================================
-- 6. PERMISSIONS & ROLE GRANTS
-- ==============================================================================

-- 6.1 Cabut hak akses yang tidak diperlukan dari role anon (unauthenticated)
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.assets FROM anon;
REVOKE ALL ON TABLE public.investments FROM anon;
REVOKE ALL ON TABLE public.snapshots FROM anon;
REVOKE ALL ON TABLE public.latest_valuations FROM anon;

-- 6.2 Berikan hak akses CRUD yang diperlukan kepada role authenticated (disaring oleh RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.investments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.latest_valuations TO authenticated;

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================

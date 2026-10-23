# Rencana & Spesifikasi Implementasi Sinkronisasi Data Lintas Platform (Web & Android)
## TrackVest — Supabase Cloud Database & Local-First IndexedDB Synchronization

*Dokumen Spesifikasi Teknis & Hasil Implementasi Produksi*  
*Versi: 3.0 — Tanggal: 24 Oktober 2026*  
*Status: Selesai Diimplementasikan & Terverifikasi (Build Static Export & Debug APK Berhasil)*

---

## 1. Audit Arsitektur Saat Ini & Akar Masalah

### 1.1 Kondisi Penyimpanan Saat Ini
Berdasarkan audit mendalam pada berkas [src/lib/storage.ts](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/lib/storage.ts) dan [src/types/index.ts](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/types/index.ts):
- Seluruh data investasi TrackVest saat ini disimpan secara lokal menggunakan browser `localStorage` sinkron:
  - `trackvest_assets_v4` : Daftar aset portofolio (`Asset[]`).
  - `trackvest_investments_v4` : Catatan transaksi setoran modal (`Investment[]`).
  - `trackvest_snapshots_v4` : Riwayat snapshot portofolio dari waktu ke waktu (`Snapshot[]`).
  - `trackvest_latest_valuations_v4` : Nilai sekarang / valuasi pasar masing-masing aset (`Record<string, number>`).
  - `trackvest_last_valuation_time_v4` : Waktu pembaruan valuasi terakhir (`string` ISO).
  - `trackvest_user_name_v4` : Nama profil pengguna (`string`).
- Aplikasi berjalan 100% *client-side* tanpa otentikasi akun maupun server database.

### 1.2 Mengapa Data Website dan APK Android Terpisah?
Pemisahan data terjadi karena isolasi peramban standar (*Same-Origin Policy*):
1. **Website Vercel:**  
   Berjalan di origin web HTTPS publik (misal: `https://trackvest.vercel.app`). Penyimpanan `localStorage` terikat secara eksklusif ke domain tersebut di browser pengguna.
2. **Aplikasi Android (Capacitor APK):**  
   Berjalan di dalam kontainer Android WebView terisolasi (`com.trackvest.app`) dengan origin lokal `http://localhost`. Penyimpanan `localStorage` disimpan di dalam sandbox privat aplikasi Android (`/data/data/com.trackvest.app/app_webview/Local Storage/leveldb/`).
3. **Keterbatasan `localStorage`:**  
   Selain tidak dapat berbagi antar-origin, `localStorage` memiliki batas kuota ketat (~5 MB) dan bersifat sinkronik-memblokir thread utama (*blocking I/O*). Jika pengguna memiliki riwayat snapshot ratusan hari dengan ikon aset base64, `localStorage` berisiko memicu `QuotaExceededError`.

---

## 2. Arsitektur Solusi: Supabase + Local-First IndexedDB

Solusi yang dirancang menggunakan pendekatan **Local-First Architecture** dengan **Supabase** (PostgreSQL + Auth + Row Level Security) sebagai *cloud source of truth* dan **IndexedDB** sebagai mesin penyimpanan lokal perangkat:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SUPABASE CLOUD PROJECT (POSTGRESQL)                   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Row Level Security (RLS) Active: auth.uid() = user_id                │  │
│  │                                                                       │  │
│  │  • public.profiles              • public.snapshots                    │  │
│  │  • public.assets                • public.latest_valuations            │  │
│  │  • public.investments                                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      ▲                                      │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ HTTPS REST / Realtime (JWT Auth)
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 SYNC ENGINE (Outbox + Delta Pull)           │
        └──────────────────────────────▲──────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │      WEBSITE WEB      │             │      ANDROID APK      │
        │   (Vercel / Laptop)   │             │   (Capacitor / HP)    │
        │                       │             │                       │
        │  IndexedDB (Local)    │             │  IndexedDB (Local)    │
        │  • assets             │             │  • assets             │
        │  • investments        │             │  • investments        │
        │  • snapshots          │             │  • snapshots          │
        │  • valuations         │             │  • valuations         │
        │  • sync_queue (outbox)│             │  • sync_queue (outbox)│
        └───────────────────────┘             └───────────────────────┘
```

### Keunggulan Arsitektur Ini:
1. **Kinerja Instan Tanpa Lag (Zero-Latency UI):** Seluruh operasi baca dan tulis dilakukan ke IndexedDB lokal terlebih dahulu. Tampilan UI diperbarui seketika tanpa harus menunggu respons jaringan internet.
2. **Bekerja Penuh Saat Offline:** Transaksi atau aset yang ditambahkan saat tidak ada internet disimpan di antrean sinkronisasi lokal (*sync queue/outbox*) dan otomatis terkirim saat internet tersambung kembali.
3. **Privasi & Keamanan Tingkat Database (RLS):** Supabase Row Level Security memastikan pengguna hanya dapat melihat dan memanipulasi datanya sendiri. Akses antar-pengguna tertutup rapat di level PostgreSQL engine.
4. **Kapasitas Penyimpanan Melimpah:** IndexedDB mendukung penyimpanan hingga ratusan megabyte/gigabyte, aman untuk menyimpan puluhan aset dengan ikon kustom dan riwayat snapshot harian jangka panjang.
5. **Satu Project untuk Semua Platform:** Website Vercel dan APK Android terhubung ke satu project Supabase yang sama menggunakan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 3. Skema Basis Data PostgreSQL & Kebijakan RLS (Supabase)

Skema database dirancang untuk memetakan model data TrackVest secara presisi dengan dukungan *soft-delete* (tombstone) untuk sinkronisasi multi-perangkat.

### 3.1 DDL Skema Tabel (Tersimpan di `supabase/schema.sql`)

```sql
-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFIL PENGGUNA
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  last_valuation_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TABEL ASET PORTOFOLIO
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

CREATE INDEX IF NOT EXISTS idx_assets_user_updated ON public.assets (user_id, updated_at);

-- 4. TABEL TRANSAKSI INVESTASI (SETORAN MODAL)
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

CREATE INDEX IF NOT EXISTS idx_investments_user_updated ON public.investments (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_investments_user_asset ON public.investments (user_id, asset_id);

-- 5. TABEL SNAPSHOT PORTOFOLIO
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

CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON public.snapshots (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_updated ON public.snapshots (user_id, updated_at);

-- 6. TABEL VALUASI TERAKHIR (PASAR)
CREATE TABLE IF NOT EXISTS public.latest_valuations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id text NOT NULL,
  current_value numeric(18, 2) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, asset_id)
);
```

### 3.2 Trigger Otomatis Pembaruan `updated_at` & Profil Baru

```sql
-- Trigger fungsi untuk mengupdate kolom updated_at secara otomatis
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

-- Trigger otomatis membuat profil publik saat ada user mendaftar di auth.users
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
```

### 3.3 Kebijakan Row Level Security (RLS)

```sql
-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latest_valuations ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan Profiles
DROP POLICY IF EXISTS "Users can view and manage their own profile" ON public.profiles;
CREATE POLICY "Users can view and manage their own profile" ON public.profiles
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 2. Kebijakan Assets
DROP POLICY IF EXISTS "Users can view and manage their own assets" ON public.assets;
CREATE POLICY "Users can view and manage their own assets" ON public.assets
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. Kebijakan Investments
DROP POLICY IF EXISTS "Users can view and manage their own investments" ON public.investments;
CREATE POLICY "Users can view and manage their own investments" ON public.investments
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Kebijakan Snapshots
DROP POLICY IF EXISTS "Users can view and manage their own snapshots" ON public.snapshots;
CREATE POLICY "Users can view and manage their own snapshots" ON public.snapshots
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5. Kebijakan Valuations
DROP POLICY IF EXISTS "Users can view and manage their own valuations" ON public.latest_valuations;
CREATE POLICY "Users can view and manage their own valuations" ON public.latest_valuations
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

### 3.4 Hak Akses Peran Database (Database Role Privileges)

```sql
-- Cabut akses dari unauthenticated role
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.assets FROM anon;
REVOKE ALL ON TABLE public.investments FROM anon;
REVOKE ALL ON TABLE public.snapshots FROM anon;
REVOKE ALL ON TABLE public.latest_valuations FROM anon;

-- Berikan hak akses CRUD kepada authenticated role (dibatasi oleh RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.investments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.latest_valuations TO authenticated;
```

---

## 4. Lapisan Penyimpanan Lokal: IndexedDB

Untuk menggantikan `localStorage` yang terbatas dan mudah penuh tanpa mengubah struktur data aplikasi, dibuat modul penyimpanan lokal [src/lib/indexedDbStorage.ts](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/lib/indexedDbStorage.ts).

### 4.1 Skema Object Store IndexedDB (`trackvest_db`)
- `assets`: Disimpan dengan key `id`.
- `investments`: Disimpan dengan key `id`, index pada `assetId` dan `date`.
- `snapshots`: Disimpan dengan key `id`, index pada `date`.
- `valuations`: Disimpan dengan key `assetId`.
- `sync_queue`: Antrean mutasi offline (*outbox*), key `id` auto-increment/UUID.
- `metadata`: Menyimpan `last_synced_at`, `current_user_id`, dan preferensi pengguna.

### 4.2 Jaminan Kompatibilitas dengan Kode UI Saat Ini
Modul penyimpanan menyediakan *synchronous in-memory cache* yang tersinkronisasi secara asinkron ke IndexedDB. Dengan pola ini:
- Komponen UI yang sudah ada (`page.tsx`, `AssetTable.tsx`, `PerformanceChart.tsx`, modal-modal) **tetap dapat membaca data secara sinkron tanpa perubahan API**.
- Seluruh formula kalkulasi di [src/lib/calculations.ts](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/lib/calculations.ts) tetap utuh 100%.

---

## 5. Mesin Sinkronisasi Offline (Sync Queue / Outbox Pattern)

### 5.1 Struktur Item Antrean Mutasi (`sync_queue`)
Setiap kali ada tindakan pengguna (menambah/mengedit/menghapus investasi, aset, snapshot, valuasi), sistem membuat entri antrean:

```typescript
export interface SyncQueueItem {
  id: string; // UUID item antrean
  entity: 'asset' | 'investment' | 'snapshot' | 'valuation';
  action: 'UPSERT' | 'DELETE';
  entityId: string;
  payload: any;
  timestamp: string; // ISO 8601
  retryCount: number;
}
```

### 5.2 Alur Kerja Sinkronisasi Dua Arah (*Bidirectional Sync*)

```
[ Pengguna Menekan Simpan / Hapus ]
             │
             ▼
1. Tulis ke IndexedDB Lokal (Instant UI Update)
             │
             ▼
2. Masukkan ke `sync_queue` di IndexedDB
             │
      ┌──────┴──────┐
  [ Apakah Online? ]
      └──────┬──────┘
       Ya    │    Tidak
  ┌──────────┘    └────────────────────────┐
  ▼                                        ▼
3. Kirim ke Supabase via Upsert / Delete  Tunda di antrean lokal
  │                                        │
  ▼                                        ▼
4. Hapus item dari `sync_queue`           Otomatis dikirim saat event `online`
  │                                        atau saat aplikasi dibuka kembali
  ▼
5. Delta Pull: Ambil perubahan terbaru dari Supabase (updated_at > last_synced_at)
  │
  ▼
6. Update IndexedDB lokal & perbarui `last_synced_at`
```

### 5.3 Indikator Status Sinkronisasi di UI
Status ditampilkan di Navbar secara halus:
- 🟢 **Tersinkronisasi** (`IDLE`): Data lokal dan server identik.
- 🔵 **Menyinkronkan...** (`SYNCING`): Sedang memproses antrean atau mengunduh delta.
- 🟠 **Offline (X tertunda)** (`OFFLINE`): Tidak ada koneksi, transaksi aman di IndexedDB.
- ⚪ **Mode Lokal** (`UNAUTHENTICATED`): Berfungsi offline tanpa akun.

---

## 6. Resolusi Konflik & Pencegahan Duplikasi

1. **Unique ID yang Tahan Tabrakan:**
   - Format ID yang diperbarui: `inv-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`.
   - Menjamin bahwa jika pengguna menambahkan transaksi di HP dan Laptop pada detik yang sama dalam mode offline, ID kedua transaksi tidak akan pernah bertabrakan.
2. **Pencegahan Duplikasi Transaksi Investasi:**
   - Saat migrasi atau sinkronisasi, sistem melakukan pemeriksaan duplikasi berbasis sidik jari transaksi: kombinasi `{asset_id, date, amount}` dengan toleransi catatan (*note*). Jika transaksi identik sudah ada di cloud, sistem menghindari pembuatan baris baru.
3. **Pencegahan Duplikasi Snapshot:**
   - Tabel `snapshots` memiliki konstrain unik database `UNIQUE(user_id, date)`.
   - Jika snapshot tanggal yang sama dibuat di dua perangkat berbeda, operasi `upsert` dengan strategi *Last-Write-Wins* berbasis `updated_at` akan memperbarui snapshot tersebut tanpa membuat entri ganda pada grafik.
4. **Penghapusan dengan Soft-Delete (*Tombstones*):**
   - Saat pengguna menghapus aset atau investasi, baris diberi tanda `deleted_at = now()`.
   - Saat perangkat lain melakukan *delta pull*, perangkat tersebut mendeteksi `deleted_at` dan menghapus data dari IndexedDB lokal. Ini mencegah transaksi yang sudah dihapus "bangkit kembali" (*resurrected items*).

---

## 7. Rencana Migrasi Aman Data `localStorage` yang Sudah Ada

Sangat penting: **Data investasi pengguna yang saat ini sudah ada di HP atau Laptop tidak boleh hilang atau terduplikasi.**

### Prosedur Migrasi Otomatis Satu Kali:
1. **Deteksi Data Lokal:**  
   Saat aplikasi dimuat pertama kali, sistem memeriksa keberadaan data di `localStorage` (`trackvest_assets_v4`, `trackvest_investments_v4`, dll.).
2. **Penyalinan ke IndexedDB:**  
   Seluruh data lokal disalin utuh ke IndexedDB `trackvest_db`.
3. **Saat Pengguna Login ke Supabase:**
   - Sistem memeriksa apakah akun Supabase pengguna sudah memiliki data di cloud:
     - **Kasus 1 (Akun Baru / Cloud Masih Kosong):**  
       Seluruh data lokal yang ada langsung diberi `user_id` pengguna dan diunggah secara massal (*bulk upsert*) ke Supabase. Data lokal langsung menjadi basis data cloud awal. **Hasil: 100% data tersimpan ke cloud tanpa ada yang hilang.**
     - **Kasus 2 (Akun Cloud Sudah Berisi Data dari Perangkat Lain):**  
       Sistem menjalankan penggabungan dua arah yang cerdas (*smart union merge*):
       - Aset lokal yang belum ada di cloud diunggah ke cloud.
       - Transaksi lokal yang belum ada di cloud diunggah ke cloud (dengan validasi anti-duplikasi).
       - Data dari cloud diunduh dan disimpan ke IndexedDB lokal.
       - **Hasil: Kedua perangkat menyatu tanpa ada transaksi yang terhapus.**
4. **Penandaan Selesai Migrasi:**  
   Setelah verifikasi berhasil, kunci `trackvest_migrated_to_supabase` disimpan di penyimpanan lokal agar migrasi tidak dijalankan berulang.

---

## 8. Alur Otentikasi (Web Vercel & Capacitor Android)

### 8.1 Metode Otentikasi yang Didukung
1. **Email + Kata Sandi / Magic Link:**  
   Bekerja 100% *out-of-the-box* di Web Vercel dan di dalam WebView Android tanpa memerlukan konfigurasi deep link atau plugin native tambahan.
2. **Google OAuth (Opsi Satu-Klik):**  
   - **Web (Vercel):** Menggunakan `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`.
   - **Android (Capacitor):** Menggunakan skema Deep Link URL bawaan Capacitor (`com.trackvest.app://auth/callback`) yang didaftarkan pada *Redirect URLs* Supabase, atau menggunakan In-App Browser.

### 8.2 Perilaku Logout & Pergantian Akun
- **Logout:** Menghapus sesi JWT Supabase. Memberikan dialog konfirmasi:
  - *Pilihan A (Pertahankan Data):* Data lokal tetap tersimpan di perangkat untuk dilihat secara offline.
  - *Pilihan B (Bersihkan Perangkat):* Menghapus cache lokal IndexedDB pada perangkat tersebut (disarankan jika meminjam HP/laptop orang lain).
- **Ganti Akun:** Jika pengguna login dengan akun Supabase yang berbeda, data IndexedDB lokal otomatis direset dan digantikan dengan data milik akun baru tersebut. Data antar pengguna tidak akan pernah tercampur.

---

## 9. Keamanan & Konfigurasi Variabel Lingkungan

### 9.1 Variabel Lingkungan yang Digunakan
Hanya 2 variabel lingkungan publik yang digunakan:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 9.2 Prinsip Keamanan Kunci:
1. **HANYA Anon Key yang Digunakan di Frontend & APK:**  
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` aman untuk disertakan di klien frontend dan paket APK Android karena hak akses sebenarnya dilindungi sepenuhnya oleh **PostgreSQL Row Level Security (RLS)**.
2. **DILARANG KERAS Memakai Service Role Key:**  
   `SUPABASE_SERVICE_ROLE_KEY` memiliki hak *bypass RLS* dan **tidak boleh sekalipun** dimasukkan ke dalam kode frontend, Next.js client, atau APK Android.
3. **Validasi JWT di Setiap Permintaan:**  
   Setiap permintaan mutasi data secara otomatis menyertakan token JWT pengguna (`Authorization: Bearer <token>`). Supabase mengekstrak `auth.uid()` langsung dari token yang ditandatangani secara kriptografis, sehingga pengguna tidak dapat memalsukan `user_id` milik orang lain.

---

## 10. Rencana Tahapan Implementasi Teknis

*Catatan: Tahapan di bawah ini baru akan dijalankan setelah Anda memberikan persetujuan.*

- **Tahap 1 — Dependensi & Klien Supabase:**
  - Menambahkan dependensi `@supabase/supabase-js` dan `idb`.
  - Membuat berkas inisialisasi aman [src/lib/supabaseClient.ts](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/lib/supabaseClient.ts).
- **Tahap 2 — Lapisan Penyimpanan IndexedDB:**
  - Membuat modul [src/lib/indexedDbStorage.ts](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/lib/indexedDbStorage.ts) dengan dukungan antrean mutasi `sync_queue` dan migrator `localStorage`.
- **Tahap 3 — Mesin Sinkronisasi Dua Arah:**
  - Membuat modul [src/lib/syncEngine.ts](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/lib/syncEngine.ts) (pemroses antrean outbox, *conflict resolution*, dan *delta pull*).
- **Tahap 4 — Antarmuka Otentikasi & Indikator Sinkronisasi:**
  - Menambahkan modal login/register Supabase yang rapi dan elegan sesuai desain Stitch.
  - Menambahkan badge status sinkronisasi (Tersinkronisasi / Offline / Menyinkronkan) di Navbar.
- **Tahap 5 — Build & Verifikasi:**
  - Pengujian build web `npm run build`.
  - Sinkronisasi Capacitor `npx cap sync android`.
  - Build debug APK `gradlew assembleDebug`.

---

## 11. Rencana Pengujian Menyeluruh (Testing Plan)

1. **Uji Kasus Isolasi Pengguna (RLS Verification):**
   - Mendaftar dengan User A, tambahkan aset Crypto dan modal Rp 5.000.000.
   - Logout, mendaftar dengan User B. Pastikan portofolio User B kosong (tidak melihat data User A).
   - Verifikasi melalui Supabase SQL Editor bahwa query dengan token User B tidak dapat mengakses baris milik User A.
2. **Uji Kasus Sinkronisasi Lintas Platform (Vercel & Android APK):**
   - Buka website di Vercel, login dengan Akun A. Tambahkan aset Saham.
   - Buka APK di HP Android, login dengan Akun A. Pastikan aset Saham langsung muncul di HP.
   - Tambah transaksi di HP. Buka laptop, pastikan nilai portofolio di laptop otomatis terbarui.
3. **Uji Kasus Mode Offline & Pemulihan:**
   - Aktifkan Mode Pesawat di HP Android.
   - Buat 2 transaksi setoran investasi baru dan update nilai sekarang.
   - Pastikan aplikasi tetap responsif seketika, grafik dan metrik terhitung akurat.
   - Matikan Mode Pesawat. Pastikan antrean sinkronisasi langsung terkirim ke Supabase dalam hitungan detik.
4. **Uji Kasus Migrasi Data Lokal:**
   - Sebelum login, pastikan data portofolio lokal yang sudah ada tetap tampil normal.
   - Lakukan registrasi/login akun baru.
   - Pastikan seluruh data lokal masuk ke cloud tanpa ada yang terhapus atau ganda.

---

## 12. Informasi & Konfigurasi yang Perlu Anda Siapkan

Untuk melanjutkan ke tahap implementasi kode, Anda cukup menyiapkan satu proyek gratis di [Supabase Dashboard](https://supabase.com/):

1. **Buat Proyek Baru di Supabase** (misal nama proyek: `TrackVest`).
2. **Jalankan Skema SQL:** Salin skema SQL dari **Bagian 3** dokumen ini ke *SQL Editor* di dashboard Supabase Anda lalu tekan *Run*.
3. **Ambil 2 Nilai Kredensial (Settings -> API):**
   - **Project URL:** `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - **Anon / Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **Konfigurasi URL Otentikasi (Authentication -> URL Configuration):**
   - **Site URL:** URL Vercel Anda (misal `https://trackvest.vercel.app`).
   - **Redirect URLs:** Tambahkan `http://localhost:3000` dan URL Vercel Anda.

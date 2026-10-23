# TrackVest — Panduan Konfigurasi Supabase & Sinkronisasi Cross-Platform

Dokumentasi ini menjelaskan konfigurasi lengkap untuk integrasi **Supabase Authentication**, **Database PostgreSQL**, **Row Level Security (RLS)**, dan **Sinkronisasi Dua Arah** antara Website (Vercel) dan Aplikasi Android (Capacitor).

---

## 1. Menjalankan Skema Database & RLS

1. Masuk ke dashboard proyek Supabase Anda: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Pilih proyek Anda, lalu buka menu **SQL Editor** pada sidebar kiri.
3. Salin seluruh isi file **[`supabase/schema.sql`](supabase/schema.sql)**.
4. Klik tombol **Run** (atau tekan `Ctrl + Enter`).
5. Pastikan query berhasil dieksekusi (*Success. No rows returned*).

### Tabel yang dibuat:
- `public.profiles`: Profil investor (`id`, `full_name`, `last_valuation_time`, `updated_at`).
- `public.assets`: Instrumen aset (`id`, `user_id`, `name`, `category`, `color`, `icon`, `deleted_at`).
- `public.investments`: Catatan setoran modal investasi (`id`, `user_id`, `asset_id`, `date`, `amount`, `note`, `deleted_at`).
- `public.snapshots`: Snapshot historis portofolio (`id`, `user_id`, `date`, `total_invested`, `total_value`, `total_profit`, `total_return_percent`, `assets`, `deleted_at`).
- `public.latest_valuations`: Valuasi pasar terkini per aset (`user_id`, `asset_id`, `current_value`, `updated_at`).

Semua tabel memiliki **Row Level Security (RLS)** aktif dan hak akses tabel telah dikeraskan (*hardened*): role `anon` dicabut dari akses tabel dan role `authenticated` diberikan hak CRUD yang disaring strictly per `auth.uid()`.

---

## 2. Pengaturan Supabase Authentication

Buka menu **Authentication** $\rightarrow$ **URL Configuration** di dashboard Supabase:

### A. Site URL
- Untuk produksi (Vercel): masukkan domain produksi TrackVest Anda, contoh:
  `https://trackvest.vercel.app` (atau domain kustom Anda).

### B. Redirect URLs
Tambahkan seluruh URL callback yang valid untuk Vercel, pengembangan lokal, dan Capacitor Android:
- `http://localhost:3000/**`
- `http://localhost:3000/`
- `https://trackvest.vercel.app/**`
- `https://*.vercel.app/**`
- `capacitor://localhost/**`
- `http://localhost/**`

### C. Pengaturan Email Provider
Buka **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Email**:
- **Enable Email Provider**: `ON`
- **Confirm email**:
  - Jika `OFF` (opsional untuk kemudahan pengujian): pengguna dapat langsung login segera setelah mendaftar tanpa harus membuka tautan email.
  - Jika `ON`: pengguna akan menerima email konfirmasi sebelum dapat login. TrackVest telah menangani status "Email belum dikonfirmasi" secara otomatis.

---

## 3. Variabel Lingkungan (Environment Variables)

### A. Pengembangan Lokal & Build APK Android
File `.env.local` berada di root proyek (sudah otomatis diabaikan oleh `.gitignore`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://kasydcfneffanqqctpdf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_5fppu5bHNWnjqrInJ2TM0Q_rxMImUku
```

> [!IMPORTANT]
> Jangan pernah memasukkan `service_role` key atau Supabase Secret key ke dalam file `.env.local`, kode frontend, maupun proyek Android. Proyek hanya menggunakan Publishable / Anon Key yang dilindungi oleh RLS.

### B. Deployment di Vercel
Saat mendeploy proyek ke Vercel:
1. Buka **Project Settings** di Vercel Dashboard $\rightarrow$ **Environment Variables**.
2. Tambahkan:
   - Key: `NEXT_PUBLIC_SUPABASE_URL` | Value: `https://kasydcfneffanqqctpdf.supabase.co`
   - Key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Value: `sb_publishable_5fppu5bHNWnjqrInJ2TM0Q_rxMImUku`
3. Pilih Environment: `Production`, `Preview`, `Development`.
4. Trigger redeploy (*Redeploy without cache*) agar variabel terinjeksi ke hasil build statis.

---

## 4. Alur Sinkronisasi & Local-First (IndexedDB)

1. **Local-First:** Semua operasi tambah modal, ubah valuasi, tambah aset, dan snapshot langsung disimpan ke IndexedDB perangkat (`trackvest_local_db`). Dashboard tetap cepat terbuka tanpa menunggu request jaringan.
2. **Offline Resilience:** Bila perangkat kehilangan koneksi internet:
   - Data tersimpan lokal.
   - Status berubah menjadi **Offline** dengan indikator antrean perubahan.
   - Perubahan masuk ke `sync_queue` IndexedDB.
3. **Auto-Sync:** Ketika internet kembali:
   - Listener browser/Capacitor otomatis memicu `syncService.triggerSync()`.
   - Mengirim antrean lokal (*push*) secara idempotent via `upsert`.
   - Mengambil data terbaru (*pull*) dari cloud Supabase.
4. **Isolasi Multi-Pengguna:**
   - Semua record di IndexedDB diindeks berdasarkan `userId`.
   - Saat logout, antrean dan data akun lama dipisahkan, sehingga tidak pernah tampil ke akun lain.
5. **Migrasi Aman Data Lama:**
   - Pengguna dengan data lama di `localStorage` akan otomatis dimigrasikan ke akun Supabase saat pertama kali login.
   - Salinan cadangan otomatis dibuat di `trackvest_backup_before_migration`.

---

## 5. Prosedur Uji Coba Sinkronisasi

1. Buka website TrackVest, klik tombol **Masuk** di pojok kanan atas.
2. Pilih tab **Daftar Akun**, masukkan nama, email, dan kata sandi (minimal 6 karakter).
3. Setelah masuk, tambahkan satu transaksi investasi baru di menu **Tambah Modal**.
4. Periksa indikator status di navbar: badge akan berubah dari **Menyinkronkan...** menjadi **Tersinkron**.
5. Buka dashboard Supabase $\rightarrow$ **Table Editor** $\rightarrow$ tabel `investments`: pastikan baris transaksi baru telah muncul dengan `user_id` yang sesuai.
6. Buka aplikasi Android APK TrackVest pada ponsel/emulator, login dengan akun yang sama: transaksi yang dicatat di web akan langsung tersinkronisasi ke aplikasi Android.


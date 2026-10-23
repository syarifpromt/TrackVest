# Laporan Audit Pembersihan Proyek TrackVest (`CLEANUP_REPORT.md`)

*Tanggal Audit: 23 Oktober 2026*  
*Prinsip Utama: Kestabilan proyek adalah prioritas nomor satu. Website, APK, konfigurasi, data investasi, dan proses build harus tetap 100% berfungsi.*

---

## 1. Ringkasan Eksekutif & Struktur Ukuran Proyek

Audit menyeluruh telah dilakukan pada seluruh folder dan file di root proyek TrackVest. Berikut adalah distribusi ukuran file proyek saat ini:

| Direktori / Komponen | Ukuran | Jumlah File | Keterangan |
| :--- | :--- | :--- | :--- |
| `node_modules/` | 485.92 MB | 20.167 file | Dependencies library & CLI (Next.js, React, Capacitor, TS) |
| `.next/` | 157.95 MB | 150 file | Cache internal compiler Next.js & bundle development |
| `android/` | 22.03 MB | 651 file | Proyek Android Studio, Gradle, resource ikon, dan output APK |
| `out/` | 1.06 MB | 27 file | Output static export web produksi (dibutuhkan Capacitor) |
| `src/` | 249.06 KB | 19 file | Seluruh source code aplikasi (komponen, lib, kalkulasi, UI) |
| `package-lock.json` | 166.38 KB | 1 file | Lockfile dependensi NPM |
| `tsconfig.tsbuildinfo` | 97.78 KB | 1 file | Cache kompilasi inkremental TypeScript |
| `assets/` | 74.72 KB | 3 file | Aset master ikon resolusi tinggi (1024×1024 px) |
| `public/` | 70.72 KB | 5 file | Aset ikon koin & logo untuk antarmuka web |
| Dokumentasi (`PRD`, `DESIGN`, `README`) | ~33.21 KB | 3 file | Dokumentasi arsitektur, PRD, dan panduan proyek |
| File Konfigurasi Root | ~3.8 KB | 7 file | `package.json`, `next.config.js`, `capacitor.config.ts`, dll. |

---

## 2. Klasifikasi File & Hasil Audit

### Kategori A — Aman Dihapus (Benar-benar Tidak Diperlukan)
File-file berikut merupakan file boilerplate / sampel bawaan template awal Capacitor yang sudah tidak dipakai lagi oleh aplikasi TrackVest:

1. **`android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`** (~1.69 KB)
   - **Alasan:** Berisi vector drawable default starter Capacitor (ikon robot). Tidak lagi digunakan karena ikon Android TrackVest kini telah diganti menggunakan adaptive icon dan mipmap PNG TrackVest (`@mipmap/ic_launcher_foreground`).
   - **Dampak jika dihapus:** Tidak ada dampak negatif. Sistem Android 8.0+ menggunakan mipmap PNG di folder `res/mipmap-*/`.
   - **Bisa dibuat ulang:** Ya (merupakan template standar Capacitor).

2. **`android/app/src/main/res/drawable/ic_launcher_background.xml`** (~5.69 KB)
   - **Alasan:** Berisi vector latar belakang grid bawaan Capacitor. Tidak lagi digunakan karena adaptive icon TrackVest sekarang merujuk ke `@mipmap/ic_launcher_background` dan `@color/ic_launcher_background` (`#0F766E`).
   - **Dampak jika dihapus:** Tidak ada dampak negatif.
   - **Bisa dibuat ulang:** Ya.

3. **`android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`** (~527 B)
   - **Alasan:** File contoh unit test dummy dari generator Capacitor (`2 + 2 = 4`) dengan package `com.getcapacitor.myapp` yang tidak digunakan oleh TrackVest.
   - **Dampak jika dihapus:** Tidak ada dampak pada build APK atau aplikasi.
   - **Bisa dibuat ulang:** Ya.

4. **`android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`** (~828 B)
   - **Alasan:** File instrumented test contoh bawaan generator yang menguji package `com.getcapacitor.app` (bukan package TrackVest `com.trackvest.app`).
   - **Dampak jika dihapus:** Tidak ada dampak pada aplikasi.
   - **Bisa dibuat ulang:** Ya.

---

### Kategori B — File Sementara / Cache yang Bisa Dibuat Ulang (Dengan Konsekuensi Tertentu)

1. **`tsconfig.tsbuildinfo`** (~97.78 KB)
   - **Lokasi:** Root project
   - **Alasan:** Cache kompilasi inkremental TypeScript.
   - **Dampak jika dihapus:** Pada build berikutnya (`npm run build`), TypeScript akan memeriksa seluruh tipe dari nol (memerlukan waktu ~0.5 detik lebih lama), lalu file ini otomatis dibuat kembali. Sangat aman dihapus jika ingin membersihkan root.
   - **Bisa dibuat ulang:** Ya, otomatis saat kompilasi TypeScript berikutnya.

2. **`.next/`** (~157.95 MB)
   - **Lokasi:** Root project
   - **Alasan:** Cache server dev dan kompilasi dev Next.js.
   - **Dampak jika dihapus:**
     - **PENTING:** Jika server `npm run dev` sedang berjalan, menghapus folder ini akan menyebabkan dev server error sampai di-restart.
     - Jika dev server dimatikan terlebih dahulu, penghapusan folder ini aman dan menghemat ~158 MB ruang disk. Next.js akan membuat ulang folder ini dalam waktu ~2 detik saat `npm run dev` dijalankan lagi.
   - **Bisa dibuat ulang:** Ya, otomatis saat `npm run dev` atau `npm run build`.

3. **`out/`** (~1.06 MB)
   - **Lokasi:** Root project
   - **Alasan:** Output static export HTML/JS/CSS untuk aplikasi web dan sumber sinkronisasi Capacitor (`webDir: 'out'`).
   - **Dampak jika dihapus:** Perintah `npx cap sync android` akan gagal jika folder ini tidak ada.
   - **Bisa dibuat ulang:** Ya, dapat dibuat ulang kapan saja dengan menjalankan `npm run build`.

4. **`android/.gradle/`** (~1.68 MB)
   - **Lokasi:** `android/.gradle/`
   - **Alasan:** Cache task daemon Gradle dan riwayat eksekusi.
   - **Dampak jika dihapus:** Build Gradle pertama berikutnya akan memakan waktu 2–3 detik lebih lama karena harus menginisialisasi cache baru.
   - **Bisa dibuat ulang:** Ya, otomatis saat `gradlew assembleDebug`.

5. **`android/build/`** (~127.38 KB)
   - **Lokasi:** `android/build/`
   - **Alasan:** Cache build root Gradle.
   - **Dampak jika dihapus:** Dibuat ulang otomatis saat build.
   - **Bisa dibuat ulang:** Ya, otomatis.

6. **`android/app/build/` (Kecuali File APK!)** (~14 MB file perantara)
   - **Lokasi:** `android/app/build/`
   - **Alasan:** File objek sementara kompilasi Android (DEX, R.jar, intermediate merged resources).
   - **PERINGATAN KRITIS:** Di dalam direktori ini tersimpan file **`android/app/build/outputs/apk/debug/app-debug.apk`** (~4.88 MB). Jika seluruh folder `android/app/build/` dihapus (misalnya menggunakan `./gradlew clean`), file APK debug yang sudah jadi akan hilang dan harus di-compile ulang.
   - **Rekomendasi:** Jangan hapus folder ini kecuali jika file APK dipindahkan terlebih dahulu atau siap di-compile ulang via Gradle.
   - **Bisa dibuat ulang:** Ya, dengan perintah `gradlew assembleDebug`.

7. **`android/app/src/main/assets/public/`** (~1.06 MB)
   - **Lokasi:** `android/app/src/main/assets/public/`
   - **Alasan:** Hasil sinkronisasi otomatis web assets dari folder `out/` oleh Capacitor.
   - **Dampak jika dihapus:** APK Android tidak memiliki tampilan web sebelum dijalankan `npx cap sync android`.
   - **Bisa dibuat ulang:** Ya, otomatis via `npx cap sync android`.

---

### Kategori C — File yang Wajib Dipertahankan (DILINDUNGI PENUH)

Komponen berikut dilarang keras dihapus atau dimodifikasi karena merupakan inti fungsionalitas TrackVest:

1. **Seluruh Source Code Aplikasi (`src/` — 19 file, 249.06 KB):**
   - Komponen UI (`AssetTable`, `PerformanceChart`, `MetricCard`, `Navbar`, dll.)
   - Seluruh Modal (`AddInvestmentModal`, `CheckPortfolioModal`, `EditProfileModal`, `ManageAssetsModal`, `SnapshotDetailModal`)
   - Logika Bisnis & Formula Investasi (`src/lib/calculations.ts`)
   - Penyimpanan Data & IndexedDB/LocalStorage (`src/lib/storage.ts`)
   - Tipe Data TypeScript (`src/types/index.ts`)
2. **File Konfigurasi Build & Lingkungan:**
   - `package.json` dan `package-lock.json` (semua dependensi terpakai 100%)
   - `next.config.js` (konfigurasi export static Next.js untuk Capacitor)
   - `tsconfig.json` & `next-env.d.ts` (konfigurasi TypeScript)
   - `tailwind.config.js` & `postcss.config.js` (styling sistem Tailwind)
   - `capacitor.config.ts` (konfigurasi appId `com.trackvest.app` dan webDir)
   - `.gitignore` (konfigurasi pengabaian Git)
3. **Dependensi Node (`node_modules/` — 485.92 MB):**
   - Diperlukan untuk kompilasi web, runtime dev, TypeScript checking, dan Capacitor sync.
4. **Proyek Native Android (`android/`):**
   - `android/local.properties` (berisi lokasi Android SDK untuk komputer ini — *sangat vital*)
   - `android/app/build.gradle`, `android/build.gradle`, `android/settings.gradle`
   - Wrapper Gradle (`android/gradlew`, `android/gradlew.bat`, `android/gradle/wrapper/`)
   - `android/app/src/main/AndroidManifest.xml` & `MainActivity.java`
   - `android/app/src/main/res/` (seluruh drawable splash, string, style, serta ikon adaptive TrackVest di seluruh folder `mipmap-*`)
   - `android/app/build/outputs/apk/debug/app-debug.apk` (file APK yang sudah berfungsi)
5. **Aset Master Ikon Resolusi Tinggi (`assets/` — 74.72 KB):**
   - `assets/icon-only.png`, `assets/icon-background.png`, `assets/icon-foreground.png` (sumber 1024×1024 px untuk `@capacitor/assets generate --android`).
6. **Aset Gambar Web Publik (`public/`):**
   - `public/icons/btc.png`, `emas.png`, `voo.png`, `logo-badge.png`.
7. **Dokumentasi Proyek:**
   - `PRD_Personal_Investment_Portfolio_Tracker_v1.0.md`, `DESIGN.md`, `README.md`.

---

### Kategori D — File yang Perlu Pertimbangan Khusus

1. **`public/icons/logo.png`** (16.88 KB, 480×240 px)
   - **Status:** Banner logo horizontal TrackVest (lambang + tipografi nama aplikasi).
   - **Kondisi:** Saat ini Navbar website menggunakan `logo-badge.png` (lambang) dipadukan dengan tipografi SVG/HTML, sehingga `logo.png` tidak dipanggil langsung di kode antarmuka.
   - **Rekomendasi:** **Tetap pertahankan.** Ukurannya sangat kecil (16.88 KB) dan berguna sebagai master logo banner untuk favicon, OpenGraph metadata sharing, atau keperluan branding ke depan.

---

## 3. Matriks Dampak & Risiko Tindakan

| File / Folder | Kategori | Ruang Dihemat | Risiko | Rekomendasi Antigravity |
| :--- | :---: | :---: | :---: | :--- |
| `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` | A | ~1.7 KB | **Nol (Aman)** | Hapus (boilerplate lama Capacitor) |
| `android/app/src/main/res/drawable/ic_launcher_background.xml` | A | ~5.7 KB | **Nol (Aman)** | Hapus (boilerplate lama Capacitor) |
| `android/app/src/test/.../ExampleUnitTest.java` | A | ~0.5 KB | **Nol (Aman)** | Hapus (test dummy template) |
| `android/app/src/androidTest/.../ExampleInstrumentedTest.java` | A | ~0.8 KB | **Nol (Aman)** | Hapus (test dummy template) |
| `tsconfig.tsbuildinfo` | B | ~98 KB | **Nol (Aman)** | Hapus (dibuat ulang saat build) |
| `.next/` | B | ~158 MB | **Rendah** | Hapus hanya jika ingin hemat disk & dev server sedang mati |
| `out/` | B | ~1.06 MB | **Sedang** | **Pertahankan** (dibutuhkan Capacitor sync) |
| `android/app/build/` | B | ~18.9 MB | **Tinggi (Menghapus APK)** | **Pertahankan** agar file APK tidak hilang |
| `public/icons/logo.png` | D | ~16.9 KB | **Sangat Rendah** | **Pertahankan** untuk aset branding |
| `src/`, `android/`, `assets/`, `package.json` | C | - | **Kritis (Merusak App)** | **LINDUNGI PENUH (Jangan Dihapus)** |

---

## 4. Rekomendasi Pembersihan Paling Aman dan Minimal

Jika Anda ingin proyek bersih dan rapi tanpa mengambil risiko apa pun terhadap website dan APK:

### Opsi 1: Pembersihan Paling Aman (Rekomendasi Utama — Zero Risk)
Hapus hanya file Kategori A (boilerplate tidak terpakai) dan cache TypeScript:
- Hapus `tsconfig.tsbuildinfo` (root)
- Hapus `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
- Hapus `android/app/src/main/res/drawable/ic_launcher_background.xml`
- Hapus `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`
- Hapus `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`

*Hasil Opsi 1:* Proyek menjadi bersih dari file bawaan dummy tanpa menyentuh cache aktif, dev server tetap berjalan lancar, dan APK tetap aman di tempatnya.

### Opsi 2: Pembersihan Ringan + Ruang Disk (~158 MB)
Jika Anda juga ingin mengosongkan ruang disk dari cache kompilasi dev:
- Matikan dev server terlebih dahulu.
- Jalankan Opsi 1 + hapus folder `.next/`.
- Folder `.next/` akan otomatis ter-generate ulang secara bersih saat Anda menjalankan `npm run dev` atau `npm run build` kembali.

---

## 5. Status Pelaksanaan Pembersihan

Berdasarkan keputusan pengguna (*"icon seperti emas btc dan voo itu hapus saja, kan user upload sendiri icon investasinya"*), pembersihan aman telah berhasil dilaksanakan:

1. **Aset Ikon Default (`public/icons/`):**
   - File `public/icons/btc.png`, `public/icons/emas.png`, dan `public/icons/voo.png` **telah dihapus**.
   - Kode pemanggil di [src/components/AssetIcon.tsx](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/components/AssetIcon.tsx) telah disesuaikan agar jika pengguna tidak mengunggah ikon kustom, sistem otomatis menampilkan monogram/inisial aset berlatar warna kustom tanpa memicu gambar pecah (*broken image*).
   - Modal [src/components/Modals/ManageAssetsModal.tsx](file:///d:/Syarif/My%20Data/web%20and%20apps/TrackVest/src/components/Modals/ManageAssetsModal.tsx) telah diperbarui untuk mereset ikon ke inisial.

2. **File Boilerplate Lama Capacitor (Kategori A):**
   - File `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` **telah dihapus**.
   - File `android/app/src/main/res/drawable/ic_launcher_background.xml` **telah dihapus**.
   - Folder dummy test `android/app/src/test` dan `android/app/src/androidTest` **telah dihapus**.

3. **Cache Inkremental TypeScript:**
   - File `tsconfig.tsbuildinfo` di root project **telah dihapus**.

4. **File yang Tetap Dilindungi Penuh:**
   - Seluruh source code aktif `src/`, konfigurasi build, aset master `assets/`, dependensi `node_modules/`, dan file APK `android/app/build/outputs/apk/debug/app-debug.apk` tetap aman dan utuh.



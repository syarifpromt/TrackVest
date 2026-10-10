# TrackVest — Personal Investment Portfolio Tracker

> **Tagline:** *Track your investments simply.*  
> Dibangun berdasarkan spesifikasi **PRD v1.0** (`PRD_Personal_Investment_Portfolio_Tracker_v1.0.md`) dan desain sistem **Emerald Minimal Capital** dari Google Stitch (`DESIGN.md`).

---

## 🚀 Teknologi yang Digunakan

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) dengan palet *Emerald Minimal Capital*
- **Typography:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) dengan OpenType Tabular Figures (`tabular-nums`)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Penyimpanan Data:** Persistent Browser `localStorage` dengan fitur Cadangkan (Export JSON), Pulihkan (Import JSON), dan Reset data.

---

## 📦 Menjalankan Proyek

### 1. Jalankan Mode Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 2. Build untuk Produksi
```bash
npm run build
npm run start
```

---

## ✨ Fitur Utama (Sesuai PRD V1.0)

1. **Dashboard Portfolio:**
   - **3 Kartu Metrik Utama:** Total Nilai Portfolio (Nilai Sekarang), Modal Diinvestasikan, dan Total Profit / Loss (Rupiah & Return %).
   - **Alokasi Portfolio (Donut Chart & Breakdown):** Diagram alokasi aset interaktif dengan persentase dan nilai nominal Rupiah.
   - **Grafik Tren Return (%):** Visualisasi perkembangan return portfolio antar tanggal snapshot.
   - **Tabel Daftar Aset:** Ringkasan komprehensif modal, nilai sekarang, profit/loss, return, dan alokasi per aset.
2. **Cek & Hitung Portfolio (Fitur Inti):**
   - User memasukkan estimasi nilai sekarang secara manual tanpa memerlukan koneksi API harga pihak ketiga.
   - Kalkulasi instan otomatis di sisi browser untuk Profit/Loss (Rp & %) per aset maupun portfolio keseluruhan.
   - Pilihan tanggal evaluasi dan deteksi duplikasi snapshot.
3. **Simpan & Riwayat Snapshot:**
   - Pembekuan (*freeze*) kondisi portfolio pada tanggal tertentu.
   - Riwayat snapshot tersimpan dan dapat diklik untuk melihat rincian kondisi tiap aset di masa lampau.
4. **Pencatatan Investasi Modal:**
   - Formulir input cepat: Tanggal, Pilihan Aset, Nominal dengan format Rupiah otomatis (`Rp`), dan Catatan opsional.
5. **Dua Tab Riwayat:**
   - **Riwayat Investasi:** Daftar seluruh transaksi setoran modal dengan pencarian dan filter per aset.
   - **Riwayat Snapshot:** Rekaman evaluasi portfolio historis.
6. **Kelola Instrumen Aset:**
   - Dukungan aset bawaan (BTC, Gold, Saham, ETF) serta kemampuan menambahkan instrumen kustom (nama, kategori, warna).
7. **Cadangkan & Pulihkan (Backup & Restore):**
   - Ekspor seluruh data ke file JSON atau impor data cadangan untuk keamanan data pengguna.


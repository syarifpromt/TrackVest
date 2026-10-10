# PRD — TrackVest
## Personal Investment Portfolio Tracker
### Version 1.0

## 1. Overview

TrackVest adalah website sederhana untuk menggantikan pencatatan portfolio investasi yang sebelumnya dilakukan menggunakan Excel/Google Sheets.

Tujuan utama website bukan untuk trading, analisis pasar, atau mengambil data harga otomatis. Website hanya berfungsi sebagai **tracker portfolio pribadi** yang memudahkan user untuk:

1. mencatat modal yang diinvestasikan;
2. melihat total portfolio;
3. memasukkan nilai aset saat ini secara manual;
4. menghitung profit/loss dalam Rupiah dan persentase;
5. melihat pembagian portfolio berdasarkan aset;
6. melakukan pengecekan portfolio pada tanggal tertentu;
7. menyimpan hasil pengecekan sebagai **snapshot/record**, sehingga kondisi portfolio pada tanggal tersebut dapat dilihat kembali.

---

## 2. Product Goal

Membuat pencatatan portfolio investasi menjadi lebih mudah daripada Excel/Google Sheets, dengan proses:

**Catat investasi → Cek nilai sekarang → Bandingkan dengan modal → Simpan hasil → Lihat histori**

Website harus terasa seperti **buku catatan portfolio digital** dengan tampilan modern, sederhana, dan nyaman digunakan dari desktop maupun Android/mobile browser.

---


## 2.1 Product Identity

**Product Name:** TrackVest

**Category:** Personal Investment Portfolio Tracker

**Tagline:** Track your investments simply.

TrackVest adalah aplikasi pribadi untuk mencatat dan memantau perkembangan portfolio investasi secara manual tanpa fitur trading atau analisis pasar yang kompleks.

## 3. Target User

### Primary User
Investor pribadi yang ingin mencatat perkembangan portfolio secara manual.

### Karakteristik
- Tidak membutuhkan fitur trading.
- Tidak membutuhkan koneksi ke broker/exchange.
- Terbiasa mencatat investasi di Excel/Google Sheets.
- Ingin input yang cepat.
- Ingin melihat profit/loss dengan mudah.
- Ingin mengetahui kondisi portfolio pada tanggal tertentu.

---

## 4. Scope V1.0

### Termasuk
- Dashboard portfolio.
- Tambah investasi/modal.
- Daftar aset.
- Update/check nilai investasi saat ini.
- Perhitungan profit/loss.
- Perhitungan return (%).
- Perhitungan alokasi portfolio.
- Snapshot portfolio berdasarkan tanggal.
- Riwayat snapshot.
- Detail snapshot per aset.
- Responsive design untuk desktop dan mobile.
- Data disimpan secara persistent.

### Tidak termasuk
- Harga pasar real-time.
- API Bitcoin, emas, saham, atau ETF.
- Integrasi rekening/bank.
- Integrasi exchange/broker.
- Fitur beli/jual aset melalui aplikasi.
- Trading.
- Notifikasi harga.
- Financial advice.
- Analisis fundamental/teknikal.
- Pajak.
- Perhitungan realized P/L yang kompleks.
- Multi-user atau collaboration.

---

# 5. Konsep Data

V1.0 menggunakan konsep sederhana.

## 5.1 Aset

Contoh aset:

- BTC
- Gold/Emas
- Saham
- ETF

User dapat menggunakan aset yang sudah tersedia dan dapat menambahkan nama aset lain bila diperlukan.

Contoh:

```text
BTC
Gold
Saham
ETF
```

---

## 5.2 Investasi

Investasi adalah modal yang dimasukkan user ke suatu aset.

Contoh:

```text
Tanggal: 12 Januari 2026
Aset: Gold
Nominal: Rp500.000
```

Setiap investasi akan menambah total modal aset tersebut.

---

## 5.3 Current Value

Current Value adalah nilai investasi aset yang user masukkan secara manual ketika melakukan pengecekan.

Contoh:

```text
BTC
Modal: Rp1.000.000
Nilai sekarang: Rp1.120.000
```

Website menghitung:

```text
Profit/Loss = Nilai Sekarang - Modal

Return (%) = ((Nilai Sekarang - Modal) / Modal) × 100
```

---

## 5.4 Snapshot

Snapshot adalah **rekaman kondisi portfolio pada satu tanggal tertentu**.

Contoh:

```text
30 Januari 2026

BTC  : Rp1.120.000
Gold : Rp1.485.000
ETF  : Rp2.080.000

Portfolio:
Modal       Rp4.500.000
Nilai       Rp4.685.000
Profit      Rp185.000
Return      +4,11%
```

Snapshot harus menyimpan kondisi pada saat user menekan tombol **Simpan Snapshot**.

Perubahan data di hari berikutnya tidak boleh mengubah snapshot lama.

---

# 6. Core User Flow

## Flow A — Menambahkan investasi

```text
Dashboard
   ↓
Tambah Investasi
   ↓
Pilih Aset
   ↓
Masukkan Tanggal
   ↓
Masukkan Nominal
   ↓
Simpan
   ↓
Total Modal & Portfolio diperbarui
```

### Input

- Tanggal
- Aset
- Nominal investasi
- Catatan (opsional)

### Contoh

```text
Tanggal : 12/01/2026
Aset    : Gold
Nominal : Rp500.000
Catatan : Investasi rutin
```

---

# 7. Core Feature — Cek Portfolio

Fitur ini merupakan fitur utama aplikasi.

User dapat melakukan pengecekan kondisi portfolio pada hari tertentu.

## Flow

```text
Dashboard
   ↓
Cek Portfolio
   ↓
Pilih / Konfirmasi Tanggal
   ↓
Masukkan Nilai Sekarang Setiap Aset
   ↓
Sistem Menghitung P/L
   ↓
Sistem Menghitung P/L %
   ↓
Sistem Menghitung Total Portfolio
   ↓
Sistem Menghitung Alokasi
   ↓
Simpan Snapshot
```

---

## 7.1 Form Cek Portfolio

Contoh:

```text
Cek Portfolio

Tanggal
[ 30 Januari 2026 ]

BTC
Nilai sekarang
[ Rp1.120.000 ]

Gold
Nilai sekarang
[ Rp1.485.000 ]

ETF
Nilai sekarang
[ Rp2.080.000 ]

[ Simpan Snapshot ]
```

User **tidak perlu memasukkan profit/loss secara manual**.

Semua hasil dihitung otomatis.

---

# 8. Perhitungan Portfolio

Misalnya data:

```text
BTC
Modal = Rp1.000.000
Nilai sekarang = Rp1.120.000

Gold
Modal = Rp1.500.000
Nilai sekarang = Rp1.485.000

ETF
Modal = Rp2.000.000
Nilai sekarang = Rp2.080.000
```

Maka:

```text
Total Modal = Rp4.500.000

Total Nilai Sekarang = Rp4.685.000

Total Profit = Rp185.000

Return Portfolio =
(185.000 / 4.500.000) × 100
= 4,11%
```

---

# 9. Perhitungan per Aset

Untuk setiap aset:

### Profit/Loss Rupiah

```text
P/L = Current Value - Total Invested
```

### Return Persentase

```text
Return % =
((Current Value - Total Invested) / Total Invested) × 100
```

### Contoh

```text
Gold

Modal       Rp1.500.000
Nilai       Rp1.485.000

P/L         -Rp15.000
Return      -1,00%
```

UI harus membedakan nilai positif dan negatif secara visual.

---

# 10. Alokasi Portfolio

Alokasi menggunakan **nilai portfolio saat ini**.

Rumus:

```text
Alokasi Aset (%) =
Nilai Aset / Total Nilai Portfolio × 100
```

Contoh:

```text
BTC  = Rp1.120.000
Gold = Rp1.485.000
ETF  = Rp2.080.000

Total = Rp4.685.000
```

Maka website menampilkan persentase masing-masing aset.

Tampilan dapat menggunakan:

- Donut chart
- Persentase
- Nilai Rupiah

Contoh:

```text
BTC   23,9%
Gold  31,7%
ETF   44,4%
```

---

# 11. Dashboard

Dashboard adalah halaman utama dan harus langsung menunjukkan informasi paling penting.

## Struktur

```text
MY PORTFOLIO

Total Modal
Rp4.500.000

Nilai Sekarang
Rp4.685.000

Profit
+Rp185.000

Return
+4,11%
```

Kemudian:

```text
ALOKASI PORTFOLIO

BTC    23,9%
Gold   31,7%
ETF    44,4%
```

Kemudian daftar aset:

```text
BTC
Rp1.120.000
+12,00%

Gold
Rp1.485.000
-1,00%

ETF
Rp2.080.000
+4,00%
```

Tombol utama:

```text
[ + Tambah Investasi ]
[ Cek Portfolio ]
```

---

# 12. Riwayat Investasi

Riwayat investasi menampilkan semua transaksi modal.

Contoh:

```text
12 Jan 2026
Gold
+ Rp500.000

10 Jan 2026
BTC
+ Rp1.000.000

10 Jan 2026
ETF
+ Rp2.000.000
```

User dapat melihat:

- tanggal;
- aset;
- nominal;
- catatan jika ada.

---

# 13. Riwayat Snapshot

Semua hasil "Cek Portfolio" yang disimpan akan masuk ke histori.

Contoh:

```text
RIWAYAT PORTFOLIO

30 Januari 2026
Portfolio +4,11%

07 Februari 2026
Portfolio +7,02%

20 Februari 2026
Portfolio +10,34%
```

Ketika snapshot diklik:

```text
30 Januari 2026

BTC
+12,00%

Gold
-1,00%

ETF
+4,00%

----------------

Portfolio
+4,11%
```

Snapshot juga menyimpan nilai Rupiah pada tanggal tersebut.

---

# 14. Grafik Perkembangan

V1.0 dapat menampilkan grafik sederhana berdasarkan snapshot.

Contoh:

```text
Return Portfolio

30 Jan     +4,11%
07 Feb     +7,02%
20 Feb    +10,34%
```

Grafik bertujuan untuk melihat perkembangan portfolio dari waktu ke waktu.

Tidak perlu menggunakan candlestick atau grafik trading.

---

# 15. Struktur Halaman

Website V1.0 cukup memiliki 2 halaman utama:

## 15.1 Dashboard

Berisi:

- Total modal
- Nilai sekarang
- Profit/Loss
- Return
- Alokasi aset
- Ringkasan aset
- Tombol Tambah Investasi
- Tombol Cek Portfolio

## 15.2 Riwayat

Dapat dibagi menjadi dua tab:

```text
[ Investasi ] [ Snapshot ]
```

### Investasi
Menampilkan transaksi modal.

### Snapshot
Menampilkan rekaman hasil pengecekan portfolio.

Tidak perlu membuat banyak halaman agar aplikasi tetap sederhana.

---

# 16. Responsive Design

Website harus nyaman dipakai pada:

- Desktop
- Laptop
- Tablet
- Android/mobile browser

### Mobile

Layout menggunakan card vertikal.

Contoh:

```text
Total Portfolio
Rp4.685.000

+Rp185.000
+4,11%

[ + Tambah ]
[ Cek Portfolio ]
```

Bottom navigation opsional:

```text
Home | Riwayat
```

---

# 17. Input UX

Input harus cepat dan sederhana.

### Prinsip
- Minim field.
- Gunakan dropdown untuk aset.
- Nominal menggunakan format Rupiah.
- Default tanggal = hari ini.
- Tombol simpan jelas.
- Jangan meminta data yang tidak diperlukan.

### Contoh

```text
Tambah Investasi

Tanggal
[ 12 Jan 2026 ]

Aset
[ Gold ▼ ]

Nominal
[ Rp500.000 ]

Catatan
[ Opsional ]

[ SIMPAN ]
```

---

# 18. Data Model Sederhana

## Asset

```text
id
name
created_at
```

## Investment

```text
id
asset_id
date
amount
note
created_at
```

## Snapshot

```text
id
date
total_invested
total_value
total_profit
total_return_percent
created_at
```

## Snapshot Asset

```text
id
snapshot_id
asset_id
invested_amount
current_value
profit
return_percent
allocation_percent
```

---

# 19. Aturan Bisnis

### 19.1 Total Modal Aset

```text
Total Investasi Aset =
SUM seluruh investasi untuk aset tersebut
```

### 19.2 Total Modal Portfolio

```text
Total Modal =
SUM total modal seluruh aset
```

### 19.3 Total Nilai Portfolio

```text
Total Nilai =
SUM current value seluruh aset
```

### 19.4 Profit Portfolio

```text
Profit =
Total Nilai - Total Modal
```

### 19.5 Return Portfolio

```text
Return % =
((Total Nilai - Total Modal) / Total Modal) × 100
```

### 19.6 Alokasi

```text
Allocation % =
Current Value Aset / Total Nilai × 100
```

---

# 20. Edge Cases

### Belum ada investasi
Dashboard menampilkan:

```text
Belum ada portfolio

[ + Tambah Investasi ]
```

### Aset memiliki modal tetapi belum dicek
Current value dapat ditampilkan sebagai:

```text
Belum diisi
```

dan jangan menganggapnya otomatis memiliki nilai 0 untuk tampilan user.

### Modal = 0
Return % tidak dihitung untuk menghindari pembagian dengan nol.

### Nilai sekarang lebih kecil dari modal
Tampilkan P/L negatif dengan jelas.

Contoh:

```text
-Rp97.000
-5,23%
```

### Snapshot dengan tanggal sama
Sistem sebaiknya memberikan pilihan:

```text
Snapshot tanggal ini sudah ada.

[ Ganti Snapshot Lama ]
[ Simpan Sebagai Baru ]
[ Batal ]
```

Untuk V1.0, implementasi paling sederhana dapat menggunakan satu snapshot terakhir per tanggal dan meminta konfirmasi sebelum menimpa.

---

# 21. Prinsip Desain

Website harus:

- minimal;
- cepat;
- bersih;
- mudah dipahami;
- fokus pada angka penting;
- tidak terasa seperti platform trading;
- tidak penuh menu;
- nyaman digunakan lewat HP.

Prioritas visual:

1. Total nilai portfolio
2. Profit/Loss
3. Return %
4. Alokasi aset
5. Daftar aset
6. Riwayat

---

# 22. Teknologi yang Disarankan

Karena website akan digunakan secara pribadi dan ingin sederhana:

### Frontend
Next.js

### Styling
Tailwind CSS

### Database
Supabase

### Deployment
Vercel

### PWA
Dapat ditambahkan agar website dapat di-install ke Android melalui browser.

Tidak diperlukan API harga pada V1.0.

---

# 23. MVP Acceptance Criteria

V1.0 dianggap selesai jika:

- [ ] User dapat menambahkan investasi.
- [ ] Total modal per aset dihitung otomatis.
- [ ] Total modal portfolio dihitung otomatis.
- [ ] User dapat memasukkan nilai sekarang tiap aset.
- [ ] Profit/Loss per aset dihitung otomatis.
- [ ] Return % per aset dihitung otomatis.
- [ ] Profit/Loss portfolio dihitung otomatis.
- [ ] Return % portfolio dihitung otomatis.
- [ ] Alokasi aset dihitung otomatis.
- [ ] User dapat menyimpan snapshot.
- [ ] Snapshot menyimpan tanggal.
- [ ] Snapshot menyimpan hasil tiap aset.
- [ ] Snapshot menyimpan hasil portfolio keseluruhan.
- [ ] Snapshot lama tetap dapat dilihat.
- [ ] Riwayat investasi dapat dilihat.
- [ ] Website responsive di Android dan desktop.
- [ ] Input tetap sederhana dan cepat.

---

# 24. Contoh Skenario Utama

## Kondisi Awal

User memiliki:

```text
BTC  = Rp1.000.000
Gold = Rp1.000.000
ETF  = Rp2.000.000
```

Total:

```text
Rp4.000.000
```

## User menambah investasi

Pada 12 Januari:

```text
Gold +Rp500.000
```

Total modal:

```text
BTC  = Rp1.000.000
Gold = Rp1.500.000
ETF  = Rp2.000.000

Total = Rp4.500.000
```

## User melakukan pengecekan pada 30 Januari

Masukkan:

```text
BTC  = Rp1.120.000
Gold = Rp1.485.000
ETF  = Rp2.080.000
```

Website menghasilkan:

```text
Total Modal    Rp4.500.000
Nilai Sekarang Rp4.685.000
Profit         Rp185.000
Return         +4,11%
```

Lalu user menekan:

```text
[Simpan Snapshot]
```

Record tersimpan:

```text
30 Januari 2026

BTC      Rp1.120.000   +12,00%
Gold     Rp1.485.000    -1,00%
ETF      Rp2.080.000    +4,00%

Portfolio              +4,11%
```

Pada pengecekan berikutnya, misalnya 7 Februari, website membuat snapshot baru tanpa menghapus snapshot 30 Januari.

---

# 25. Product Principle

Produk ini harus tetap mengikuti prinsip:

> **"Saya hanya ingin mencatat investasi saya dan tahu perkembangan portfolio saya."**

Jangan menambahkan fitur yang tidak mendukung tujuan tersebut ke dalam V1.0.

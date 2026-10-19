# Dompet Tracker 💰

Aplikasi web modern pencatatan dan monitoring keuangan harian, multi-dompet (*bank, e-wallet, cash*), alokasi anggaran (*budgeting*), dan visualisasi arus kas interaktif berbasis **MERN Stack** dengan estetika **Editorial Warm-Modern UI** (bebas dari kesan *generic AI template*).

---

## 🎨 Design System & Anti-"AI Slop"
- **Primary (Deep Teal):** `#359FA0` (Navigasi aktif, grafik pemasukan, border fokus)
- **Secondary (Soft Mint):** `#8AD6D1` (Badge positif, highlight kartu, progress bar aman)
- **Canvas / Warm Cream:** `#FFF0C5` (Hero Net Worth Card, track progress bar, aksen hangat)
- **Accent / Action (Coral):** `#FF8C52` (Tombol CTA `+ Transaksi`, grafik pengeluaran, peringatan overbudget)
- **Surface Base (Warm Paper):** `#FCFBF7` (Background utama)
- **Card Surface:** `#FFFFFF` (Kartu putih bersih dengan border tegas `border-2 border-ink`)
- **Typography:** **Plus Jakarta Sans** (Heading/UI) & **JetBrains Mono** (`tabular-nums` untuk nominal Rupiah `Rp` dan persentase)
- **Tactile Shadows:** `shadow-tactile`, `shadow-tactile-coral`, `shadow-tactile-teal`

---

## 🚀 Fitur Utama
1. **Autentikasi JWT & Auto-Seeding:**
   - Register, Login, Profile.
   - Otomatis membuat 2 dompet bawaan (Tunai & Rekening Bank) dan 13 kategori keuangan standar.
2. **Multi-Wallet Management:**
   - CRUD dompet dengan pilihan tipe (BANK, EWALLET, CASH, INVESTMENT) dan palet warna.
   - Rekonsiliasi saldo otomatis secara instan.
3. **Pencatatan Transaksi Kilat (Quick Add):**
   - Tekan shortcut keyboard `N` kapan saja untuk membuka modal input kilat.
   - Segmented control: **Pengeluaran** | **Pemasukan** | **Transfer**.
   - Input angka berformat ribuan otomatis & pill selector kategori.
4. **Asymmetric Bento Dashboard & Recharts:**
   - Kartu Net Worth asimetris berlatar `#FFF0C5`.
   - Cashflow Bar/Area Chart (Harian / Bulanan) dengan custom tooltip gelap `#112A2B` dan teks `#FFF0C5`.
   - Donut Chart distribusi pengeluaran per kategori.
5. **Category-Based Budgeting:**
   - Menetapkan batas pengeluaran bulanan per kategori.
   - Visual progress bar adaptif (Hijau Mint `< 75%`, Teal `75% - 90%`, Coral `> 90%` Overbudget).
6. **Target Tabungan Finansial (Savings Goals):**
   - Menetapkan target dana darurat, liburan, gadget, properti, dll.
   - Kalkulator cerdas estimasi kebutuhan menabung bulanan agar tercapai tepat waktu.
   - Fitur Setor Dana / Nabung Sekarang yang memotong saldo dompet dan mencatat mutasi secara atomik.
7. **Catatan Hutang & Piutang (Debt & Loan Tracker):**
   - Pencatatan dua arah: **Hutang Saya** (kewajiban pinjaman) dan **Piutang Saya** (hak tagih).
   - Indikator peringatan jatuh tempo (Overdue / Segera Tempo dalam ≤ 3 hari) & perhitungan Posisi Pinjaman Bersih (Surplus / Defisit).
   - Fitur **Pelunasan Bertahap (Cicilan)**: Langsung sinkron ke saldo dompet pilihan dan memunculkan accordion riwayat cicilan.
8. **Transaksi Berulang & Kalender Tagihan (Subscriptions & Recurring):**
   - Manajemen tagihan bulanan (Netflix, Spotify, WiFi, Listrik, Sewa Kosan).
   - Dua mode tampilan: **Tampilan Kartu (Grid)** & **Kalender Tagihan Interaktif (Billing Calendar)** bulanan.
   - Fitur **1-Klik Bayar Sekarang**: Memotong saldo dompet yang dipilih, mencatat mutasi ke arus kas, dan menandai status siklus bulan ini sebagai *Lunas*.
9. **Kesehatan Finansial & Proyeksi Akhir Bulan (Financial Health Score & Burn Rate):**
   - Evaluasi 4 pilar perencana keuangan (Rasio Tabungan, Beban Pinjaman, Ketahanan Dana Darurat, dan Disiplin Arus Kas) menghasilkan skor 0-100 dan Grade (A+ s/d D).
   - Proyeksi laju pengeluaran harian (*burn rate*), estimasi pengeluaran akhir bulan, dan kalkulasi potensi surplus/defisit.
   - Rekomendasi kontekstual cerdas berbasis aturan perencana keuangan.
10. **Laporan Eksekutif Resmi Siap Cetak (Print / Save as PDF):**
    - Lembar laporan finansial bulanan dengan format editorial elegan berstandar A4 (`@media print`).
    - Menyajikan rekonsiliasi kekayaan bersih, ringkasan arus kas, breakdown kategori, target tabungan, dan mutasi ledger.
11. **Smart Tags (#tag) & Pengelompokan Fleksibel:**
    - Ekstraksi otomatis tagar dari catatan transaksi (contoh: `#WFO`, `#Kuliner`, `#Liburan`).
    - Filter instan per tagar dan agregasi pengeluaran per proyek/kegiatan.
12. **Mode Privasi (Sensor Nominal Saldo):**
    - Tekan tombol keyboard **`H`** atau ikon mata di Topbar untuk menyensor seluruh nominal saldo (`Rp ••••••`) saat membuka aplikasi di ruang publik.
13. **Ekspor Data:**
    - Ekspor riwayat transaksi ke format **CSV**.

---

## 🛠️ Cara Menjalankan Secara Lokal

### 1. Backend (Server)
```bash
cd server
npm install
npm run dev # atau npm start
```
- Berjalan di: `http://localhost:5001`
- Health check: `http://localhost:5001/health`
- Database: MongoDB Atlas

### 2. Frontend (Client)
```bash
cd client
npm install
npm run dev
```
- Berjalan di: `http://localhost:5174` (atau `http://localhost:5173`)
- Terhubung langsung ke API `http://localhost:5001/api/v1`

---

## 🌐 Panduan Deployment
- **Backend (Render):**
  - Root directory: `server`
  - Build command: `npm install`
  - Start command: `npm start`
  - Environment Variables: `PORT=5000`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`
- **Frontend (Vercel):**
  - Root directory: `client`
  - Framework preset: `Vite`
  - Environment Variable: `VITE_API_BASE_URL=https://<api-kamu>.onrender.com/api/v1`
  - Rewrite file: `client/vercel.json` sudah tersedia untuk SPA routing.

# Product Requirements Document (PRD): Dompet Tracker

## 1. Project Overview
Aplikasi web pencatatan dan monitoring keuangan harian yang memungkinkan pengguna mengelola multi-dompet (rekening, e-wallet, tunai), mencatat pemasukan/pengeluaran, mengatur batas anggaran (*budgeting*), serta memvisualisasikan arus kas melalui grafik interaktif. Aplikasi ini dibangun menggunakan arsitektur **MERN Stack** dengan pendekatan **Editorial Warm-Modern UI** (bebas dari kesan *generic AI template*) dan di-deploy secara terpisah antara *frontend* (Vercel) dan *backend* (Render).

---

## 2. Market Reference & Benchmark
Berikut adalah 4 aplikasi pencatatan keuangan matang yang dijadikan acuan fungsionalitas dan *user flow*:

| Aplikasi Referensi | Kekuatan Utama | Fitur yang Diadopsi ke Project Ini |
| :--- | :--- | :--- |
| **Wallet by BudgetBakers** | Visualisasi data & multi-akun | **Multi-Wallet Management** (Cash, Bank, E-Wallet) dan dashboard analitik grafik arus kas. |
| **Money Lover** | Pencatatan harian & *Budgeting* | **Category-based Budgeting** dengan indikator *progress bar* dan peringatan persentase batas anggaran. |
| **Spendee** | UI/UX bersih & *Quick Add* | **Quick Transaction Logging** (input cepat kurang dari 5 detik) dan filter rentang tanggal dinamis. |
| **YNAB (You Need A Budget)** | Kontrol alokasi dana | **Net Worth Tracking** dan rekonsiliasi saldo antar-dompet (fitur Transfer antar akun). |

---

## 3. Design System & Anti-"AI Slop" UI Guidelines

Bagian ini adalah instruksi wajib bagi AI Code Generator (Antigravity) agar antarmuka aplikasi terlihat seperti produk finansial modern yang dirancang oleh *Product Designer* manusia (seperti *Copilot Money*, *Wise*, atau *Linear* versi *warm*), bukan hasil *template* AI generik.

### A. Color Palette & Semantic Mapping
Karena keempat warna utama memiliki karakter *warm-retro coastal* (Teal, Mint, Cream, Coral), sistem membutuhkan warna netral gelap (*Deep Slate Teal*) untuk tipografi dan garis batas agar keterbacaan (kontras WCAG) tetap tajam dan tidak terlihat pucat.

| Token Name | Hex Code | Peran Semantik dalam UI |
| :--- | :--- | :--- |
| **Primary (Deep Teal)** | `#359FA0` | Brand utama, navigasi aktif, grafik Pemasukan (*Income*), border fokus, tombol sekunder. |
| **Secondary (Soft Mint)** | `#8AD6D1` | Background badge positif, *secondary chart fill*, kartu sorotan (*highlight card*), aksen ikon. |
| **Canvas / Warm Cream** | `#FFF0C5` | Aksen latar belakang hangat (*Hero summary card*, *Alert/Budget banner*, *active pill background*). |
| **Accent / Action (Coral)** | `#FF8C52` | **Primary CTA Button ("+ Transaksi")**, grafik Pengeluaran (*Expense*), indikator *warning/overbudget*. |
| **Surface Base (Warm Paper)** | `#FCFBF7` | Background utama halaman (menggunakan turunan `#FFF0C5` yang sangat terang agar mata tidak lelah). |
| **Card Surface** | `#FFFFFF` | Background kartu transaksi, tabel, dan modal agar kontras bersih di atas `#FCFBF7` dan `#FFF0C5`. |
| **Ink Primary (Deep Slate)** | `#112A2B` | Warna teks utama, angka nominal uang, dan border tegas (turunan sangat gelap dari `#359FA0`). |
| **Ink Muted** | `#527072` | Label sekunder, tanggal transaksi, teks *placeholder*. |

### B. Tailwind CSS Configuration (`tailwind.config.js`)
Gunakan konfigurasi warna dan tipografi berikut secara konsisten di seluruh komponen:

```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "#359FA0",
          mint: "#8AD6D1",
          cream: "#FFF0C5",
          coral: "#FF8C52",
        },
        surface: {
          bg: "#FCFBF7",
          card: "#FFFFFF",
          cream: "#FFF0C5",
        },
        ink: {
          DEFAULT: "#112A2B",
          muted: "#527072",
          border: "#DCE7E7",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'tactile': '0 2px 0 0 #DCE7E7',
        'tactile-teal': '0 3px 0 0 #267879',
        'tactile-coral': '0 3px 0 0 #D96B34',
      }
    },
  },
  plugins: [],
};
```

### C. Strict Anti-"AI Slop" Rules (Wajib Dipatuhi saat Ngoding)
1. **DILARANG Menggunakan Warna Default Tailwind untuk Elemen Utama:** Jangan pernah menggunakan `bg-indigo-*`, `bg-purple-*`, `bg-blue-*`, atau `bg-gray-900`. Seluruh warna harus mengacu pada token `brand-*`, `surface-*`, dan `ink-*`.
2. **DILARANG Membuat "Marketing Landing Page" Generik:** Saat pengguna membuka aplikasi (atau setelah login), langsung tampilkan *Workspace Dashboard* yang fungsional. Jangan membuat *hero section* dengan kalimat klise seperti *"Welcome to your financial freedom"* atau ikon roket/bintang AI (`Sparkles`).
3. **DILARANG Menggunakan Blurry Glow & Glassmorphism Berlebihan:** Hindari `backdrop-blur-xl` dengan bayangan menyebar (`shadow-2xl`). Gunakan pendekatan **Crisp Tactile UI**: kartu putih bersih (`bg-surface-card`), border tipis yang tegas (`border border-ink-border` atau `border-[#112A2B]/15`), serta bayangan tajam ke bawah (`shadow-tactile`).
4. **Tipografi & Format Angka Finansial Wajib Presisi:**
   * Gunakan font **Plus Jakarta Sans** untuk UI/Heading dan **JetBrains Mono** (atau class `tabular-nums`) untuk **semua nominal Rupiah (`Rp`) dan persentase**. Angka keuangan yang sejajar secara vertikal memberikan kesan aplikasi finansial kelas profesional.
5. **Layout Bento Asimetris (Bukan 4 Kartu Seragam):**
   * Jangan menjejerkan 4 kartu statistik yang bentuknya persis sama di bagian atas.
   * Buat **1 Kartu Utama (Net Worth / Total Saldo)** berukuran lebih lebar dengan latar `bg-brand-cream` (`#FFF0C5`) atau `bg-brand-teal` (`#359FA0` dengan teks putih), disandingkan dengan kartu Pemasukan (`#8AD6D1`) dan Pengeluaran (`#FF8C52`).
6. **Styling Grafik (Recharts) yang Bersih:**
   * Hilangkan garis *grid* vertikal pada grafik; gunakan hanya garis horizontal putus-putus halus (`stroke="#DCE7E7"`).
   * Warna *series* grafik dikunci pada `#359FA0` (Income), `#FF8C52` (Expense), dan `#8AD6D1` (Net/Savings).
   * Buat komponen *Custom Tooltip* dengan latar `#112A2B` dan teks `#FFF0C5`, bukan *tooltip* putih bawaan Recharts.

---

## 4. Core Features & Functional Requirements

### A. Modul Autentikasi & Profil (P0 - MVP)
* **Autentikasi JWT:** Register, Login, dan Logout menggunakan JSON Web Token.
* **Preferensi Pengguna:** Pengaturan mata uang default (IDR) dan batas awal tanggal siklus bulanan (contoh: siklus buku dimulai setiap tanggal 25 saat gajian).

### B. Modul Multi-Wallet / Akun (P0 - MVP)
* **CRUD Wallet:** Pengguna dapat membuat berbagai dompet (contoh: "BCA", "GoPay", "Dompet Tunai") dengan saldo awal, tipe akun, dan pilihan warna identitas dari palet (`#359FA0`, `#8AD6D1`, `#FFF0C5`, `#FF8C52`).
* **Kalkulasi Saldo Otomatis:** Saldo dompet otomatis bertambah/berkurang setiap kali transaksi dibuat, diubah, atau dihapus.

### C. Modul Pencatatan Transaksi (P0 - MVP)
* **3 Tipe Transaksi:**
  1. `INCOME` (Pemasukan — aksen warna `#359FA0` / `#8AD6D1`)
  2. `EXPENSE` (Pengeluaran — aksen warna `#FF8C52`)
  3. `TRANSFER` (Pindah dana antar-dompet tanpa dihitung sebagai pengeluaran/pemasukan di laporan bulanan).
* **Quick Add Modal (Shortcut `N` atau tombol `#FF8C52` di kanan atas):** Input transaksi cepat dengan *segmented control* (Expense | Income | Transfer), input nominal besar berformat ribuan otomatis, *pill selector* untuk kategori, dan pemilih dompet.
* **Filter & Pencarian:** Filter berdasarkan rentang tanggal, dompet, kategori, serta *search bar* catatan transaksi.

### D. Modul Visualisasi Data & Dashboard (P0 - MVP)
* **Asymmetric Summary Header:**
  * Kartu utama *Net Worth* berlatar `#FFF0C5` dengan teks `#112A2B`.
  * Kartu ringkasan *Monthly Cashflow* (Income vs Expense + persentase sisa uang).
* **Grafik Interaktif:**
  * **Cashflow Area/Bar Chart:** Tren arus kas harian/mingguan (Income `#359FA0` vs Expense `#FF8C52`).
  * **Category Donut Chart:** Proporsi pengeluaran per kategori dengan rincian daftar persentase di sampingnya (menggunakan gradasi/variasi opasitas dari `#359FA0`, `#8AD6D1`, `#FF8C52`, dan `#112A2B`).

### E. Modul Budgeting & Monitoring (P1 - Core Enhancement)
* **Batas Anggaran Kategori:** Menetapkan batas maksimal pengeluaran bulanan per kategori.
* **Visual Progress Bar (Sesuai Palet):**
  * **Aman (di bawah 75%):** Bar berwarna `#8AD6D1` (Soft Mint) di atas track `#FFF0C5`.
  * **Mendekati Batas (75% - 90%):** Bar berwarna `#359FA0` (Deep Teal).
  * **Melebihi Anggaran (di atas 90%):** Bar berwarna `#FF8C52` (Coral Orange) dengan badge peringatan.

### F. Modul Ekspor & Pelaporan (P2 - Nice to Have)
* **Export Data:** Unduh riwayat transaksi bulanan ke dalam format **CSV** atau **PDF**.

---

## 5. Technical Architecture (MERN Stack)

### Tech Stack Details
* **Frontend (Deploy di Vercel):**
  * **Framework:** React (Vite)
  * **Styling:** Tailwind CSS + Lucide React (Icons dengan `strokeWidth={1.75}` agar terlihat rapi)
  * **Charting Library:** Recharts
  * **State & Data Fetching:** TanStack React Query / Zustand + Axios
  * **Form & Validation:** React Hook Form + Zod
* **Backend (Deploy di Render):**
  * **Runtime & Framework:** Node.js + Express.js
  * **Database & ODM:** MongoDB Atlas + Mongoose
  * **Authentication & Security:** `jsonwebtoken`, `bcryptjs`, `cors`, `helmet`

---

## 6. Database Schema Design (MongoDB / Mongoose)

### 1. `users` Collection
```javascript
{
  _id: ObjectId,
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  currency: { type: String, default: "IDR" },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. `wallets` Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true }, // e.g., "BCA", "GoPay", "Cash"
  type: { type: String, enum: ["BANK", "EWALLET", "CASH", "INVESTMENT"], default: "CASH" },
  balance: { type: Number, required: true, default: 0 },
  color: { type: String, default: "#359FA0" }, // Default ke Brand Teal
  icon: { type: String, default: "wallet" },
  isArchived: { type: Boolean, default: false },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. `categories` Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", index: true }, // null jika kategori bawaan sistem
  name: { type: String, required: true }, // e.g., "Makanan", "Gaji", "Transportasi"
  type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true } // Menggunakan variasi dari #359FA0, #8AD6D1, #FF8C52
}
```

### 4. `transactions` Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  walletId: { type: ObjectId, ref: "Wallet", required: true },
  toWalletId: { type: ObjectId, ref: "Wallet", default: null }, // Diisi khusus jika type === "TRANSFER"
  categoryId: { type: ObjectId, ref: "Category", required: function() { return this.type !== "TRANSFER"; } },
  type: { type: String, enum: ["INCOME", "EXPENSE", "TRANSFER"], required: true },
  amount: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true, index: true },
  note: { type: String, trim: true, maxLength: 250 },
  createdAt: Date,
  updatedAt: Date
}
```

### 5. `budgets` Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  categoryId: { type: ObjectId, ref: "Category", required: true },
  amountLimit: { type: Number, required: true, min: 1 },
  month: { type: Number, required: true }, // 1 - 12
  year: { type: Number, required: true },  // e.g., 2026
  alertThreshold: { type: Number, default: 80 }
}
```

> **Catatan Teknis MongoDB:**
> * Gunakan **MongoDB Client Session (`session.withTransaction`)** saat mencatat, mengedit, atau menghapus dokumen di `transactions` agar pembaruan `balance` pada `wallets` selalu *atomic*.
> * Buat *compound index* pada `transactions`: `{ userId: 1, date: -1 }` untuk mempercepat query dashboard.

---

## 7. REST API Endpoints Specification

### Auth Endpoints
* `POST /api/v1/auth/register` - Registrasi pengguna baru + *seed* kategori default.
* `POST /api/v1/auth/login` - Login & dapatkan token JWT.
* `GET /api/v1/auth/me` - Ambil data profil pengguna aktif.

### Wallet Endpoints
* `GET /api/v1/wallets` - Ambil daftar semua dompet beserta total saldo.
* `POST /api/v1/wallets` - Buat dompet baru.
* `PUT /api/v1/wallets/:id` - Update detail dompet.
* `DELETE /api/v1/wallets/:id` - Arsipkan atau hapus dompet.

### Transaction Endpoints
* `GET /api/v1/transactions` - Ambil riwayat transaksi (Query params: `startDate`, `endDate`, `walletId`, `categoryId`, `type`, `search`, `page`, `limit`).
* `POST /api/v1/transactions` - Tambah transaksi baru & update saldo dompet.
* `PUT /api/v1/transactions/:id` - Edit transaksi & rekalkulasi saldo dompet.
* `DELETE /api/v1/transactions/:id` - Hapus transaksi & kembalikan (*revert*) saldo dompet.

### Analytics & Grafik Endpoints (MongoDB Aggregation Pipeline)
* `GET /api/v1/analytics/summary?month=10&year=2026` - Total Income, Total Expense, Net Cashflow, dan Net Worth.
* `GET /api/v1/analytics/by-category?month=10&year=2026` - Agregasi `$group` berdasarkan `categoryId` untuk Donut Chart.
* `GET /api/v1/analytics/cashflow-trend?period=monthly` - Agregasi pengeluaran vs pemasukan harian/bulanan untuk Area/Bar Chart.

### Budget Endpoints
* `GET /api/v1/budgets?month=10&year=2026` - Ambil daftar budget beserta realisasi pengeluaran saat ini.
* `POST /api/v1/budgets` - Buat atau perbarui target budget bulanan.
* `DELETE /api/v1/budgets/:id` - Hapus target budget.

---

## 8. Struktur Folder Monorepo

```text
finance-tracker-mern/
├── client/                     # Frontend React (Vite) - Deploy ke Vercel
│   ├── public/
│   ├── src/
│   │   ├── api/                # Konfigurasi Axios & interceptor
│   │   ├── components/
│   │   │   ├── charts/         # CashflowChart.jsx, CategoryDonutChart.jsx
│   │   │   ├── layout/         # Sidebar.jsx, Topbar.jsx
│   │   │   ├── modals/         # QuickAddTransactionModal.jsx
│   │   │   └── ui/             # TactileButton.jsx, StatCard.jsx, BudgetProgress.jsx
│   │   ├── context/            # AuthContext / Zustand store
│   │   ├── pages/              # Dashboard, Transactions, Wallets, Budgets, Auth
│   │   ├── utils/              # formatRupiah.js (Intl.NumberFormat), dateHelper.js
│   │   └── App.jsx
│   ├── tailwind.config.js      # Custom palette (#8AD6D1, #359FA0, #FFF0C5, #FF8C52)
│   ├── vercel.json             # SPA routing rewrite
│   └── package.json
│
└── server/                     # Backend Node.js + Express - Deploy ke Render
    ├── src/
    │   ├── config/             # Koneksi MongoDB Atlas (db.js)
    │   ├── controllers/        # Logika bisnis & Aggregation pipelines
    │   ├── middlewares/        # authMiddleware.js, errorHandler.js
    │   ├── models/             # User.js, Wallet.js, Transaction.js, Budget.js, Category.js
    │   ├── routes/             # Definisi endpoint API
    │   └── server.js           # Entry point aplikasi Express
    └── package.json
```

---

## 9. Deployment Guide (Vercel & Render)

### A. Database (MongoDB Atlas)
1. Buat cluster di MongoDB Atlas dan tambahkan IP `0.0.0.0/0` pada **Network Access**.
2. Salin *Connection String* (`MONGODB_URI`).

### B. Backend Deployment (Render)
1. Buat **Web Service** baru di Render dan arahkan **Root Directory** ke `server`.
2. **Build Command:** `npm install` | **Start Command:** `npm start`.
3. Set **Environment Variables**: `PORT=5000`, `MONGODB_URI`, `JWT_SECRET`, dan `CLIENT_URL` (URL Vercel).
4. Sediakan endpoint `GET /health` dengan respons `200 OK`.

### C. Frontend Deployment (Vercel)
1. Import repo ke Vercel, arahkan **Root Directory** ke `client`, dan pilih preset `Vite`.
2. Set **Environment Variable**: `VITE_API_BASE_URL=https://nama-api-kamu.onrender.com/api/v1`.
3. Sertakan `client/vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 10. Step-by-Step Implementation Plan (Untuk Eksekusi di Antigravity)
* **Phase 1: Backend Setup & Auth** — Inisialisasi Express, koneksi MongoDB Atlas, skema Mongoose, autentikasi JWT, dan *seeder* kategori bawaan dengan kode warna palet.
* **Phase 2: Core Wallet & Transaction Engine** — Buat CRUD Wallet dan CRUD Transaction dengan *MongoDB Transaction Session* agar saldo dompet selalu akurat.
* **Phase 3: Aggregation & Analytics API** — Buat endpoint agregasi untuk ringkasan bulanan, pengeluaran per kategori, dan progres budget.
* **Phase 4: Frontend Design System & Layout** — Setup React + Vite + Tailwind (`tailwind.config.js` sesuai Bagian 3B), muat Google Fonts (*Plus Jakarta Sans* & *JetBrains Mono*), dan bangun kerangka *Sidebar Navigation* yang bersih.
* **Phase 5: Dashboard, Custom Recharts & Quick-Add Modal** — Bangun Bento Grid Dashboard dengan kartu utama `#FFF0C5`, grafik Recharts dengan warna `#359FA0` & `#FF8C52`, serta modal *Quick Add Transaction*.
* **Phase 6: Deployment & Polish** — Konfigurasi CORS, tambah `vercel.json`, deploy ke Render dan Vercel.
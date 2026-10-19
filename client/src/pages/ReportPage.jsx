import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDateID } from '../utils/dateHelper';
import { usePrivacy } from '../context/PrivacyContext';
import {
  Printer,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Target,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const ReportPage = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { mask } = usePrivacy();

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(
        `/analytics/report?month=${selectedMonth}&year=${selectedYear}`
      );
      setReport(res.data);
    } catch (err) {
      console.error('Error fetching executive report:', err);
      setError('Gagal memuat laporan keuangan.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-ink no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <span>Laporan Keuangan Resmi (PDF)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cream text-ink font-bold border border-ink/20">
              Executive Statement
            </span>
          </h2>
          <p className="text-xs text-ink-muted">
            Format editorial siap cetak atau simpan ke file PDF untuk pengarsipan bulanan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Navigator */}
          <div className="flex items-center gap-2 bg-white border-2 border-ink rounded-xl p-1 shadow-tactile">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-surface-bg transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-2 text-ink">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-surface-bg transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <TactileButton
            variant="primary"
            onClick={handlePrint}
            className="flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh PDF</span>
          </TactileButton>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white border-2 border-ink rounded-2xl shadow-tactile">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-ink-muted">
            Menyusun lembar laporan eksekutif...
          </p>
        </div>
      ) : error || !report ? (
        <div className="p-6 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
          <p className="text-sm font-bold text-red-700 mb-3">{error || 'Gagal memuat laporan'}</p>
          <TactileButton variant="primary" onClick={fetchReport}>
            Coba Lagi
          </TactileButton>
        </div>
      ) : (
        /* PRINTABLE EXECUTIVE SHEET */
        <div className="bg-white border-2 border-ink rounded-2xl p-6 sm:p-10 shadow-tactile print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto printable-document">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-4 border-ink pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-brand-teal border-2 border-ink flex items-center justify-center text-brand-cream font-extrabold text-sm">
                  D
                </div>
                <h1 className="text-2xl font-black text-ink tracking-tight">
                  DOMPET<span className="text-brand-coral">TRACKER</span>
                </h1>
              </div>
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                Laporan Keuangan Pribadi & Arus Kas Bulanan
              </p>
            </div>

            <div className="text-right">
              <div className="text-base font-extrabold text-ink font-mono">
                {MONTH_NAMES[selectedMonth - 1].toUpperCase()} {selectedYear}
              </div>
              <div className="text-xs text-ink-muted font-medium">
                Dibuat untuk: <strong>{report.user.name}</strong>
              </div>
              <div className="text-[10px] text-ink-muted font-mono">
                Dicetak pada: {formatDateID(new Date())}
              </div>
            </div>
          </div>

          {/* KPI Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-brand-cream/50 border-2 border-ink rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-ink-muted block">
                Total Kekayaan Bersih
              </span>
              <span className="text-lg font-black font-mono text-ink tracking-tight">
                {mask(formatRupiah(report.kpi.totalNetWorth))}
              </span>
            </div>

            <div className="p-3 bg-surface-bg border-2 border-ink rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-ink-muted block">
                Total Pemasukan
              </span>
              <span className="text-lg font-black font-mono text-brand-teal tracking-tight">
                {mask(formatRupiah(report.kpi.totalIncome))}
              </span>
            </div>

            <div className="p-3 bg-surface-bg border-2 border-ink rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-ink-muted block">
                Total Pengeluaran
              </span>
              <span className="text-lg font-black font-mono text-brand-coral tracking-tight">
                {mask(formatRupiah(report.kpi.totalExpense))}
              </span>
            </div>

            <div className="p-3 bg-surface-bg border-2 border-ink rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-ink-muted block">
                Tabungan Bersih (Rate)
              </span>
              <span
                className={`text-lg font-black font-mono tracking-tight ${
                  report.kpi.netSavings >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {mask(formatRupiah(report.kpi.netSavings))}{' '}
                <span className="text-xs font-sans font-bold">({report.kpi.savingsRate}%)</span>
              </span>
            </div>
          </div>

          {/* Section 1: Wallets & Net Worth Composition */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-ink border-b-2 border-ink pb-1 mb-2.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-brand-teal" />
              <span>1. Komposisi Dompet & Saldo Kas</span>
            </h3>

            <table className="w-full text-left text-xs border border-ink/20 rounded-lg overflow-hidden">
              <thead className="bg-surface-bg font-extrabold text-ink-muted border-b border-ink/20">
                <tr>
                  <th className="py-1.5 px-3">Nama Dompet</th>
                  <th className="py-1.5 px-3">Tipe Akun</th>
                  <th className="py-1.5 px-3 text-right">Saldo Saat Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {report.wallets.map((w) => (
                  <tr key={w._id}>
                    <td className="py-1.5 px-3 font-bold text-ink">{w.name}</td>
                    <td className="py-1.5 px-3 text-ink-muted uppercase font-mono text-[11px]">
                      {w.type}
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-extrabold text-ink">
                      {mask(formatRupiah(w.balance))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Top Expense Categories Breakdown */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-ink border-b-2 border-ink pb-1 mb-2.5 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-brand-coral" />
              <span>2. Alokasi Pengeluaran per Kategori</span>
            </h3>

            {report.categories.length === 0 ? (
              <p className="text-xs text-ink-muted italic py-2">
                Tidak ada mutasi pengeluaran tercatat di bulan ini.
              </p>
            ) : (
              <table className="w-full text-left text-xs border border-ink/20 rounded-lg overflow-hidden">
                <thead className="bg-surface-bg font-extrabold text-ink-muted border-b border-ink/20">
                  <tr>
                    <th className="py-1.5 px-3">Kategori</th>
                    <th className="py-1.5 px-3 text-center">Jumlah Transaksi</th>
                    <th className="py-1.5 px-3 text-right">Total Nominal</th>
                    <th className="py-1.5 px-3 text-right">Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {report.categories.map((c) => (
                    <tr key={c._id}>
                      <td className="py-1.5 px-3 font-bold text-ink flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span>{c.name}</span>
                      </td>
                      <td className="py-1.5 px-3 text-center font-mono text-ink-muted">
                        {c.count}x
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-extrabold text-ink">
                        {mask(formatRupiah(c.totalAmount))}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-brand-coral">
                        {c.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Section 3: Goals & Debts Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Target Tabungan */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-ink border-b-2 border-ink pb-1 mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-brand-teal" />
                <span>3. Target Tabungan (Goals)</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                {report.goals.length === 0 ? (
                  <p className="text-ink-muted italic">Belum ada target tabungan aktif.</p>
                ) : (
                  report.goals.slice(0, 3).map((g) => (
                    <div
                      key={g._id}
                      className="p-2 bg-surface-bg border border-ink/15 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-bold text-ink truncate">{g.name}</span>
                      <span className="font-mono font-extrabold text-brand-teal shrink-0">
                        {mask(formatRupiah(g.currentAmount))} / {mask(formatRupiah(g.targetAmount))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Catatan Pinjaman */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-ink border-b-2 border-ink pb-1 mb-2 flex items-center gap-1.5">
                <HandCoins className="w-3.5 h-3.5 text-brand-coral" />
                <span>4. Pinjaman & Tagihan (Debts)</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                {report.debts.length === 0 ? (
                  <p className="text-ink-muted italic">Tidak ada catatan hutang/piutang aktif.</p>
                ) : (
                  report.debts.slice(0, 3).map((d) => (
                    <div
                      key={d._id}
                      className="p-2 bg-surface-bg border border-ink/15 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-bold text-ink truncate">
                        {d.type === 'DEBT' ? '[Hutang]' : '[Piutang]'} {d.personName}
                      </span>
                      <span
                        className={`font-mono font-extrabold shrink-0 ${
                          d.type === 'DEBT' ? 'text-brand-coral' : 'text-brand-teal'
                        }`}
                      >
                        Sisa: {mask(formatRupiah(Math.max(0, d.totalAmount - d.paidAmount)))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Recent Transactions Ledger */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-ink border-b-2 border-ink pb-1 mb-2.5">
              5. Transaksi Terakhir di Periode Ini
            </h3>

            <table className="w-full text-left text-xs border border-ink/20 rounded-lg overflow-hidden">
              <thead className="bg-surface-bg font-extrabold text-ink-muted border-b border-ink/20">
                <tr>
                  <th className="py-1.5 px-3">Tanggal</th>
                  <th className="py-1.5 px-3">Jenis</th>
                  <th className="py-1.5 px-3">Kategori & Catatan</th>
                  <th className="py-1.5 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {report.recentTransactions.slice(0, 8).map((tx) => (
                  <tr key={tx._id}>
                    <td className="py-1 px-3 font-mono text-[11px] text-ink">
                      {formatDateID(tx.date)}
                    </td>
                    <td className="py-1 px-3 font-extrabold text-[10px]">
                      {tx.type === 'INCOME' ? (
                        <span className="text-green-700">PEMASUKAN</span>
                      ) : tx.type === 'EXPENSE' ? (
                        <span className="text-brand-coral">PENGELUARAN</span>
                      ) : (
                        <span className="text-ink-muted">TRANSFER</span>
                      )}
                    </td>
                    <td className="py-1 px-3 text-ink">
                      <span className="font-bold">{tx.categoryId?.name || 'Umum'}</span>
                      {tx.note && <span className="text-ink-muted ml-1">({tx.note})</span>}
                    </td>
                    <td
                      className={`py-1 px-3 text-right font-mono font-extrabold ${
                        tx.type === 'INCOME' ? 'text-brand-teal' : 'text-ink'
                      }`}
                    >
                      {mask(formatRupiah(tx.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Document Footer Signature */}
          <div className="pt-6 border-t-2 border-ink flex items-end justify-between text-xs text-ink-muted">
            <div>
              <p className="font-bold text-ink">Catatan Kepatuhan Finansial:</p>
              <p className="text-[11px]">
                Laporan ini digenerate secara otomatis oleh sistem <strong>Dompet Tracker</strong>.
                Seluruh rekonsiliasi saldo dan mutasi kas telah diverifikasi.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="h-8" />
              <div className="border-t border-ink/40 pt-1 font-bold text-ink">
                {report.user.name}
              </div>
              <div className="text-[10px]">Pemilik Akun</div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded print styles */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          aside {
            display: none !important;
          }
          header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .printable-document {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportPage;

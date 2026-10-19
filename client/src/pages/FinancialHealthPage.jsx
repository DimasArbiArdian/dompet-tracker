import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import { formatRupiah } from '../utils/formatRupiah';
import { usePrivacy } from '../context/PrivacyContext';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  PiggyBank,
  Wallet,
  HandCoins,
  Flame,
  Info,
} from 'lucide-react';

const FinancialHealthPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { mask } = usePrivacy();

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/analytics/health');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching financial health:', err);
      setError('Gagal memuat evaluasi kesehatan finansial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="p-12 text-center bg-white border-2 border-ink rounded-2xl shadow-tactile">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-ink-muted">
          Menganalisis kesehatan finansial dan proyeksi arus kas...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
        <p className="text-sm font-bold text-red-700 mb-3">{error || 'Data tidak tersedia'}</p>
        <TactileButton variant="primary" onClick={fetchHealth}>
          Coba Lagi
        </TactileButton>
      </div>
    );
  }

  const { totalScore, grade, label, color, metrics, forecast, recommendations } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-ink">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <span>Kesehatan Finansial & Proyeksi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-mint text-ink font-bold border border-ink/20">
              Financial Health Check
            </span>
          </h2>
          <p className="text-xs text-ink-muted">
            Evaluasi menyeluruh 4 pilar perencana keuangan dan estimasi laju pengeluaran bulanan (*burn rate*)
          </p>
        </div>

        <TactileButton
          variant="secondary"
          onClick={() => navigate('/report')}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Lihat Laporan Resmi (PDF)</span>
        </TactileButton>
      </div>

      {/* Hero Bento: Score Card & Burn Rate Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-ink rounded-2xl p-6 sm:p-8 shadow-tactile flex flex-col sm:flex-row items-center gap-6">
          {/* Circular Score Badge */}
          <div className="relative shrink-0 flex flex-col items-center justify-center">
            <div
              className="w-36 h-36 rounded-full border-4 border-ink flex flex-col items-center justify-center shadow-tactile"
              style={{ backgroundColor: '#FFF0C5' }}
            >
              <span className="text-4xl font-extrabold font-mono text-ink tracking-tight">
                {totalScore}
              </span>
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                Skor dari 100
              </span>
              <div
                className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border border-ink text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                Grade {grade}
              </div>
            </div>
          </div>

          {/* Assessment & Pillars Overview */}
          <div className="flex-1 text-center sm:text-left">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-1">
              Hasil Diagnosis Keuangan Anda
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              {label}
            </h3>
            <p className="text-xs text-ink-muted mt-1 mb-4 leading-relaxed">
              Skor dihitung berdasarkan 4 rasio utama: Rasio Tabungan (25%), Beban Pinjaman (25%), Ketahanan Dana Darurat (25%), dan Disiplin Arus Kas (25%).
            </p>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 bg-surface-bg border border-ink/15 rounded-xl">
                <span className="text-[10px] font-bold text-ink-muted uppercase block">
                  Rasio Tabungan
                </span>
                <span className="text-sm font-extrabold font-mono text-ink">
                  {metrics.savingsRatio}%{' '}
                  <span className="text-[10px] font-medium text-ink-muted font-sans">
                    (Target $\ge$ 20%)
                  </span>
                </span>
              </div>

              <div className="p-2.5 bg-surface-bg border border-ink/15 rounded-xl">
                <span className="text-[10px] font-bold text-ink-muted uppercase block">
                  Dana Darurat
                </span>
                <span className="text-sm font-extrabold font-mono text-ink">
                  {metrics.emergencyFundMonths} Bulan{' '}
                  <span className="text-[10px] font-medium text-ink-muted font-sans">
                    (Target $\ge$ 3 bln)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Burn Rate & End-of-Month Forecast (5 cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-ink rounded-2xl p-6 shadow-tactile flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-coral/20 border-2 border-brand-coral text-brand-coral flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-ink leading-tight">
                    Proyeksi Akhir Bulan
                  </h4>
                  <span className="text-[10px] text-ink-muted">
                    Laju Pengeluaran (*Burn Rate*)
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-ink-muted">
                Hari {forecast.currentDay} / {forecast.daysInMonth}
              </span>
            </div>

            <div className="space-y-3 mt-4">
              <div className="p-3 bg-surface-bg border border-ink/15 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-ink-muted">
                  Rata-rata Keluar / Hari:
                </span>
                <span className="text-sm font-extrabold font-mono text-ink">
                  {mask(formatRupiah(forecast.dailyBurnRate))}
                </span>
              </div>

              <div className="p-3 bg-surface-bg border border-ink/15 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-ink-muted">
                  Estimasi Total Pengeluaran:
                </span>
                <span className="text-sm font-extrabold font-mono text-brand-coral">
                  {mask(formatRupiah(forecast.projectedMonthEndExpense))}
                </span>
              </div>

              <div
                className={`p-3 border-2 rounded-xl flex items-center justify-between ${
                  forecast.isProjectedDeficit
                    ? 'bg-red-50 border-red-500'
                    : 'bg-green-50 border-green-500'
                }`}
              >
                <div>
                  <span className="text-xs font-extrabold text-ink block">
                    {forecast.isProjectedDeficit ? 'Potensi Defisit:' : 'Estimasi Sisa Saldo:'}
                  </span>
                  <span className="text-[10px] text-ink-muted">di akhir bulan</span>
                </div>
                <span
                  className={`text-base font-extrabold font-mono ${
                    forecast.isProjectedDeficit ? 'text-red-700' : 'text-green-700'
                  }`}
                >
                  {mask(formatRupiah(forecast.projectedRemainingBalance))}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-ink-muted mt-3 italic">
            *Masih ada <strong>{forecast.daysRemaining} hari</strong> tersisa di bulan ini. Kendalikan laju pengeluaran agar sesuai anggaran.
          </p>
        </div>
      </div>

      {/* 4 Core Pillars Detailed Breakdown */}
      <div>
        <h3 className="text-lg font-extrabold text-ink tracking-tight mb-4 flex items-center gap-2">
          <span>Evaluasi 4 Pilar Keuangan</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Rasio Tabungan */}
          <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-ink-muted uppercase">Pilar 1</span>
                <div className="w-8 h-8 rounded-lg bg-brand-cream border-2 border-ink text-brand-teal flex items-center justify-center font-bold">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <h4 className="font-extrabold text-sm text-ink mb-1">Rasio Tabungan</h4>
              <p className="text-[11px] text-ink-muted mb-3">
                Persentase penghasilan yang berhasil disisihkan untuk masa depan.
              </p>
              <div className="text-2xl font-extrabold font-mono text-brand-teal">
                {metrics.savingsRatio}%
              </div>
              <span className="text-[11px] font-bold text-ink-muted block mt-0.5">
                Target Sehat: $\ge$ 20%
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs">
              <span className="text-ink-muted font-bold">Skor Pilar:</span>
              <span className="font-mono font-extrabold text-ink">{metrics.savingsScore}/100</span>
            </div>
          </div>

          {/* 2. Beban Hutang */}
          <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-ink-muted uppercase">Pilar 2</span>
                <div className="w-8 h-8 rounded-lg bg-brand-coral/20 border-2 border-brand-coral text-brand-coral flex items-center justify-center font-bold">
                  <HandCoins className="w-4 h-4" />
                </div>
              </div>
              <h4 className="font-extrabold text-sm text-ink mb-1">Beban Pinjaman</h4>
              <p className="text-[11px] text-ink-muted mb-3">
                Kewajiban hutang yang harus dilunasi dibanding kapasitas arus kas.
              </p>
              <div className="text-2xl font-extrabold font-mono text-brand-coral">
                {mask(formatRupiah(metrics.totalDebtObligation))}
              </div>
              <span className="text-[11px] font-bold text-ink-muted block mt-0.5">
                {metrics.totalDebtObligation === 0 ? 'Bebas Hutang (Sangat Baik)' : 'Kewajiban Aktif'}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs">
              <span className="text-ink-muted font-bold">Skor Pilar:</span>
              <span className="font-mono font-extrabold text-ink">{metrics.debtScore}/100</span>
            </div>
          </div>

          {/* 3. Ketahanan Dana Darurat */}
          <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-ink-muted uppercase">Pilar 3</span>
                <div className="w-8 h-8 rounded-lg bg-brand-mint/30 border-2 border-brand-teal text-brand-teal flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <h4 className="font-extrabold text-sm text-ink mb-1">Dana Darurat</h4>
              <p className="text-[11px] text-ink-muted mb-3">
                Kekuatan saldo kas jika terjadi kehilangan pendapatan tiba-tiba.
              </p>
              <div className="text-2xl font-extrabold font-mono text-ink">
                {metrics.emergencyFundMonths}{' '}
                <span className="text-sm font-normal text-ink-muted font-sans">Bulan</span>
              </div>
              <span className="text-[11px] font-bold text-ink-muted block mt-0.5">
                Target Minimal: 3 - 6 Bulan
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs">
              <span className="text-ink-muted font-bold">Skor Pilar:</span>
              <span className="font-mono font-extrabold text-ink">{metrics.emergencyScore}/100</span>
            </div>
          </div>

          {/* 4. Disiplin Arus Kas */}
          <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-ink-muted uppercase">Pilar 4</span>
                <div className="w-8 h-8 rounded-lg bg-brand-cream border-2 border-ink text-ink flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4 text-brand-teal" />
                </div>
              </div>
              <h4 className="font-extrabold text-sm text-ink mb-1">Disiplin Arus Kas</h4>
              <p className="text-[11px] text-ink-muted mb-3">
                Konsistensi pengeluaran agar selalu berada di bawah total pemasukan.
              </p>
              <div className="text-2xl font-extrabold font-mono text-brand-teal">
                {forecast.monthlyIncome >= forecast.currentMonthExpense ? 'Positif' : 'Defisit'}
              </div>
              <span className="text-[11px] font-bold text-ink-muted block mt-0.5">
                Surplus Bersih Terkendali
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between text-xs">
              <span className="text-ink-muted font-bold">Skor Pilar:</span>
              <span className="font-mono font-extrabold text-ink">{metrics.disciplineScore}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations List */}
      <div className="bg-white border-2 border-ink rounded-2xl p-6 shadow-tactile">
        <h3 className="text-base font-extrabold text-ink tracking-tight mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-coral" />
          <span>Panduan & Rekomendasi Cerdas Perencana Keuangan</span>
        </h3>

        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 flex items-start gap-3.5 ${
                rec.type === 'WARNING'
                  ? 'bg-amber-50/70 border-amber-400'
                  : rec.type === 'NOTICE'
                  ? 'bg-blue-50/70 border-blue-400'
                  : rec.type === 'SUCCESS'
                  ? 'bg-green-50/70 border-green-400'
                  : 'bg-brand-cream/60 border-brand-teal'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {rec.type === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                ) : rec.type === 'SUCCESS' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-700" />
                ) : (
                  <Info className="w-5 h-5 text-brand-teal" />
                )}
              </div>
              <div>
                <h5 className="font-extrabold text-xs text-ink">{rec.title}</h5>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{rec.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthPage;

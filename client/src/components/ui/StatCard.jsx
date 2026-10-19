import React from 'react';
import { formatRupiah } from '../../utils/formatRupiah';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

export const NetWorthCard = ({
  netWorth = 0,
  walletsCount = 0,
  onAddWallet,
  className = '',
}) => {
  const { mask } = usePrivacy();

  return (
    <div
      className={`relative overflow-hidden bg-brand-cream border-2 border-ink rounded-2xl p-6 shadow-tactile flex flex-col justify-between ${className}`}
    >
      {/* Decorative subtle pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-ink text-brand-cream rounded-xl">
              <Wallet className="w-5 h-5" strokeWidth={2} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
              Total Kekayaan Bersih (Net Worth)
            </span>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold bg-white/70 border border-ink/20 rounded-lg text-ink">
            {walletsCount} Dompet Terhubung
          </span>
        </div>

        <div className="mt-2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-extrabold text-ink tracking-tight tabular-nums">
            {mask(formatRupiah(netWorth))}
          </h2>
          <p className="text-xs text-ink-muted mt-1.5 font-medium">
            Akumulasi saldo seluruh dompet tunai, rekening bank, & e-wallet aktif.
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-ink/15 flex items-center justify-between">
        <div className="text-xs font-semibold text-ink/80">
          Status Finansial:{' '}
          <span className="text-brand-teal font-bold">Terpantau Akurat</span>
        </div>
        {onAddWallet && (
          <button
            onClick={onAddWallet}
            className="text-xs font-bold text-ink underline underline-offset-4 hover:text-brand-coral transition-colors"
          >
            + Kelola Dompet
          </button>
        )}
      </div>
    </div>
  );
};

export const CashflowCard = ({
  title,
  amount = 0,
  type = 'INCOME', // 'INCOME' | 'EXPENSE'
  change = 0,
  comparisonLabel = 'vs bulan lalu',
  className = '',
}) => {
  const isIncome = type === 'INCOME';
  const { mask } = usePrivacy();

  return (
    <div
      className={`bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          {title}
        </span>
        <span
          className={`p-2 rounded-xl border border-ink/15 ${
            isIncome ? 'bg-brand-mint/40 text-brand-teal' : 'bg-brand-coral/20 text-brand-coral'
          }`}
        >
          {isIncome ? (
            <ArrowDownRight className="w-4 h-4" strokeWidth={2.2} />
          ) : (
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.2} />
          )}
        </span>
      </div>

      <div className="mt-3">
        <div
          className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight tabular-nums ${
            isIncome ? 'text-brand-teal' : 'text-brand-coral'
          }`}
        >
          {mask(formatRupiah(amount))}
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {change !== 0 ? (
            <span
              className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${
                change > 0
                  ? isIncome
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                  : isIncome
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          ) : null}
          <span className="text-ink-muted font-medium">{comparisonLabel}</span>
        </div>
      </div>
    </div>
  );
};

export const NetCashflowCard = ({
  netCashflow = 0,
  savingsRate = 0,
  className = '',
}) => {
  const isPositive = netCashflow >= 0;
  const { mask } = usePrivacy();

  return (
    <div
      className={`bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
          Arus Kas Bersih (Net)
        </span>
        <span className="px-2 py-0.5 text-xs font-bold rounded-lg border border-ink/20 bg-brand-cream text-ink">
          Tabungan {savingsRate}%
        </span>
      </div>

      <div className="mt-3">
        <div
          className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight tabular-nums ${
            isPositive ? 'text-brand-teal' : 'text-red-500'
          }`}
        >
          {mask(formatRupiah(netCashflow))}
        </div>
        <p className="text-xs text-ink-muted mt-2 font-medium">
          {isPositive
            ? 'Surplus! Selisih positif dialokasikan ke tabungan.'
            : 'Defisit! Pengeluaran melebihi pemasukan bulan ini.'}
        </p>
      </div>
    </div>
  );
};

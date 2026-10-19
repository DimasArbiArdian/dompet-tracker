import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  NetWorthCard,
  CashflowCard,
  NetCashflowCard,
} from '../components/ui/StatCard';
import CashflowChart from '../components/charts/CashflowChart';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import { TransactionTypeBadge, WalletTypeBadge } from '../components/ui/Badge';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDateID } from '../utils/dateHelper';
import { usePrivacy } from '../context/PrivacyContext';
import {
  ArrowRight,
  Wallet,
  TrendingUp,
  Plus,
  AlertCircle,
  Target,
  ArrowDownLeft,
  CheckCircle2,
} from 'lucide-react';

const DashboardPage = ({
  selectedMonth,
  selectedYear,
  onOpenQuickAdd,
  onOpenAddWallet,
}) => {
  const [summary, setSummary] = useState(null);
  const [cashflowTrend, setCashflowTrend] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { mask } = usePrivacy();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryRes, trendRes, categoryRes, txRes, walletsRes, goalsRes] =
        await Promise.all([
          api.get(`/analytics/summary?month=${selectedMonth}&year=${selectedYear}`),
          api.get(
            `/analytics/cashflow-trend?period=${trendPeriod}&month=${selectedMonth}&year=${selectedYear}`
          ),
          api.get(
            `/analytics/by-category?month=${selectedMonth}&year=${selectedYear}`
          ),
          api.get(`/transactions?limit=6`),
          api.get(`/wallets`),
          api.get(`/goals`),
        ]);

      setSummary(summaryRes.data.data);
      setCashflowTrend(trendRes.data.data);
      setCategoryBreakdown(categoryRes.data.data);
      setRecentTransactions(txRes.data.data);
      setWallets(walletsRes.data.data);
      setGoals(goalsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Gagal memuat ringkasan dashboard. Silakan periksa koneksi.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, trendPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const activeGoals = goals.filter((g) => !g.isCompleted);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Asymmetric Bento Grid Summary Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Net Worth Hero Card - Spans 6 or 7 cols */}
        <div className="lg:col-span-6 xl:col-span-5">
          <NetWorthCard
            netWorth={summary?.netWorth || 0}
            walletsCount={summary?.walletsCount || wallets.length}
            onAddWallet={onOpenAddWallet}
            className="h-full min-h-[220px]"
          />
        </div>

        {/* Cashflow Breakdown Cards - Spans remaining cols */}
        <div className="lg:col-span-6 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CashflowCard
            title="Pemasukan Bulan Ini"
            amount={summary?.totalIncome || 0}
            type="INCOME"
            change={summary?.incomeChange || 0}
            className="h-full"
          />

          <CashflowCard
            title="Pengeluaran Bulan Ini"
            amount={summary?.totalExpense || 0}
            type="EXPENSE"
            change={summary?.expenseChange || 0}
            className="h-full"
          />

          <NetCashflowCard
            netCashflow={summary?.netCashflow || 0}
            savingsRate={summary?.savingsRate || 0}
            className="sm:col-span-2 lg:col-span-1 h-full"
          />
        </div>
      </div>

      {/* 2. Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cashflow Area/Bar Chart - 7 cols */}
        <div className="lg:col-span-7">
          <CashflowChart
            data={cashflowTrend}
            period={trendPeriod}
            onPeriodChange={setTrendPeriod}
            className="h-full"
          />
        </div>

        {/* Category Donut Chart - 5 cols */}
        <div className="lg:col-span-5">
          <CategoryDonutChart
            categories={categoryBreakdown?.categories || []}
            total={categoryBreakdown?.total || 0}
            className="h-full"
          />
        </div>
      </div>

      {/* 3. Savings Goals Widget Row (if any active goals exist) */}
      {goals.length > 0 && (
        <div className="bg-white border-2 border-ink rounded-3xl p-5 sm:p-6 shadow-tactile">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink/10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-brand-teal text-white rounded-xl border border-ink/20 shadow-sm">
                <Target className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="font-extrabold text-ink text-base">
                  Target Tabungan Berjalan
                </h3>
                <p className="text-xs text-ink-muted">
                  Pantau perkembangan simpanan masa depan Anda
                </p>
              </div>
            </div>

            <Link
              to="/goals"
              className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
            >
              <span>Semua Target ({goals.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((g) => (
              <div
                key={g._id}
                className="p-4 rounded-2xl border-2 border-ink/15 bg-surface-bg/50 hover:bg-surface-bg transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-ink text-sm truncate">
                      {g.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-brand-teal tabular-nums">
                      {g.percentage}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-brand-cream border border-ink/15 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(g.percentage, 100)}%`,
                        backgroundColor: g.color || '#359FA0',
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs mt-2 text-ink-muted">
                    <span>
                      Terkumpul: <strong className="font-mono text-ink tabular-nums">{mask(formatRupiah(g.currentAmount))}</strong>
                    </span>
                    <span>
                      Target: <strong className="font-mono text-ink tabular-nums">{mask(formatRupiah(g.targetAmount))}</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-between text-[11px]">
                  <span className="text-ink-muted">
                    {g.isCompleted ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Tercapai
                      </span>
                    ) : (
                      <span>{g.daysRemaining} hari lagi</span>
                    )}
                  </span>
                  <Link
                    to="/goals"
                    className="font-bold text-brand-coral hover:underline"
                  >
                    + Setor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Bottom Row: Wallets Quick Overview & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Wallets Widget (4 cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink/10">
              <h3 className="font-bold text-ink text-base">Dompet Saya</h3>
              <Link
                to="/wallets"
                className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {wallets.slice(0, 4).map((w) => (
                <div
                  key={w._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-ink/15 hover:bg-surface-bg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-ink/20 shrink-0"
                      style={{ backgroundColor: w.color }}
                    />
                    <div>
                      <div className="text-sm font-bold text-ink leading-tight">
                        {w.name}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        <WalletTypeBadge type={w.type} />
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-sm text-ink tabular-nums">
                    {mask(formatRupiah(w.balance))}
                  </div>
                </div>
              ))}

              {wallets.length === 0 && (
                <div className="text-center py-6 text-xs text-ink-muted">
                  Belum ada dompet. Buat dompet pertama Anda!
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/10">
            <button
              onClick={onOpenAddWallet}
              className="w-full py-2 px-3 border-2 border-dashed border-ink/30 rounded-xl text-xs font-bold text-ink hover:border-brand-teal hover:bg-brand-mint/15 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Dompet Baru</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions List (8 cols) */}
        <div className="lg:col-span-8 bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink text-base">
                  Transaksi Terakhir
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-brand-cream border border-ink/20 font-bold text-ink">
                  Terbaru
                </span>
              </div>
              <Link
                to="/transactions"
                className="text-xs font-bold text-brand-coral hover:underline flex items-center gap-1"
              >
                <span>Semua Transaksi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-ink/10">
              {recentTransactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';

                return (
                  <div
                    key={tx._id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-bg/50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border border-ink/20 flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-brand-mint/30 text-brand-teal'
                            : isExpense
                            ? 'bg-brand-coral/20 text-brand-coral'
                            : 'bg-brand-cream text-ink'
                        }`}
                      >
                        <Wallet className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-ink truncate">
                          {tx.type === 'TRANSFER'
                            ? `Transfer: ${tx.walletId?.name || 'Dompet'} → ${tx.toWalletId?.name || 'Dompet'}`
                            : tx.categoryId?.name || tx.note || 'Transaksi'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                          <span>{formatDateID(tx.date)}</span>
                          <span>•</span>
                          <span className="truncate">
                            {tx.walletId?.name || 'Dompet'}
                          </span>
                          {tx.note && (
                            <>
                              <span>•</span>
                              <span className="truncate italic max-w-[120px]">
                                "{tx.note}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                          isIncome
                            ? 'text-brand-teal'
                            : isExpense
                            ? 'text-brand-coral'
                            : 'text-ink'
                        }`}
                      >
                        {isExpense ? '- ' : isIncome ? '+ ' : ''}
                        {mask(formatRupiah(tx.amount))}
                      </div>
                      <div className="mt-0.5">
                        <TransactionTypeBadge type={tx.type} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {recentTransactions.length === 0 && (
                <div className="text-center py-10 text-xs text-ink-muted">
                  Belum ada transaksi tercatat. Tekan{' '}
                  <kbd className="px-1.5 py-0.5 bg-brand-cream border border-ink/20 rounded font-mono font-bold">
                    N
                  </kbd>{' '}
                  atau klik Transaksi Baru untuk mulai mencatat.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

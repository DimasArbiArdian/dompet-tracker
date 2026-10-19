import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import BudgetProgress from '../components/ui/BudgetProgress';
import BudgetModal from '../components/modals/BudgetModal';
import { formatRupiah } from '../utils/formatRupiah';
import { formatMonthYear } from '../utils/dateHelper';
import { usePrivacy } from '../context/PrivacyContext';
import { Plus, PiggyBank, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

const BudgetsPage = ({
  selectedMonth,
  selectedYear,
  categories = [],
}) => {
  const { mask } = usePrivacy();
  const [budgets, setBudgets] = useState([]);
  const [totalLimit, setTotalLimit] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/budgets?month=${selectedMonth}&year=${selectedYear}`);
      setBudgets(res.data.data);
      setTotalLimit(res.data.totalLimit);
      setTotalSpent(res.data.totalSpent);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Gagal mengambil data anggaran.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Hapus batas anggaran ini?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      alert('Gagal menghapus anggaran: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenAdd = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  };

  const overBudgetCount = budgets.filter((b) => b.percentage >= 90).length;
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-ink">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight">
            Perencanaan Anggaran (Budgeting)
          </h2>
          <p className="text-xs text-ink-muted">
            Kendalikan batas pengeluaran kategori untuk periode{' '}
            <strong className="text-ink">{formatMonthYear(selectedMonth, selectedYear)}</strong>
          </p>
        </div>

        <TactileButton
          variant="coral"
          size="sm"
          icon={Plus}
          onClick={handleOpenAdd}
        >
          Atur Anggaran Baru
        </TactileButton>
      </div>

      {/* Overview Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-brand-cream border-2 border-ink rounded-2xl shadow-tactile">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            <span>Total Batas Anggaran</span>
            <PiggyBank className="w-4 h-4 text-ink" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-ink tabular-nums">
            {mask(formatRupiah(totalLimit))}
          </div>
          <div className="text-xs text-ink-muted mt-1 font-medium">
            {budgets.length} pos anggaran aktif
          </div>
        </div>

        <div className="p-5 bg-white border-2 border-ink rounded-2xl shadow-tactile">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            <span>Realisasi Pengeluaran</span>
            <span className="font-mono text-xs font-bold text-brand-coral">
              {overallPercentage}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-ink tabular-nums">
            {mask(formatRupiah(totalSpent))}
          </div>
          <div className="w-full h-2 bg-brand-cream rounded-full overflow-hidden mt-2 border border-ink/20">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                overallPercentage >= 90
                  ? 'bg-brand-coral'
                  : overallPercentage >= 75
                  ? 'bg-brand-teal'
                  : 'bg-brand-mint'
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-white border-2 border-ink rounded-2xl shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            <span>Status Peringatan</span>
            <ShieldAlert className="w-4 h-4 text-brand-coral" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-ink tabular-nums">
              {overBudgetCount > 0 ? (
                <span className="text-brand-coral">{overBudgetCount} Melebihi Batas</span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1.5 text-xl font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Semua Terkendali
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-1 font-medium">
              {overBudgetCount > 0
                ? 'Ada kategori yang mendekati atau melewati batas'
                : 'Alokasi pengeluaran masih dalam batas aman'}
            </p>
          </div>
        </div>
      </div>

      {/* Budgets List Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-ink">
          Daftar Anggaran Pos Pengeluaran
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <BudgetProgress
              key={b._id}
              budget={b}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteBudget}
            />
          ))}

          {budgets.length === 0 && !loading && (
            <div className="md:col-span-2 text-center py-12 bg-white border-2 border-dashed border-ink/30 rounded-2xl p-6">
              <PiggyBank className="w-10 h-10 text-ink-muted mx-auto mb-2" />
              <h4 className="font-bold text-ink text-sm">
                Belum ada anggaran untuk bulan ini
              </h4>
              <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                Tetapkan batas pengeluaran untuk pos belanja, makanan, hiburan, dan tagihan agar keuangan Anda tetap sehat.
              </p>
              <div className="mt-4">
                <TactileButton variant="coral" size="sm" onClick={handleOpenAdd}>
                  + Atur Anggaran Pertama
                </TactileButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        budget={selectedBudget}
        categories={categories}
        month={selectedMonth}
        year={selectedYear}
        onSuccess={fetchBudgets}
      />
    </div>
  );
};

export default BudgetsPage;

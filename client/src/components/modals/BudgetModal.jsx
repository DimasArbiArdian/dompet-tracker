import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { parseRupiahInput } from '../../utils/formatRupiah';
import api from '../../api/axios';

const BudgetModal = ({
  isOpen,
  onClose,
  budget = null,
  categories = [],
  month,
  year,
  onSuccess,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [limitRaw, setLimitRaw] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only expense categories can be budgeted
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.categoryId?._id || budget.categoryId || '');
      setLimitRaw(budget.amountLimit ? budget.amountLimit.toLocaleString('id-ID') : '');
      setAlertThreshold(budget.alertThreshold || 80);
    } else {
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0]._id);
      }
      setLimitRaw('');
      setAlertThreshold(80);
    }
    setError('');
  }, [budget, isOpen, categories]);

  const handleLimitChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setLimitRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const limitNum = parseRupiahInput(limitRaw);

    if (!categoryId) {
      setError('Pilih kategori pos anggaran');
      return;
    }

    if (!limitNum || limitNum <= 0) {
      setError('Masukkan batas nominal anggaran');
      return;
    }

    try {
      setLoading(true);
      await api.post('/budgets', {
        categoryId,
        amountLimit: limitNum,
        month,
        year,
        alertThreshold,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan anggaran. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budget ? 'Edit Batas Anggaran' : 'Atur Anggaran Kategori'}
      subtitle={`Batas pengeluaran bulanan periode ${month}/${year}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Kategori Pengeluaran
          </label>
          <select
            value={categoryId}
            disabled={!!budget}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile disabled:bg-surface-bg disabled:opacity-75"
          >
            {expenseCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Batas Maksimal Pengeluaran (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-ink">
              Rp
            </span>
            <input
              type="text"
              value={limitRaw}
              onChange={handleLimitChange}
              placeholder="Contoh: 1.500.000"
              className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-ink rounded-xl font-mono text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal tabular-nums shadow-tactile"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Peringatan Batas Bahaya ({alertThreshold}%)
          </label>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            className="w-full accent-brand-coral"
          />
          <div className="flex justify-between text-[11px] font-semibold text-ink-muted">
            <span>50%</span>
            <span className="text-brand-coral font-bold">{alertThreshold}%</span>
            <span>95%</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <TactileButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </TactileButton>
          <TactileButton type="submit" variant="coral" loading={loading}>
            Simpan Anggaran
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default BudgetModal;

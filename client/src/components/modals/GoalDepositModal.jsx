import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { parseRupiahInput, formatRupiah } from '../../utils/formatRupiah';
import api from '../../api/axios';
import { PiggyBank, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const GoalDepositModal = ({
  isOpen,
  onClose,
  goal,
  wallets = [],
  onSuccess,
}) => {
  const [mode, setMode] = useState('DEPOSIT'); // 'DEPOSIT' | 'WITHDRAW'
  const [amountRaw, setAmountRaw] = useState('');
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmountRaw('');
      setNote('');
      setMode('DEPOSIT');
      setError('');
      if (wallets.length > 0) {
        setWalletId(wallets[0]._id);
      }
    }
  }, [isOpen, wallets]);

  if (!goal) return null;

  const handleAmountChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setAmountRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const selectedWallet = wallets.find((w) => w._id === walletId);
  const enteredAmount = parseRupiahInput(amountRaw);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!enteredAmount || enteredAmount <= 0) {
      setError('Masukkan nominal yang valid');
      return;
    }

    if (!walletId) {
      setError('Pilih dompet yang bersangkutan');
      return;
    }

    if (mode === 'DEPOSIT' && selectedWallet && enteredAmount > selectedWallet.balance) {
      setError(`Saldo dompet ${selectedWallet.name} tidak mencukupi (${formatRupiah(selectedWallet.balance)})`);
      return;
    }

    if (mode === 'WITHDRAW' && enteredAmount > goal.currentAmount) {
      setError(`Nominal penarikan melebihi saldo tabungan saat ini (${formatRupiah(goal.currentAmount)})`);
      return;
    }

    try {
      setLoading(true);
      const endpoint = mode === 'DEPOSIT' ? 'deposit' : 'withdraw';

      await api.post(`/goals/${goal._id}/${endpoint}`, {
        amount: enteredAmount,
        walletId,
        note: note.trim() || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan transaksi tabungan.');
    } finally {
      setLoading(false);
    }
  };

  const projectedAmount =
    mode === 'DEPOSIT'
      ? goal.currentAmount + enteredAmount
      : Math.max(0, goal.currentAmount - enteredAmount);

  const projectedPercentage =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((projectedAmount / goal.targetAmount) * 100))
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'DEPOSIT' ? 'Nabung ke Target' : 'Tarik Dana Tabungan'}
      subtitle={`Target: ${goal.name}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-surface-bg border-2 border-ink rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setMode('DEPOSIT')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'DEPOSIT'
                ? 'bg-brand-teal text-white border-2 border-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Nabung (Setor)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('WITHDRAW')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'WITHDRAW'
                ? 'bg-brand-coral text-white border-2 border-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Tarik ke Dompet</span>
          </button>
        </div>

        {/* Target summary pill */}
        <div className="p-3 bg-brand-cream border border-ink/20 rounded-xl text-xs space-y-1">
          <div className="flex justify-between text-ink-muted font-semibold">
            <span>Terkumpul Saat Ini:</span>
            <span className="font-mono font-bold text-ink tabular-nums">
              {formatRupiah(goal.currentAmount)} ({goal.percentage}%)
            </span>
          </div>
          <div className="flex justify-between text-ink-muted font-semibold">
            <span>Target Akhir:</span>
            <span className="font-mono font-bold text-ink tabular-nums">
              {formatRupiah(goal.targetAmount)}
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Nominal {mode === 'DEPOSIT' ? 'Setoran' : 'Penarikan'} (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-base text-ink">
              Rp
            </span>
            <input
              type="text"
              autoFocus
              value={amountRaw}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-ink rounded-xl font-mono text-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal tabular-nums shadow-tactile"
            />
          </div>
        </div>

        {/* Wallet Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            {mode === 'DEPOSIT' ? 'Dari Dompet Sumber' : 'Ke Dompet Tujuan'}
          </label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          >
            {wallets.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({formatRupiah(w.balance)})
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Catatan (Opsional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === 'DEPOSIT' ? 'Gajian bulan ini, bonus freelance, dll.' : 'Kebutuhan mendesak'}
            className="w-full px-3.5 py-2 bg-white border-2 border-ink rounded-xl text-xs text-ink focus:outline-none shadow-tactile"
          />
        </div>

        {/* Projected Progress Preview */}
        {enteredAmount > 0 && (
          <div className="p-3 bg-surface-bg border border-ink/20 rounded-xl text-xs">
            <div className="flex justify-between font-bold text-ink mb-1.5">
              <span>Proyeksi Setelah Transaksi:</span>
              <span className="font-mono text-brand-teal tabular-nums">
                {projectedPercentage}% ({formatRupiah(projectedAmount)})
              </span>
            </div>
            <div className="w-full h-2 bg-brand-cream rounded-full overflow-hidden border border-ink/15">
              <div
                className="h-full bg-brand-teal rounded-full transition-all duration-300"
                style={{ width: `${projectedPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <TactileButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </TactileButton>
          <TactileButton
            type="submit"
            variant={mode === 'DEPOSIT' ? 'teal' : 'coral'}
            loading={loading}
          >
            {mode === 'DEPOSIT' ? 'Konfirmasi Setoran' : 'Konfirmasi Penarikan'}
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default GoalDepositModal;

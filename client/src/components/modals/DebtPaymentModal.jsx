import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { parseRupiahInput, formatRupiah } from '../../utils/formatRupiah';
import api from '../../api/axios';

const DebtPaymentModal = ({
  isOpen,
  onClose,
  debt,
  wallets = [],
  onSuccess,
}) => {
  const [amountRaw, setAmountRaw] = useState('');
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmountRaw('');
      setNote('');
      setError('');
      if (wallets.length > 0) {
        setWalletId(wallets[0]._id);
      }
    }
  }, [isOpen, wallets]);

  if (!debt) return null;

  const isDebt = debt.type === 'DEBT';
  const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
  const enteredAmount = parseRupiahInput(amountRaw);
  const selectedWallet = wallets.find((w) => w._id === walletId);

  const handleAmountChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setAmountRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handlePayFull = () => {
    setAmountRaw(remaining.toLocaleString('id-ID'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!enteredAmount || enteredAmount <= 0) {
      setError('Masukkan nominal pembayaran');
      return;
    }

    if (!walletId) {
      setError('Pilih dompet yang bersangkutan');
      return;
    }

    if (enteredAmount > remaining) {
      setError(`Nominal pembayaran melebihi sisa pinjaman (${formatRupiah(remaining)})`);
      return;
    }

    if (isDebt && selectedWallet && enteredAmount > selectedWallet.balance) {
      setError(`Saldo dompet ${selectedWallet.name} tidak mencukupi (${formatRupiah(selectedWallet.balance)})`);
      return;
    }

    try {
      setLoading(true);
      await api.post(`/debts/${debt._id}/pay`, {
        amount: enteredAmount,
        walletId,
        note: note.trim() || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencatat pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const projectedRemaining = Math.max(0, remaining - enteredAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDebt ? 'Bayar Cicilan Hutang' : 'Terima Pelunasan Piutang'}
      subtitle={`Pihak: ${debt.personName}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Loan summary pill */}
        <div className="p-3 bg-brand-cream border border-ink/20 rounded-xl text-xs space-y-1">
          <div className="flex justify-between text-ink-muted font-semibold">
            <span>Total Pokok:</span>
            <span className="font-mono font-bold text-ink tabular-nums">
              {formatRupiah(debt.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-ink-muted font-semibold">
            <span>Sudah Dibayar:</span>
            <span className="font-mono font-bold text-emerald-800 tabular-nums">
              {formatRupiah(debt.paidAmount)} ({debt.percentage}%)
            </span>
          </div>
          <div className="flex justify-between text-ink font-bold pt-1 border-t border-ink/10">
            <span>Sisa yang Belum Lunas:</span>
            <span className="font-mono text-brand-coral tabular-nums">
              {formatRupiah(remaining)}
            </span>
          </div>
        </div>

        {/* Amount Input & Pay Full Button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Nominal {isDebt ? 'Pembayaran' : 'Penerimaan'} (Rp)
            </label>
            <button
              type="button"
              onClick={handlePayFull}
              className="text-[11px] font-bold text-brand-teal hover:underline"
            >
              Lunasi Semua ({formatRupiah(remaining)})
            </button>
          </div>
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
            {isDebt ? 'Bayar Menggunakan Dompet' : 'Terima ke Dompet'}
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
            Catatan Pembayaran (Opsional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Cicilan ke-2 transfer BCA"
            className="w-full px-3.5 py-2 bg-white border-2 border-ink rounded-xl text-xs text-ink focus:outline-none shadow-tactile"
          />
        </div>

        {/* Projected Remaining Preview */}
        {enteredAmount > 0 && (
          <div className="p-3 bg-surface-bg border border-ink/20 rounded-xl text-xs flex justify-between font-bold">
            <span className="text-ink-muted">Sisa Setelah Pembayaran:</span>
            <span className="font-mono text-ink tabular-nums">
              {projectedRemaining === 0 ? (
                <span className="text-emerald-700">LUNAS 🎉</span>
              ) : (
                formatRupiah(projectedRemaining)
              )}
            </span>
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
            variant={isDebt ? 'coral' : 'teal'}
            loading={loading}
          >
            Konfirmasi Pembayaran
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default DebtPaymentModal;

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { formatRupiah } from '../../utils/formatRupiah';
import { toInputDateFormat } from '../../utils/dateHelper';
import api from '../../api/axios';
import {
  CalendarClock,
  CheckCircle2,
  Wallet,
  Calendar,
  AlertCircle,
} from 'lucide-react';

const PayRecurringModal = ({
  isOpen,
  onClose,
  bill,
  wallets = [],
  onSuccess,
}) => {
  const [walletId, setWalletId] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bill && isOpen) {
      setWalletId(bill.walletId?._id || bill.walletId || (wallets[0]?._id || ''));
      setDate(toInputDateFormat(new Date()));
      setNote('');
      setError('');
    }
  }, [bill, isOpen, wallets]);

  if (!bill) return null;

  const selectedWallet = wallets.find((w) => w._id === walletId);
  const hasInsufficientBalance =
    selectedWallet && selectedWallet.balance < bill.amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!walletId) {
      setError('Pilih dompet sumber dana untuk pembayaran');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/recurring/${bill._id}/pay`, {
        walletId,
        date: date ? new Date(date) : new Date(),
        note: note.trim(),
      });

      // Dispatch global transaction-updated event
      window.dispatchEvent(new CustomEvent('transaction-updated'));

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error executing recurring bill payment:', err);
      setError(err.response?.data?.message || 'Gagal memproses pembayaran tagihan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bayar Tagihan Rutin"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Bill Summary Banner */}
        <div className="p-4 bg-brand-cream/60 border-2 border-ink rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl border-2 border-ink flex items-center justify-center font-bold text-white shadow-tactile"
              style={{ backgroundColor: bill.color || '#359FA0' }}
            >
              <CalendarClock className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-ink leading-tight">
                {bill.name}
              </h4>
              <span className="text-[11px] text-ink-muted">
                Jatuh tempo tgl {bill.dueDay} (
                {bill.frequency === 'MONTHLY'
                  ? 'Bulanan'
                  : bill.frequency === 'WEEKLY'
                  ? 'Mingguan'
                  : 'Tahunan'}
                )
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold font-mono text-brand-coral">
              {formatRupiah(bill.amount)}
            </div>
            <div className="text-[10px] text-ink-muted font-bold">Nominal Tagihan</div>
          </div>
        </div>

        {/* Wallet Selector */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-brand-teal" />
            <span>Pilih Dompet Sumber Dana</span>
          </label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          >
            {wallets.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} — Saldo: Rp {w.balance.toLocaleString('id-ID')}
              </option>
            ))}
          </select>

          {hasInsufficientBalance && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Peringatan: Saldo dompet ini (Rp {selectedWallet?.balance.toLocaleString('id-ID')}) lebih kecil dari nominal tagihan.
              </span>
            </div>
          )}
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-teal" />
            <span>Tanggal Eksekusi Pembayaran</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Additional Note */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Sudah lunas via Auto-debit / VA BCA"
            className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        <p className="text-[11px] text-ink-muted italic">
          *Pembayaran ini otomatis memotong saldo dompet, mencatat pengeluaran di arus kas transaksi, dan memperbarui status tagihan bulan ini menjadi <strong>LUNAS</strong>.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink/15">
          <TactileButton
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </TactileButton>
          <TactileButton
            type="submit"
            variant="coral"
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Memproses...' : 'Konfirmasi Bayar'}</span>
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default PayRecurringModal;

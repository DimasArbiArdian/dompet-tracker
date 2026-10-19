import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { parseRupiahInput, formatRupiah } from '../../utils/formatRupiah';
import { toInputDateFormat } from '../../utils/dateHelper';
import api from '../../api/axios';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const DebtModal = ({
  isOpen,
  onClose,
  debt = null, // null for create, object for edit
  wallets = [],
  onSuccess,
}) => {
  const [type, setType] = useState('DEBT'); // 'DEBT' | 'RECEIVABLE'
  const [personName, setPersonName] = useState('');
  const [totalAmountRaw, setTotalAmountRaw] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [disburseFunds, setDisburseFunds] = useState(false);
  const [walletId, setWalletId] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (debt) {
      setType(debt.type || 'DEBT');
      setPersonName(debt.personName || '');
      setTotalAmountRaw(
        debt.totalAmount ? debt.totalAmount.toLocaleString('id-ID') : ''
      );
      setDueDate(toInputDateFormat(debt.dueDate || new Date()));
      setNotes(debt.notes || '');
      setDisburseFunds(false);
      setWalletId('');
    } else {
      setType('DEBT');
      setPersonName('');
      setTotalAmountRaw('');
      // Default due date: 1 month from now
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      setDueDate(toInputDateFormat(defaultDate));
      setNotes('');
      setDisburseFunds(false);
      setWalletId(wallets.length > 0 ? wallets[0]._id : '');
    }
    setError('');
  }, [debt, isOpen, wallets]);

  const handleAmountChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setTotalAmountRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericTotal = parseRupiahInput(totalAmountRaw);
    if (!personName.trim()) {
      setError('Nama pihak bersangkutan wajib diisi');
      return;
    }
    if (!numericTotal || numericTotal <= 0) {
      setError('Nominal pinjaman harus lebih dari 0');
      return;
    }
    if (!dueDate) {
      setError('Tanggal jatuh tempo wajib ditentukan');
      return;
    }

    if (!debt && disburseFunds && !walletId) {
      setError('Pilih dompet untuk pencairan / penyaluran dana');
      return;
    }

    try {
      setLoading(true);

      if (debt && debt._id) {
        await api.put(`/debts/${debt._id}`, {
          personName: personName.trim(),
          totalAmount: numericTotal,
          dueDate: new Date(dueDate).toISOString(),
          notes: notes.trim(),
        });
      } else {
        await api.post('/debts', {
          type,
          personName: personName.trim(),
          totalAmount: numericTotal,
          dueDate: new Date(dueDate).toISOString(),
          disburseFunds,
          walletId: disburseFunds ? walletId : null,
          notes: notes.trim(),
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan catatan pinjaman.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debt ? 'Edit Catatan Pinjaman' : 'Catat Hutang / Piutang'}
      subtitle="Kelola kewajiban bayar dan hak tagih uang Anda"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1. Type Segmented Control (Only on create) */}
        {!debt ? (
          <div className="grid grid-cols-2 p-1.5 bg-surface-bg border-2 border-ink rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setType('DEBT')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'DEBT'
                  ? 'bg-brand-coral text-white border-2 border-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Hutang Saya (Kewajiban)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('RECEIVABLE')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                type === 'RECEIVABLE'
                  ? 'bg-brand-teal text-white border-2 border-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Piutang Saya (Hak Tagih)</span>
            </button>
          </div>
        ) : (
          <div className="p-2.5 bg-surface-bg border border-ink/20 rounded-xl text-xs font-bold text-ink">
            Jenis:{' '}
            <span
              className={
                debt.type === 'DEBT' ? 'text-brand-coral' : 'text-brand-teal'
              }
            >
              {debt.type === 'DEBT' ? 'Hutang Saya (Kewajiban)' : 'Piutang Saya (Hak Tagih)'}
            </span>
          </div>
        )}

        {/* 2. Person Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            {type === 'DEBT' ? 'Hutang Kepada (Kreditur)' : 'Dipinjam Oleh (Debitur)'}
          </label>
          <input
            type="text"
            required
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder={
              type === 'DEBT'
                ? 'Contoh: Toko Komputer, Bank BCA, Mas Doni'
                : 'Contoh: Budi (Teman Kantor), Kakak, Klien Proyek'
            }
            className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          />
        </div>

        {/* 3. Amount & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
              Total Pokok Pinjaman (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-ink">
                Rp
              </span>
              <input
                type="text"
                required
                value={totalAmountRaw}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-ink rounded-xl font-mono text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal tabular-nums shadow-tactile"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
              Tanggal Jatuh Tempo
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
            />
          </div>
        </div>

        {/* 4. Optional Direct Disbursement to Wallet (Only on create) */}
        {!debt && (
          <div className="p-3.5 bg-brand-cream/60 border border-ink/20 rounded-2xl space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={disburseFunds}
                onChange={(e) => setDisburseFunds(e.target.checked)}
                className="w-4 h-4 rounded text-brand-teal accent-brand-teal cursor-pointer"
              />
              <span className="text-xs font-bold text-ink">
                {type === 'DEBT'
                  ? 'Catat uang masuk langsung ke dompet (Pencairan dana)'
                  : 'Potong saldo dompet langsung (Pemberian pinjaman tunai/transfer)'}
              </span>
            </label>

            {disburseFunds && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-ink-muted mb-1">
                  Pilih Dompet {type === 'DEBT' ? 'Penerima Dana' : 'Sumber Dana'}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-ink/30 rounded-xl text-xs font-semibold text-ink focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* 5. Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: No perjanjian, cicilan 2x, dll."
            className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          />
        </div>

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
            variant={type === 'DEBT' ? 'coral' : 'teal'}
            loading={loading}
          >
            {debt ? 'Simpan Perubahan' : 'Catat Pinjaman'}
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default DebtModal;

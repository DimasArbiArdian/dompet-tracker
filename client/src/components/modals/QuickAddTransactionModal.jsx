import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { formatRupiah, parseRupiahInput } from '../../utils/formatRupiah';
import { toInputDateFormat } from '../../utils/dateHelper';
import api from '../../api/axios';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react';

const QuickAddTransactionModal = ({
  isOpen,
  onClose,
  wallets = [],
  categories = [],
  onSuccess,
}) => {
  const [type, setType] = useState('EXPENSE');
  const [amountRaw, setAmountRaw] = useState('');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(toInputDateFormat(new Date()));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default wallet & category when opened
  useEffect(() => {
    if (isOpen) {
      if (wallets.length > 0 && !walletId) {
        setWalletId(wallets[0]._id);
      }
      if (wallets.length > 1 && !toWalletId) {
        setToWalletId(wallets[1]._id);
      }
      setError('');
    }
  }, [isOpen, wallets]);

  // Filter categories by transaction type
  const availableCategories = categories.filter((c) => c.type === type);

  // Set default category when type changes
  useEffect(() => {
    if (availableCategories.length > 0) {
      setCategoryId(availableCategories[0]._id);
    } else {
      setCategoryId('');
    }
  }, [type, categories]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const num = parseRupiahInput(val);
    setAmountRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseRupiahInput(amountRaw);
    if (!numericAmount || numericAmount <= 0) {
      setError('Masukkan nominal transaksi yang valid');
      return;
    }

    if (!walletId) {
      setError('Pilih dompet sumber');
      return;
    }

    if (type === 'TRANSFER') {
      if (!toWalletId) {
        setError('Pilih dompet tujuan transfer');
        return;
      }
      if (walletId === toWalletId) {
        setError('Dompet asal dan tujuan tidak boleh sama');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Pilih kategori transaksi');
        return;
      }
    }

    try {
      setLoading(true);
      await api.post('/transactions', {
        type,
        amount: numericAmount,
        walletId,
        toWalletId: type === 'TRANSFER' ? toWalletId : null,
        categoryId: type === 'TRANSFER' ? null : categoryId,
        date: new Date(date).toISOString(),
        note: note.trim(),
      });

      // Reset fields
      setAmountRaw('');
      setNote('');
      setDate(toInputDateFormat(new Date()));
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan transaksi. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Transaksi Kilat"
      subtitle="Input transaksi harian dalam hitungan detik"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1. Segmented Control Type: Expense | Income | Transfer */}
        <div className="grid grid-cols-3 p-1.5 bg-surface-bg border-2 border-ink rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              type === 'EXPENSE'
                ? 'bg-brand-coral text-white border-2 border-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Pengeluaran</span>
          </button>

          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              type === 'INCOME'
                ? 'bg-brand-teal text-white border-2 border-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Pemasukan</span>
          </button>

          <button
            type="button"
            onClick={() => setType('TRANSFER')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              type === 'TRANSFER'
                ? 'bg-brand-cream text-ink border-2 border-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Transfer</span>
          </button>
        </div>

        {/* 2. Large formatted amount input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Nominal Uang (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-xl text-ink">
              Rp
            </span>
            <input
              type="text"
              autoFocus
              value={amountRaw}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 bg-white border-2 border-ink rounded-xl font-mono text-2xl font-bold text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-brand-teal tabular-nums shadow-tactile"
            />
          </div>
        </div>

        {/* 3. Category Pills (If not transfer) */}
        {type !== 'TRANSFER' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Pilih Kategori
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {availableCategories.map((cat) => {
                const isSelected = categoryId === cat._id;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setCategoryId(cat._id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                      isSelected
                        ? 'border-ink bg-brand-cream text-ink shadow-sm'
                        : 'border-ink/20 bg-white text-ink-muted hover:border-ink/50 hover:text-ink'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-ink" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Wallet Selection (From & To if Transfer) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
              {type === 'TRANSFER' ? 'Dari Dompet Asal' : 'Dompet'}
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
            >
              <option value="">Pilih Dompet</option>
              {wallets.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {type === 'TRANSFER' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Ke Dompet Tujuan
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
              >
                <option value="">Pilih Dompet Tujuan</option>
                {wallets
                  .filter((w) => w._id !== walletId)
                  .map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
            />
          </div>
        </div>

        {/* 5. Note / Catatan & Smart Tags */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Catatan & Tagar (#Tag)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Makan siang kantor #WFO #Kuliner"
            maxLength={250}
            className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          />

          {/* Quick Tag Suggestion Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold text-ink-muted shrink-0">
              Pilih Tag:
            </span>
            {['#WFO', '#Kuliner', '#Liburan', '#Keluarga', '#Belanja', '#Proyek'].map((tag) => {
              const isActive = note.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setNote(note.replace(new RegExp(`\\s*${tag}`, 'g'), '').trim());
                    } else {
                      setNote(note ? `${note.trim()} ${tag}` : tag);
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-brand-teal text-white border-brand-teal shadow-sm'
                      : 'bg-surface-bg text-ink-muted border-ink/20 hover:border-ink hover:text-ink'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
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
            variant={type === 'EXPENSE' ? 'coral' : type === 'INCOME' ? 'teal' : 'cream'}
            loading={loading}
          >
            Simpan Transaksi
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default QuickAddTransactionModal;

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { parseRupiahInput, formatRupiah } from '../../utils/formatRupiah';
import { toInputDateFormat } from '../../utils/dateHelper';
import api from '../../api/axios';

const GOAL_CATEGORIES = [
  { value: 'EMERGENCY', label: 'Dana Darurat' },
  { value: 'HOLIDAY', label: 'Liburan / Wisata' },
  { value: 'GADGET', label: 'Gadget & Elektronik' },
  { value: 'VEHICLE', label: 'Kendaraan' },
  { value: 'HOUSE', label: 'Rumah & Properti' },
  { value: 'EDUCATION', label: 'Pendidikan / Kursus' },
  { value: 'OTHER', label: 'Tujuan Lainnya' },
];

const PALETTE_COLORS = [
  { name: 'Deep Teal', hex: '#359FA0' },
  { name: 'Soft Mint', hex: '#8AD6D1' },
  { name: 'Warm Cream', hex: '#FFF0C5' },
  { name: 'Coral', hex: '#FF8C52' },
  { name: 'Deep Slate', hex: '#112A2B' },
];

const GoalModal = ({
  isOpen,
  onClose,
  goal = null,
  wallets = [],
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [targetAmountRaw, setTargetAmountRaw] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('EMERGENCY');
  const [color, setColor] = useState('#359FA0');
  const [notes, setNotes] = useState('');

  // Initial deposit fields (only for new goal)
  const [initialDepositRaw, setInitialDepositRaw] = useState('');
  const [walletId, setWalletId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goal) {
      setName(goal.name || '');
      setTargetAmountRaw(
        goal.targetAmount ? goal.targetAmount.toLocaleString('id-ID') : ''
      );
      setTargetDate(toInputDateFormat(goal.targetDate || new Date()));
      setCategory(goal.category || 'OTHER');
      setColor(goal.color || '#359FA0');
      setNotes(goal.notes || '');
      setInitialDepositRaw('');
      setWalletId('');
    } else {
      setName('');
      setTargetAmountRaw('');
      // Default target date: 6 months from now
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setTargetDate(toInputDateFormat(defaultDate));
      setCategory('EMERGENCY');
      setColor('#359FA0');
      setNotes('');
      setInitialDepositRaw('');
      setWalletId(wallets.length > 0 ? wallets[0]._id : '');
    }
    setError('');
  }, [goal, isOpen, wallets]);

  const handleTargetChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setTargetAmountRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleDepositChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setInitialDepositRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const targetNum = parseRupiahInput(targetAmountRaw);
    if (!name.trim()) {
      setError('Nama target tabungan wajib diisi');
      return;
    }
    if (!targetNum || targetNum <= 0) {
      setError('Target nominal harus lebih dari 0');
      return;
    }
    if (!targetDate) {
      setError('Tenggat waktu target wajib dipilih');
      return;
    }

    try {
      setLoading(true);
      const initialDepositNum = parseRupiahInput(initialDepositRaw);

      if (goal && goal._id) {
        await api.put(`/goals/${goal._id}`, {
          name: name.trim(),
          targetAmount: targetNum,
          targetDate: new Date(targetDate).toISOString(),
          category,
          color,
          notes: notes.trim(),
        });
      } else {
        await api.post('/goals', {
          name: name.trim(),
          targetAmount: targetNum,
          targetDate: new Date(targetDate).toISOString(),
          category,
          color,
          notes: notes.trim(),
          initialDeposit: initialDepositNum,
          walletId: initialDepositNum > 0 ? walletId : null,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan target tabungan.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Edit Target Tabungan' : 'Target Tabungan Baru'}
      subtitle="Tetapkan impian finansial dan pantau pencapaiannya"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Nama Target Tabungan
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Dana Darurat 6 Bulan, Beli Laptop, DP Rumah"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
              Kategori Target
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
            >
              {GOAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
              Tenggat Waktu (Target Date)
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Target Nominal yang Ingin Dicapai (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-ink">
              Rp
            </span>
            <input
              type="text"
              required
              value={targetAmountRaw}
              onChange={handleTargetChange}
              placeholder="Contoh: 15.000.000"
              className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-ink rounded-xl font-mono text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal tabular-nums shadow-tactile"
            />
          </div>
        </div>

        {/* Initial deposit section (Only on creation) */}
        {!goal && (
          <div className="p-3.5 bg-brand-cream/60 border border-ink/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">
                Setoran Awal (Opsional)
              </span>
              <span className="text-[11px] text-ink-muted font-medium">
                Langsung alokasikan dana dari dompet
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-muted mb-1">
                  Nominal Setoran Awal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-ink">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={initialDepositRaw}
                    onChange={handleDepositChange}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-ink/30 rounded-xl font-mono text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-muted mb-1">
                  Dari Dompet
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
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Warna Kartu Target
          </label>
          <div className="flex items-center gap-3">
            {PALETTE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-9 h-9 rounded-xl border-2 border-ink transition-transform ${
                  color === c.hex ? 'scale-110 ring-2 ring-ink ring-offset-2' : 'hover:scale-105'
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Catatan / Motivasi (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Disimpan untuk pegangan jika sakit atau renovasi mendesak"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-xs text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          />
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
          <TactileButton type="submit" variant="teal" loading={loading}>
            {goal ? 'Simpan Perubahan' : 'Buat Target Tabungan'}
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default GoalModal;

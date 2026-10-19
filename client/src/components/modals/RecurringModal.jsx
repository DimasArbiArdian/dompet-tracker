import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { parseRupiahInput } from '../../utils/formatRupiah';
import api from '../../api/axios';
import {
  CalendarClock,
  Sparkles,
  Wallet,
  Tag,
  Calendar,
  Layers,
} from 'lucide-react';

const COLOR_OPTIONS = [
  '#359FA0', // Brand Teal
  '#FF8C52', // Brand Coral
  '#8AD6D1', // Brand Mint
  '#112A2B', // Deep Slate
  '#E11D48', // Rose Red
  '#7C3AED', // Purple
  '#2563EB', // Royal Blue
  '#D97706', // Amber
];

const PRESET_SUBSCRIPTIONS = [
  { name: 'Netflix Premium', categoryKeyword: 'Hiburan', color: '#E11D48' },
  { name: 'Spotify Family / Premium', categoryKeyword: 'Hiburan', color: '#10B981' },
  { name: 'WiFi Internet Rumah', categoryKeyword: 'Tagihan', color: '#2563EB' },
  { name: 'Listrik PLN Bulanan', categoryKeyword: 'Tagihan', color: '#D97706' },
  { name: 'Iuran Sewa Kos / Rumah', categoryKeyword: 'Tempat Tinggal', color: '#359FA0' },
  { name: 'YouTube Premium', categoryKeyword: 'Hiburan', color: '#FF8C52' },
  { name: 'Google One / iCloud Storage', categoryKeyword: 'Langganan', color: '#7C3AED' },
  { name: 'Gym / Fitness Membership', categoryKeyword: 'Kesehatan', color: '#112A2B' },
];

const RecurringModal = ({
  isOpen,
  onClose,
  bill = null, // null for create, object for edit
  wallets = [],
  categories = [],
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [dueDay, setDueDay] = useState(1);
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [color, setColor] = useState('#359FA0');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (bill) {
      setName(bill.name || '');
      setAmountRaw(bill.amount ? bill.amount.toLocaleString('id-ID') : '');
      setType(bill.type || 'EXPENSE');
      setFrequency(bill.frequency || 'MONTHLY');
      setDueDay(bill.dueDay || 1);
      setWalletId(bill.walletId?._id || bill.walletId || (wallets[0]?._id || ''));
      setCategoryId(bill.categoryId?._id || bill.categoryId || (categories[0]?._id || ''));
      setColor(bill.color || '#359FA0');
      setNotes(bill.notes || '');
      setIsActive(bill.isActive !== undefined ? bill.isActive : true);
    } else {
      setName('');
      setAmountRaw('');
      setType('EXPENSE');
      setFrequency('MONTHLY');
      setDueDay(1);
      setWalletId(wallets.length > 0 ? wallets[0]._id : '');
      setCategoryId(availableCategories.length > 0 ? availableCategories[0]._id : '');
      setColor('#359FA0');
      setNotes('');
      setIsActive(true);
    }
    setError('');
  }, [bill, isOpen, wallets, categories]);

  const handleAmountChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setAmountRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handlePickPreset = (preset) => {
    setName(preset.name);
    setColor(preset.color);
    // Auto-match category if possible
    const matched = categories.find((c) =>
      c.name.toLowerCase().includes(preset.categoryKeyword.toLowerCase())
    );
    if (matched) {
      setCategoryId(matched._id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseRupiahInput(amountRaw);
    if (!name.trim()) {
      setError('Nama tagihan/langganan wajib diisi');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Nominal harus lebih besar dari 0');
      return;
    }
    if (!walletId) {
      setError('Pilih dompet pembayaran default');
      return;
    }
    if (!categoryId) {
      setError('Pilih kategori pengeluaran');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        amount: parsedAmount,
        type,
        frequency,
        dueDay: Number(dueDay),
        walletId,
        categoryId,
        color,
        notes: notes.trim(),
        isActive,
      };

      if (bill) {
        await api.put(`/recurring/${bill._id}`, payload);
      } else {
        await api.post('/recurring', payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving recurring bill:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan tagihan rutin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bill ? 'Edit Tagihan / Langganan' : 'Tambah Tagihan Rutin Baru'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Quick Presets for new bills */}
        {!bill && (
          <div>
            <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
              <span>Contoh Langganan Populer</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-surface-bg border border-ink/15 rounded-xl">
              {PRESET_SUBSCRIPTIONS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handlePickPreset(p)}
                  className="px-2.5 py-1 bg-white border border-ink/20 rounded-lg text-xs font-semibold text-ink hover:bg-brand-cream hover:border-ink transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Nama Tagihan / Layanan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Netflix, WiFi Biznet, Listrik PLN, Kosan"
            className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Nominal Tagihan per Siklus <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-muted font-mono">
              Rp
            </span>
            <input
              type="text"
              required
              value={amountRaw}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full pl-11 pr-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-base font-extrabold font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>
        </div>

        {/* Frequency & Due Day */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Frekuensi Penagihan
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            >
              <option value="MONTHLY">Bulanan (Setiap Bulan)</option>
              <option value="WEEKLY">Mingguan (Tiap Pekan)</option>
              <option value="YEARLY">Tahunan (Tiap Tahun)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Tanggal Jatuh Tempo <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
              />
              <span className="text-xs font-medium text-ink-muted shrink-0">
                {frequency === 'MONTHLY' ? 'tiap bln' : frequency === 'WEEKLY' ? 'hari ke' : 'tgl'}
              </span>
            </div>
          </div>
        </div>

        {/* Default Wallet & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink mb-1 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-brand-teal" />
              <span>Dompet Default</span>
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            >
              {wallets.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-brand-coral" />
              <span>Kategori</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            >
              {availableCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
            Warna Aksen Penanda di Kalender
          </label>
          <div className="flex items-center gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                  color === c
                    ? 'border-ink scale-110 shadow-sm'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: No. Pelanggan 12345678 / Paket 4 Layar"
            className="w-full px-3 py-2 bg-surface-bg border-2 border-ink rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Is Active Toggle */}
        <div className="flex items-center justify-between p-3 bg-surface-bg border border-ink/20 rounded-xl">
          <div>
            <span className="text-xs font-bold text-ink block">
              Status Berlangganan Aktif
            </span>
            <span className="text-[11px] text-ink-muted">
              Nonaktifkan jika langganan dijeda sementara
            </span>
          </div>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-5 h-5 rounded text-brand-teal accent-brand-teal cursor-pointer"
          />
        </div>

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
            variant="primary"
            disabled={loading}
            className="min-w-[130px]"
          >
            {loading ? 'Menyimpan...' : bill ? 'Perbarui' : 'Simpan Tagihan'}
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default RecurringModal;

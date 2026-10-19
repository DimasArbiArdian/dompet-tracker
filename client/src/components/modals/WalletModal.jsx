import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import TactileButton from '../ui/TactileButton';
import { parseRupiahInput } from '../../utils/formatRupiah';
import api from '../../api/axios';

const WALLET_TYPES = [
  { value: 'BANK', label: 'Rekening Bank' },
  { value: 'EWALLET', label: 'E-Wallet (GoPay, OVO, dll)' },
  { value: 'CASH', label: 'Uang Tunai (Cash)' },
  { value: 'INVESTMENT', label: 'Investasi / Reksadana' },
];

const PALETTE_COLORS = [
  { name: 'Deep Teal', hex: '#359FA0' },
  { name: 'Soft Mint', hex: '#8AD6D1' },
  { name: 'Warm Cream', hex: '#FFF0C5' },
  { name: 'Coral', hex: '#FF8C52' },
  { name: 'Deep Slate', hex: '#112A2B' },
];

const WalletModal = ({
  isOpen,
  onClose,
  wallet = null, // null for new, object for edit
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balanceRaw, setBalanceRaw] = useState('');
  const [color, setColor] = useState('#359FA0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (wallet) {
      setName(wallet.name || '');
      setType(wallet.type || 'BANK');
      setBalanceRaw(wallet.balance ? wallet.balance.toLocaleString('id-ID') : '0');
      setColor(wallet.color || '#359FA0');
    } else {
      setName('');
      setType('BANK');
      setBalanceRaw('');
      setColor('#359FA0');
    }
    setError('');
  }, [wallet, isOpen]);

  const handleBalanceChange = (e) => {
    const num = parseRupiahInput(e.target.value);
    setBalanceRaw(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama dompet wajib diisi');
      return;
    }

    try {
      setLoading(true);
      const balanceNum = parseRupiahInput(balanceRaw);

      if (wallet && wallet._id) {
        await api.put(`/wallets/${wallet._id}`, {
          name: name.trim(),
          type,
          balance: balanceNum,
          color,
        });
      } else {
        await api.post('/wallets', {
          name: name.trim(),
          type,
          balance: balanceNum,
          color,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan dompet. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={wallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}
      subtitle="Kelola rekening bank, e-wallet, atau kas tunai"
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
            Nama Dompet
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: BCA Prioritas, GoPay, Dompet Saku"
            className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            Tipe Akun
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
          >
            {WALLET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
            {wallet ? 'Saldo Saat Ini' : 'Saldo Awal'} (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-ink">
              Rp
            </span>
            <input
              type="text"
              value={balanceRaw}
              onChange={handleBalanceChange}
              placeholder="0"
              className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-ink rounded-xl font-mono text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal tabular-nums shadow-tactile"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Warna Identitas
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
            {wallet ? 'Simpan Perubahan' : 'Buat Dompet'}
          </TactileButton>
        </div>
      </form>
    </Modal>
  );
};

export default WalletModal;

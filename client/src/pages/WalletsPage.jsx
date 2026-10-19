import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import { WalletTypeBadge } from '../components/ui/Badge';
import { formatRupiah } from '../utils/formatRupiah';
import { usePrivacy } from '../context/PrivacyContext';
import {
  Wallet,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Archive,
  CreditCard,
  Building,
  Smartphone,
  TrendingUp,
} from 'lucide-react';

const WalletsPage = ({
  wallets = [],
  onRefresh,
  onOpenAddWallet,
  onOpenEditWallet,
  onOpenTransfer,
}) => {
  const { mask } = usePrivacy();
  const [loading, setLoading] = useState(false);

  const totalBalance = wallets
    .filter((w) => !w.isArchived)
    .reduce((sum, w) => sum + (w.balance || 0), 0);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus dompet "${name}"? Jika sudah memiliki transaksi, dompet akan diarsipkan.`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.delete(`/wallets/${id}`);
      alert(res.data.message);
      onRefresh?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus dompet');
    } finally {
      setLoading(false);
    }
  };

  const getWalletIcon = (type) => {
    switch (type) {
      case 'BANK':
        return Building;
      case 'EWALLET':
        return Smartphone;
      case 'INVESTMENT':
        return TrendingUp;
      case 'CASH':
      default:
        return Wallet;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Net Worth summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-ink">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight">
            Manajemen Multi-Dompet
          </h2>
          <p className="text-xs text-ink-muted">
            Kelola seluruh rekening bank, e-wallet, kas tunai, dan pos tabungan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TactileButton
            variant="cream"
            size="sm"
            icon={ArrowLeftRight}
            onClick={onOpenTransfer}
          >
            Transfer Antar Dompet
          </TactileButton>
          <TactileButton
            variant="teal"
            size="sm"
            icon={Plus}
            onClick={onOpenAddWallet}
          >
            Tambah Dompet
          </TactileButton>
        </div>
      </div>

      {/* Top Banner: Total Net Worth across wallets */}
      <div className="p-6 bg-brand-cream border-2 border-ink rounded-2xl shadow-tactile flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Total Saldo Seluruh Dompet
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-extrabold text-ink tabular-nums mt-1">
            {mask(formatRupiah(totalBalance))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl border border-ink/20 bg-white font-bold text-xs text-ink">
            {wallets.length} Akun Terdaftar
          </span>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map((w) => {
          const Icon = getWalletIcon(w.type);

          return (
            <div
              key={w._id}
              className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between transition-transform hover:translate-y-[-2px]"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl border-2 border-ink flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor: w.color,
                        color: '#112A2B',
                      }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-ink text-base tracking-tight leading-tight">
                        {w.name}
                      </h4>
                      <div className="mt-0.5">
                        <WalletTypeBadge type={w.type} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditWallet(w)}
                      className="p-1 text-ink-muted hover:text-ink hover:bg-black/5 rounded"
                      title="Edit Dompet"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(w._id, w.name)}
                      className="p-1 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded"
                      title="Hapus / Arsipkan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-ink/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Saldo Aktif
                  </span>
                  <div className="text-2xl font-mono font-extrabold text-ink tabular-nums mt-0.5">
                    {mask(formatRupiah(w.balance))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-ink/10 flex items-center justify-between text-xs text-ink-muted">
                <span>Status: {w.isArchived ? 'Diarsipkan' : 'Aktif'}</span>
                <button
                  onClick={onOpenTransfer}
                  className="font-bold text-brand-teal hover:underline flex items-center gap-1"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Wallet Card Prompt */}
        <button
          onClick={onOpenAddWallet}
          className="border-2 border-dashed border-ink/30 rounded-2xl p-6 hover:border-brand-teal hover:bg-brand-mint/10 transition-all flex flex-col items-center justify-center gap-2 text-center min-h-[180px]"
        >
          <div className="w-10 h-10 rounded-xl bg-surface-bg border border-ink/20 flex items-center justify-center text-ink-muted">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-bold text-ink text-sm">
            Tambah Dompet Baru
          </span>
          <span className="text-xs text-ink-muted max-w-[200px]">
            Hubungkan kas tunai, rekening baru, atau dompet digital
          </span>
        </button>
      </div>
    </div>
  );
};

export default WalletsPage;

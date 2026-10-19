import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import { TransactionTypeBadge } from '../components/ui/Badge';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDateID, toInputDateFormat } from '../utils/dateHelper';
import { usePrivacy } from '../context/PrivacyContext';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

const TransactionsPage = ({ wallets = [], categories = [] }) => {
  const { mask } = usePrivacy();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '15');
      if (search.trim()) params.append('search', search.trim());
      if (walletFilter) params.append('walletId', walletFilter);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (tagFilter) params.append('tag', tagFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Gagal mengambil daftar transaksi.');
    } finally {
      setLoading(false);
    }
  }, [page, search, walletFilter, categoryFilter, typeFilter, tagFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini? Saldo dompet terkait akan disesuaikan kembali.')) {
      return;
    }
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert('Gagal menghapus transaksi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Tidak ada transaksi untuk diekspor');
      return;
    }

    const headers = ['Tanggal', 'Jenis', 'Nominal', 'Kategori/Deskripsi', 'Dompet Asal', 'Dompet Tujuan', 'Catatan'];
    const rows = transactions.map((t) => [
      formatDateID(t.date),
      t.type,
      t.amount,
      t.categoryId?.name || (t.type === 'TRANSFER' ? 'Transfer Antar Dompet' : '-'),
      t.walletId?.name || '-',
      t.toWalletId?.name || '-',
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dompet_transaksi_${toInputDateFormat(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearch('');
    setWalletFilter('');
    setCategoryFilter('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-ink">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight">
            Riwayat Transaksi
          </h2>
          <p className="text-xs text-ink-muted">
            Total {pagination.total} transaksi tercatat di seluruh dompet Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TactileButton
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Ekspor CSV
          </TactileButton>
          <TactileButton
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchTransactions}
          >
            Segarkan
          </TactileButton>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-2 border-ink rounded-2xl p-4 shadow-tactile space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari catatan transaksi..."
              className="w-full pl-9 pr-3 py-2 bg-surface-bg border border-ink/20 rounded-xl text-xs font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-surface-bg border border-ink/20 rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">Semua Jenis (Income / Expense / Transfer)</option>
              <option value="EXPENSE">Hanya Pengeluaran</option>
              <option value="INCOME">Hanya Pemasukan</option>
              <option value="TRANSFER">Hanya Transfer</option>
            </select>
          </div>

          {/* Wallet Filter */}
          <div>
            <select
              value={walletFilter}
              onChange={(e) => {
                setWalletFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-surface-bg border border-ink/20 rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-surface-bg border border-ink/20 rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date range row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/10 text-xs">
          <span className="font-bold text-ink-muted flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Rentang:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 bg-surface-bg border border-ink/20 rounded-lg font-semibold text-ink text-xs focus:outline-none"
          />
          <span className="text-ink-muted">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1 bg-surface-bg border border-ink/20 rounded-lg font-semibold text-ink text-xs focus:outline-none"
          />

          {(search || walletFilter || categoryFilter || typeFilter || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs font-bold text-brand-coral hover:underline"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border-2 border-ink rounded-2xl shadow-tactile overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bg border-b-2 border-ink text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Pos / Kategori</th>
                <th className="py-3 px-4">Dompet</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 text-sm">
              {transactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';

                return (
                  <tr
                    key={tx._id}
                    className="hover:bg-brand-cream/20 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-ink">
                      {formatDateID(tx.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <TransactionTypeBadge type={tx.type} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-ink">
                        {tx.type === 'TRANSFER'
                          ? `Transfer: ${tx.walletId?.name || ''} → ${tx.toWalletId?.name || ''}`
                          : tx.categoryId?.name || 'Lainnya'}
                      </div>
                      {tx.note && (
                        <div className="text-xs text-ink-muted italic truncate max-w-xs">
                          "{tx.note}"
                        </div>
                      )}
                      {tx.tags && tx.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tx.tags.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setTagFilter(t === tagFilter ? '' : t);
                                setPage(1);
                              }}
                              className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                tagFilter === t
                                  ? 'bg-brand-teal text-white border-brand-teal'
                                  : 'bg-brand-mint/20 text-brand-teal border-brand-teal/30 hover:bg-brand-mint/40'
                              }`}
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: tx.walletId?.color || '#359FA0',
                          }}
                        />
                        {tx.walletId?.name || 'Dompet'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-mono font-bold text-sm sm:text-base tabular-nums ${
                          isIncome
                            ? 'text-brand-teal'
                            : isExpense
                            ? 'text-brand-coral'
                            : 'text-ink'
                        }`}
                      >
                        {isExpense ? '- ' : isIncome ? '+ ' : ''}
                        {mask(formatRupiah(tx.amount))}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(tx._id)}
                        title="Hapus Transaksi"
                        className="p-1.5 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-ink-muted">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-surface-bg border-t-2 border-ink flex items-center justify-between">
          <div className="text-xs font-semibold text-ink-muted">
            Halaman <span className="text-ink font-bold">{page}</span> dari{' '}
            <span className="text-ink font-bold">{pagination.totalPages || 1}</span> ({pagination.total} transaksi)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border-2 border-ink bg-white shadow-tactile text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-bg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border-2 border-ink bg-white shadow-tactile text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-bg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import RecurringModal from '../components/modals/RecurringModal';
import PayRecurringModal from '../components/modals/PayRecurringModal';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDateID } from '../utils/dateHelper';
import { usePrivacy } from '../context/PrivacyContext';
import {
  CalendarClock,
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Edit2,
  Trash2,
  Wallet,
  Tag,
  ChevronLeft,
  ChevronRight,
  Power,
  Sparkles,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const SubscriptionsPage = ({ wallets = [], categories = [] }) => {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({
    totalMonthlyCommitment: 0,
    paidThisMonthAmount: 0,
    pendingThisMonthAmount: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    activeCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View state: 'GRID' | 'CALENDAR'
  const [viewMode, setViewMode] = useState('GRID');

  // Calendar state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1); // 1-12
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calendarData, setCalendarData] = useState(null);
  const [calLoading, setCalLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'PAID'

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState(null);

  const { mask } = usePrivacy();

  // Fetch list of recurring bills
  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/recurring');
      setBills(res.data.data || []);
      setSummary({
        totalMonthlyCommitment: res.data.totalMonthlyCommitment || 0,
        paidThisMonthAmount: res.data.paidThisMonthAmount || 0,
        pendingThisMonthAmount: res.data.pendingThisMonthAmount || 0,
        dueSoonCount: res.data.dueSoonCount || 0,
        overdueCount: res.data.overdueCount || 0,
        activeCount: res.data.activeCount || 0,
      });
    } catch (err) {
      console.error('Error fetching recurring bills:', err);
      setError('Gagal memuat daftar tagihan rutin.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch calendar events
  const fetchCalendar = useCallback(async (m, y) => {
    try {
      setCalLoading(true);
      const res = await api.get(`/recurring/calendar?month=${m}&year=${y}`);
      setCalendarData(res.data);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setCalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    if (viewMode === 'CALENDAR') {
      fetchCalendar(calMonth, calYear);
    }
  }, [viewMode, calMonth, calYear, fetchCalendar]);

  const handlePrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleToggleActive = async (bill) => {
    try {
      await api.put(`/recurring/${bill._id}`, {
        isActive: !bill.isActive,
      });
      fetchBills();
      if (viewMode === 'CALENDAR') fetchCalendar(calMonth, calYear);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status aktif');
    }
  };

  const handleDelete = async (bill) => {
    if (!window.confirm(`Hapus tagihan rutin "${bill.name}"?`)) return;
    try {
      await api.delete(`/recurring/${bill._id}`);
      fetchBills();
      if (viewMode === 'CALENDAR') fetchCalendar(calMonth, calYear);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus tagihan');
    }
  };

  // Filtered bills
  const filteredBills = bills.filter((b) => {
    if (statusFilter === 'ACTIVE' && !b.isActive) return false;
    if (statusFilter === 'INACTIVE' && b.isActive) return false;
    if (statusFilter === 'PENDING' && b.isPaidThisMonth) return false;
    if (statusFilter === 'PAID' && !b.isPaidThisMonth) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchNotes = b.notes?.toLowerCase().includes(q);
      const matchCategory = b.categoryId?.name?.toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchCategory) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Recurring CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-ink">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <span>Tagihan Rutin & Langganan</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cream text-ink font-bold border border-ink/20">
              Recurring & Subscriptions
            </span>
          </h2>
          <p className="text-xs text-ink-muted">
            Kelola langganan bulanan, pantau kalender jatuh tempo, dan eksekusi pembayaran 1-klik
          </p>
        </div>

        <TactileButton
          variant="primary"
          onClick={() => {
            setEditingBill(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>Tambah Tagihan Baru</span>
        </TactileButton>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Komitmen Bulanan */}
        <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Komitmen Bulanan
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-cream border-2 border-ink text-ink flex items-center justify-center font-bold">
              <CalendarClock className="w-4 h-4 text-brand-teal" strokeWidth={2.2} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-ink tracking-tight">
              {mask(formatRupiah(summary.totalMonthlyCommitment))}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              Beban pengeluaran tetap per bulan ({summary.activeCount} aktif)
            </p>
          </div>
        </div>

        {/* Sudah Dibayar Bulan Ini */}
        <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Lunas Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-mint/30 border-2 border-brand-teal text-brand-teal flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-brand-teal tracking-tight">
              {mask(formatRupiah(summary.paidThisMonthAmount))}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              Sudah dieksekusi di bulan berjalan
            </p>
          </div>
        </div>

        {/* Menunggu Pembayaran */}
        <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Sisa Tagihan Bulan Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-coral/20 border-2 border-brand-coral text-brand-coral flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-brand-coral tracking-tight">
              {mask(formatRupiah(summary.pendingThisMonthAmount))}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              Belum dibayar di siklus ini
            </p>
          </div>
        </div>

        {/* Perhatian Jatuh Tempo */}
        <div
          className={`border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between ${
            summary.overdueCount > 0
              ? 'bg-red-50 border-red-500'
              : summary.dueSoonCount > 0
              ? 'bg-amber-50 border-amber-500'
              : 'bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Perhatian Tempo
            </span>
            <div
              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold ${
                summary.overdueCount > 0
                  ? 'bg-red-100 border-red-600 text-red-600'
                  : summary.dueSoonCount > 0
                  ? 'bg-amber-100 border-amber-600 text-amber-600'
                  : 'bg-surface-bg border-ink text-ink-muted'
              }`}
            >
              {summary.overdueCount > 0 ? (
                <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Clock className="w-4 h-4" strokeWidth={2.5} />
              )}
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-ink tracking-tight">
              {summary.overdueCount > 0 ? (
                <span className="text-red-600">{summary.overdueCount} Terlambat</span>
              ) : summary.dueSoonCount > 0 ? (
                <span className="text-amber-700">{summary.dueSoonCount} Segera</span>
              ) : (
                <span className="text-brand-teal text-xl">Semua Terkendali</span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              {summary.overdueCount > 0
                ? 'Ada tagihan aktif yang melewati tanggal jatuh tempo'
                : summary.dueSoonCount > 0
                ? 'Ada tagihan jatuh tempo dalam 3 hari ke depan'
                : 'Tidak ada tagihan tertunda mendesak'}
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher & Filter Controls */}
      <div className="bg-white border-2 border-ink rounded-2xl p-4 shadow-tactile flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* View Switcher: GRID vs CALENDAR */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-bg border-2 border-ink rounded-xl self-start md:self-auto">
          <button
            onClick={() => setViewMode('GRID')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'GRID'
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tampilan Kartu</span>
          </button>
          <button
            onClick={() => setViewMode('CALENDAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'CALENDAR'
                ? 'bg-brand-teal text-white shadow-sm'
                : 'text-ink-muted hover:text-brand-teal'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Kalender Tagihan</span>
          </button>
        </div>

        {/* Search & Filter Tabs for Grid View */}
        {viewMode === 'GRID' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 md:justify-end">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'PENDING', label: 'Belum Bayar' },
                { id: 'PAID', label: 'Lunas' },
                { id: 'ACTIVE', label: 'Aktif' },
                { id: 'INACTIVE', label: 'Dijeda' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
                    statusFilter === tab.id
                      ? 'bg-brand-cream border-ink text-ink shadow-sm'
                      : 'border-transparent text-ink-muted hover:text-ink hover:bg-surface-bg'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Cari tagihan / langganan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-bg border-2 border-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
              />
            </div>
          </div>
        ) : (
          /* Calendar Month Navigator */
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border-2 border-ink bg-surface-bg hover:bg-brand-cream transition-colors text-ink shadow-sm"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-extrabold text-ink min-w-[130px] text-center font-mono">
              {MONTH_NAMES[calMonth - 1]} {calYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border-2 border-ink bg-surface-bg hover:bg-brand-cream transition-colors text-ink shadow-sm"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'GRID' ? (
        /* GRID VIEW */
        loading && bills.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-ink rounded-2xl shadow-tactile">
            <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-ink-muted">
              Memuat daftar tagihan rutin...
            </p>
          </div>
        ) : filteredBills.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center bg-white border-2 border-ink rounded-2xl shadow-tactile flex flex-col items-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-cream border-2 border-ink flex items-center justify-center text-ink shadow-tactile mb-4">
              <CalendarClock className="w-8 h-8 text-brand-teal" strokeWidth={2} />
            </div>
            <h3 className="font-extrabold text-lg text-ink">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Tidak Ditemukan Tagihan'
                : 'Belum Ada Tagihan Rutin'}
            </h3>
            <p className="text-xs text-ink-muted mt-1 mb-5">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Coba ganti kata kunci pencarian atau ubah filter status di atas.'
                : 'Tambahkan langganan seperti WiFi, listrik, Netflix, atau sewa kosan agar tidak terlewat tanggal jatuh tempo.'}
            </p>
            <TactileButton
              variant="primary"
              onClick={() => {
                setEditingBill(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Tambah Tagihan Pertama</span>
            </TactileButton>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBills.map((b) => {
              const isPaid = b.isPaidThisMonth;
              const isOverdue = b.billStatus === 'OVERDUE';
              const isDueSoon = b.billStatus === 'DUE_SOON';

              return (
                <div
                  key={b._id}
                  className={`bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between transition-all duration-150 ${
                    !b.isActive
                      ? 'opacity-60 bg-gray-50'
                      : isOverdue
                      ? 'border-red-400 bg-red-50/15'
                      : ''
                  }`}
                >
                  <div>
                    {/* Header: Color Accent Tag & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-ink shadow-sm shrink-0"
                          style={{ backgroundColor: b.color || '#359FA0' }}
                        />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                          {b.frequency === 'MONTHLY'
                            ? 'Bulanan'
                            : b.frequency === 'WEEKLY'
                            ? 'Mingguan'
                            : 'Tahunan'}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {!b.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            DIJEDA
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-700 border border-green-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>LUNAS BLN INI</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>LEWAT TEMPO</span>
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>SEGERA ({b.dueDay - now.getDate()} HARI)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-bg text-ink-muted border border-ink/20">
                            <span>TGL {b.dueDay}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Amount */}
                    <div className="mb-3">
                      <h4 className="text-base font-extrabold text-ink tracking-tight truncate">
                        {b.name}
                      </h4>
                      <div className="text-xl font-extrabold font-mono text-ink mt-1">
                        {mask(formatRupiah(b.amount))}
                        <span className="text-xs font-normal text-ink-muted ml-1">
                          /{b.frequency === 'MONTHLY' ? 'bln' : b.frequency === 'WEEKLY' ? 'mgg' : 'thn'}
                        </span>
                      </div>
                    </div>

                    {/* Meta info: Due date, Wallet, Category */}
                    <div className="space-y-1.5 mb-4 p-2.5 bg-surface-bg border border-ink/15 rounded-xl text-xs">
                      <div className="flex items-center justify-between text-ink-muted">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-brand-teal" />
                          <span>Jatuh Tempo:</span>
                        </span>
                        <span className="font-bold text-ink">
                          Tiap tanggal {b.dueDay}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-brand-coral" />
                          <span>Dompet Default:</span>
                        </span>
                        <span className="font-bold text-ink truncate max-w-[140px]">
                          {b.walletId?.name || 'Utama'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-ink-muted" />
                          <span>Kategori:</span>
                        </span>
                        <span className="font-bold text-ink truncate max-w-[140px]">
                          {b.categoryId?.name || 'Tagihan'}
                        </span>
                      </div>

                      {b.notes && (
                        <p className="text-[11px] text-ink-muted italic pt-1 border-t border-ink/10 truncate">
                          "{b.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-ink/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(b)}
                        title={b.isActive ? 'Jeda Langganan' : 'Aktifkan Kembali'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          b.isActive
                            ? 'text-brand-teal hover:bg-brand-mint/20 border-transparent hover:border-brand-teal/30'
                            : 'text-gray-400 hover:text-ink hover:bg-surface-bg border-transparent'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingBill(b);
                          setIsModalOpen(true);
                        }}
                        title="Edit Tagihan"
                        className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-bg rounded-lg transition-colors border border-transparent hover:border-ink/20"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        title="Hapus Tagihan"
                        className="p-1.5 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {b.isActive && !isPaid ? (
                      <TactileButton
                        variant="coral"
                        size="sm"
                        onClick={() => {
                          setSelectedBillForPay(b);
                          setIsPayModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang</span>
                      </TactileButton>
                    ) : isPaid ? (
                      <span className="text-xs font-bold text-green-700 flex items-center gap-1 py-1 px-2 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lunas
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* CALENDAR VIEW */
        <div className="bg-white border-2 border-ink rounded-2xl p-4 sm:p-6 shadow-tactile">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-ink">
            <div>
              <h3 className="text-base font-extrabold text-ink flex items-center gap-2">
                <span>Kalender Pengeluaran Rutin</span>
                <span className="text-xs font-normal text-ink-muted">
                  ({MONTH_NAMES[calMonth - 1]} {calYear})
                </span>
              </h3>
              <p className="text-xs text-ink-muted">
                Perkiraan total tagihan bulan ini:{' '}
                <strong className="text-ink font-mono">
                  {mask(formatRupiah(calendarData?.totalMonthEstimate || 0))}
                </strong>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-ink-muted">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Lunas</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-coral" />
                <span>Menunggu</span>
              </span>
            </div>
          </div>

          {calLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs font-bold text-ink-muted">
                Menyusun kalender tagihan...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day Headers (Senin - Minggu) */}
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((dayName) => (
                <div
                  key={dayName}
                  className="text-center py-2 text-xs font-extrabold text-ink-muted uppercase tracking-wider bg-surface-bg border border-ink/10 rounded-lg"
                >
                  {dayName}
                </div>
              ))}

              {/* Offset days for the first day of month */}
              {calendarData?.days && calendarData.days.length > 0
                ? Array.from({ length: calendarData.days[0].dayOfWeek }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[75px] sm:min-h-[95px] p-1.5 bg-surface-bg/30 border border-dashed border-ink/10 rounded-xl"
                    />
                  ))
                : null}

              {/* Day Cells */}
              {calendarData?.days?.map((d) => {
                const isCurrentToday =
                  d.day === now.getDate() &&
                  calMonth === now.getMonth() + 1 &&
                  calYear === now.getFullYear();

                const hasBills = d.bills.length > 0;

                return (
                  <div
                    key={d.day}
                    className={`min-h-[75px] sm:min-h-[95px] p-1.5 rounded-xl border flex flex-col justify-between transition-colors ${
                      isCurrentToday
                        ? 'border-2 border-brand-teal bg-brand-cream/30 shadow-sm'
                        : hasBills
                        ? 'border-ink/25 bg-white hover:border-ink'
                        : 'border-ink/10 bg-white/60'
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold font-mono w-6 h-6 flex items-center justify-center rounded-full ${
                          isCurrentToday
                            ? 'bg-brand-teal text-white shadow-sm'
                            : 'text-ink'
                        }`}
                      >
                        {d.day}
                      </span>
                      {hasBills && (
                        <span className="text-[10px] font-mono font-bold text-ink-muted hidden sm:inline">
                          {mask(formatRupiah(d.totalDayAmount))}
                        </span>
                      )}
                    </div>

                    {/* Bills on this day */}
                    <div className="space-y-1 my-1 overflow-y-auto max-h-16">
                      {d.bills.map((billItem) => (
                        <div
                          key={billItem._id}
                          onClick={() => {
                            const fullBill = bills.find((b) => b._id === billItem._id);
                            if (fullBill && !billItem.isPaid) {
                              setSelectedBillForPay(fullBill);
                              setIsPayModalOpen(true);
                            }
                          }}
                          title={`${billItem.name} (${formatRupiah(billItem.amount)}) - ${
                            billItem.isPaid ? 'Lunas' : 'Klik untuk bayar'
                          }`}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center justify-between cursor-pointer border transition-transform hover:scale-102 ${
                            billItem.isPaid
                              ? 'bg-green-50 text-green-700 border-green-300'
                              : 'bg-brand-coral/10 text-brand-coral border-brand-coral/30 hover:bg-brand-coral/20'
                          }`}
                        >
                          <div className="flex items-center gap-1 truncate">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: billItem.color || '#359FA0' }}
                            />
                            <span className="truncate">{billItem.name}</span>
                          </div>
                          {billItem.isPaid && (
                            <CheckCircle2 className="w-2.5 h-2.5 text-green-600 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="h-0.5" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recurring Modal (Add / Edit) */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBill(null);
        }}
        bill={editingBill}
        wallets={wallets}
        categories={categories}
        onSuccess={() => {
          fetchBills();
          if (viewMode === 'CALENDAR') fetchCalendar(calMonth, calYear);
        }}
      />

      {/* Pay Recurring Modal */}
      <PayRecurringModal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedBillForPay(null);
        }}
        bill={selectedBillForPay}
        wallets={wallets}
        onSuccess={() => {
          fetchBills();
          if (viewMode === 'CALENDAR') fetchCalendar(calMonth, calYear);
        }}
      />
    </div>
  );
};

export default SubscriptionsPage;

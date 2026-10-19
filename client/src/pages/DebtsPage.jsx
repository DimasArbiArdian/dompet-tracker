import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import DebtModal from '../components/modals/DebtModal';
import DebtPaymentModal from '../components/modals/DebtPaymentModal';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDateID } from '../utils/dateHelper';
import { usePrivacy } from '../context/PrivacyContext';
import {
  HandCoins,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Edit2,
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wallet,
  User,
} from 'lucide-react';

const DebtsPage = ({ wallets = [] }) => {
  const [debts, setDebts] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [netLoanPosition, setNetLoanPosition] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'DEBT' | 'RECEIVABLE'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'UNSETTLED' | 'SETTLED' | 'OVERDUE'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);

  // Accordion state for payment history: { [debtId]: boolean }
  const [expandedHistories, setExpandedHistories] = useState({});

  const { mask } = usePrivacy();

  const fetchDebts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/debts');
      setDebts(res.data.data || []);
      setTotalDebt(res.data.totalDebt || 0);
      setTotalReceivable(res.data.totalReceivable || 0);
      setNetLoanPosition(res.data.netLoanPosition || 0);
    } catch (err) {
      console.error('Error fetching debts:', err);
      setError('Gagal memuat daftar hutang & piutang.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const toggleHistory = (id) => {
    setExpandedHistories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteDebt = async (id, personName, type) => {
    const typeLabel = type === 'DEBT' ? 'hutang kepada' : 'piutang dari';
    if (!window.confirm(`Hapus catatan ${typeLabel} "${personName}"?`)) return;
    try {
      await api.delete(`/debts/${id}`);
      fetchDebts();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus catatan');
    }
  };

  const handleDeletePayment = async (debtId, paymentId) => {
    if (!window.confirm('Hapus riwayat cicilan ini? Saldo dompet akan disesuaikan kembali.')) return;
    try {
      await api.delete(`/debts/${debtId}/payments/${paymentId}`);
      fetchDebts();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan pembayaran');
    }
  };

  // Filter & Search logic
  const filteredDebts = debts.filter((item) => {
    // Type filter
    if (filterType !== 'ALL' && item.type !== filterType) return false;

    // Status filter
    if (filterStatus === 'UNSETTLED') {
      if (item.status === 'SETTLED') return false;
    } else if (filterStatus === 'SETTLED') {
      if (item.status !== 'SETTLED') return false;
    } else if (filterStatus === 'OVERDUE') {
      if (!item.isOverdue) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPerson = item.personName?.toLowerCase().includes(q);
      const matchNote = item.notes?.toLowerCase().includes(q);
      if (!matchPerson && !matchNote) return false;
    }

    return true;
  });

  const overdueCount = debts.filter((d) => d.isOverdue).length;
  const urgentCount = debts.filter(
    (d) => d.status !== 'SETTLED' && d.daysRemaining >= 0 && d.daysRemaining <= 3
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & New Debt CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-ink">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <span>Catatan Hutang & Piutang</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-cream text-ink font-bold border border-ink/20">
              Debt & Loan Tracker
            </span>
          </h2>
          <p className="text-xs text-ink-muted">
            Kelola pinjaman yang harus dibayar dan tagihan piutang dengan riwayat cicilan terintegrasi
          </p>
        </div>

        <TactileButton
          variant="primary"
          onClick={() => {
            setEditingDebt(null);
            setIsDebtModalOpen(true);
          }}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>Tambah Hutang / Piutang</span>
        </TactileButton>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hutang Saya (Kewajiban) */}
        <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Hutang Saya (Kewajiban)
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-coral/20 border-2 border-brand-coral text-brand-coral flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-brand-coral tracking-tight">
              {mask(formatRupiah(totalDebt))}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              Harus dibayar ke orang lain
            </p>
          </div>
        </div>

        {/* Piutang Saya (Hak Tagih) */}
        <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Piutang Saya (Tagihan)
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-mint/30 border-2 border-brand-teal text-brand-teal flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-brand-teal tracking-tight">
              {mask(formatRupiah(totalReceivable))}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              Uang dipinjamkan yang akan kembali
            </p>
          </div>
        </div>

        {/* Posisi Bersih */}
        <div className="bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
              Posisi Pinjaman Bersih
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-cream border-2 border-ink text-ink flex items-center justify-center font-bold">
              <HandCoins className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-extrabold font-mono tracking-tight ${
                netLoanPosition >= 0 ? 'text-brand-teal' : 'text-brand-coral'
              }`}
            >
              {mask(formatRupiah(netLoanPosition))}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              {netLoanPosition >= 0
                ? 'Surplus (Piutang lebih besar dari Hutang)'
                : 'Defisit (Hutang lebih besar dari Piutang)'}
            </p>
          </div>
        </div>

        {/* Status Jatuh Tempo Alerts */}
        <div
          className={`border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between ${
            overdueCount > 0
              ? 'bg-red-50 border-red-500'
              : urgentCount > 0
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
                overdueCount > 0
                  ? 'bg-red-100 border-red-600 text-red-600'
                  : urgentCount > 0
                  ? 'bg-amber-100 border-amber-600 text-amber-600'
                  : 'bg-surface-bg border-ink text-ink-muted'
              }`}
            >
              {overdueCount > 0 ? (
                <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Clock className="w-4 h-4" strokeWidth={2.5} />
              )}
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-ink tracking-tight">
              {overdueCount > 0 ? (
                <span className="text-red-600">{overdueCount} Terlambat</span>
              ) : urgentCount > 0 ? (
                <span className="text-amber-700">{urgentCount} Segera</span>
              ) : (
                <span className="text-brand-teal text-xl">Semua Aman</span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted font-medium mt-1">
              {overdueCount > 0
                ? 'Ada catatan yang telah melewati jatuh tempo'
                : urgentCount > 0
                ? 'Jatuh tempo dalam 3 hari ke depan'
                : 'Tidak ada pinjaman mendekati jatuh tempo'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-ink rounded-2xl p-4 shadow-tactile flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Type Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-bg border-2 border-ink rounded-xl">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'ALL'
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Semua Tipe
          </button>
          <button
            onClick={() => setFilterType('DEBT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'DEBT'
                ? 'bg-brand-coral text-white shadow-sm'
                : 'text-ink-muted hover:text-brand-coral'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Hutang Saya</span>
          </button>
          <button
            onClick={() => setFilterType('RECEIVABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'RECEIVABLE'
                ? 'bg-brand-teal text-white shadow-sm'
                : 'text-ink-muted hover:text-brand-teal'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Piutang Saya</span>
          </button>
        </div>

        {/* Status Tabs & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 md:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'UNSETTLED', label: 'Belum Lunas' },
              { id: 'OVERDUE', label: 'Terlambat' },
              { id: 'SETTLED', label: 'Lunas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${
                  filterStatus === tab.id
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
              placeholder="Cari nama atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-bg border-2 border-ink rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDebts} className="underline hover:text-red-900">
            Coba lagi
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && debts.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-ink rounded-2xl shadow-tactile">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-ink-muted">
            Memuat catatan hutang & piutang...
          </p>
        </div>
      ) : filteredDebts.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white border-2 border-ink rounded-2xl shadow-tactile flex flex-col items-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-cream border-2 border-ink flex items-center justify-center text-ink shadow-tactile mb-4">
            <HandCoins className="w-8 h-8 text-brand-teal" strokeWidth={2} />
          </div>
          <h3 className="font-extrabold text-lg text-ink">
            {searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL'
              ? 'Tidak Ditemukan Catatan'
              : 'Belum Ada Hutang / Piutang'}
          </h3>
          <p className="text-xs text-ink-muted mt-1 mb-5">
            {searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL'
              ? 'Coba ganti kata kunci pencarian atau ubah filter tipe/status di atas.'
              : 'Catat pinjaman kepada teman, rekan bisnis, atau kewajiban finansial lainnya agar arus kas tetap rapi.'}
          </p>
          <TactileButton
            variant="primary"
            onClick={() => {
              setEditingDebt(null);
              setIsDebtModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Tambah Catatan Baru</span>
          </TactileButton>
        </div>
      ) : (
        /* Debts List / Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map((item) => {
            const isDebt = item.type === 'DEBT';
            const isSettled = item.status === 'SETTLED';
            const isHistoryExpanded = !!expandedHistories[item._id];
            const hasPayments = item.payments && item.payments.length > 0;

            return (
              <div
                key={item._id}
                className={`bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between transition-all duration-150 ${
                  item.isOverdue
                    ? 'border-red-400 bg-red-50/10'
                    : isSettled
                    ? 'opacity-85'
                    : ''
                }`}
              >
                <div>
                  {/* Card Header: Type Badge, Status, and Action Icons */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 ${
                          isDebt
                            ? 'bg-brand-coral/15 border-brand-coral text-brand-coral'
                            : 'bg-brand-mint/30 border-brand-teal text-brand-teal'
                        }`}
                      >
                        {isDebt ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span>HUTANG SAYA</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span>PIUTANG SAYA</span>
                          </>
                        )}
                      </span>

                      {/* Status Badge */}
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-700 border border-green-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>LUNAS</span>
                        </span>
                      ) : item.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>LEWAT TEMPO ({Math.abs(item.daysRemaining)} HARI)</span>
                        </span>
                      ) : item.paidAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3" />
                          <span>DICICIL ({item.percentage}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-bg text-ink-muted border border-ink/20">
                          <span>BELUM BAYAR</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Edit/Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDebt(item);
                          setIsDebtModalOpen(true);
                        }}
                        title="Edit Catatan"
                        className="p-1.5 text-ink-muted hover:text-ink hover:bg-surface-bg rounded-lg transition-colors border border-transparent hover:border-ink/20"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(item._id, item.personName, item.type)}
                        title="Hapus Catatan"
                        className="p-1.5 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Person Name & Total Info */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-lg font-extrabold text-ink tracking-tight flex items-center gap-1.5">
                        <User className="w-4 h-4 text-ink-muted shrink-0" />
                        <span className="truncate">{item.personName}</span>
                      </h4>
                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold font-mono text-ink">
                          {mask(formatRupiah(item.totalAmount))}
                        </div>
                        <div className="text-[10px] text-ink-muted">Total Nilai</div>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-ink-muted mt-1 italic line-clamp-2">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Progress Bar & Amounts */}
                  <div className="space-y-1.5 mb-4 p-3 bg-surface-bg border border-ink/15 rounded-xl">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-brand-teal">
                        Terbayar: {mask(formatRupiah(item.paidAmount))}
                      </span>
                      <span
                        className={
                          item.remainingAmount > 0
                            ? isDebt
                              ? 'text-brand-coral'
                              : 'text-brand-teal'
                            : 'text-ink-muted'
                        }
                      >
                        Sisa: {mask(formatRupiah(item.remainingAmount))}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-white border border-ink/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isSettled
                            ? 'bg-brand-mint'
                            : isDebt
                            ? 'bg-brand-coral'
                            : 'bg-brand-teal'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-muted pt-0.5">
                      <span className="font-semibold">{item.percentage}% Lunas</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-ink-muted" />
                        <span>
                          Tempo: {formatDateID(item.dueDate)}
                          {!isSettled && (
                            <span
                              className={`ml-1 font-bold ${
                                item.isOverdue
                                  ? 'text-red-600'
                                  : item.daysRemaining <= 3
                                  ? 'text-amber-700'
                                  : 'text-ink-muted'
                              }`}
                            >
                              ({item.isOverdue
                                ? `Lewat ${Math.abs(item.daysRemaining)} hari`
                                : `${item.daysRemaining} hari lagi`})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Accordion */}
                  {hasPayments && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleHistory(item._id)}
                        className="w-full flex items-center justify-between py-1.5 px-3 bg-white border border-ink/20 rounded-lg text-xs font-bold text-ink-muted hover:text-ink hover:bg-surface-bg transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" />
                          <span>Riwayat Pembayaran ({item.payments.length})</span>
                        </div>
                        {isHistoryExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isHistoryExpanded && (
                        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {item.payments.map((p) => (
                            <div
                              key={p._id}
                              className="p-2 bg-surface-bg/80 border border-ink/10 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-mono font-bold text-ink">
                                  {mask(formatRupiah(p.amount))}
                                </div>
                                <div className="text-[10px] text-ink-muted flex items-center gap-2">
                                  <span>{formatDateID(p.paidAt)}</span>
                                  {p.walletId?.name && (
                                    <span className="flex items-center gap-0.5">
                                      <Wallet className="w-2.5 h-2.5" />
                                      {p.walletId.name}
                                    </span>
                                  )}
                                  {p.note && <span>• {p.note}</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeletePayment(item._id, p._id)}
                                title="Hapus riwayat cicilan ini"
                                className="p-1 text-ink-muted hover:text-red-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-ink/10 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-ink-muted">
                    {item.walletId?.name ? (
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Sumber: {item.walletId.name}
                      </span>
                    ) : null}
                  </div>

                  {!isSettled ? (
                    <TactileButton
                      variant={isDebt ? 'coral' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setSelectedDebtForPayment(item);
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>{isDebt ? 'Bayar Cicilan' : 'Terima Cicilan'}</span>
                    </TactileButton>
                  ) : (
                    <span className="text-xs font-bold text-green-700 flex items-center gap-1 py-1 px-2 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Lunas Sepenuhnya
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Debt Modal (Create / Edit) */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        debt={editingDebt}
        wallets={wallets}
        onSuccess={fetchDebts}
      />

      {/* Debt Payment Modal */}
      <DebtPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedDebtForPayment(null);
        }}
        debt={selectedDebtForPayment}
        wallets={wallets}
        onSuccess={fetchDebts}
      />
    </div>
  );
};

export default DebtsPage;

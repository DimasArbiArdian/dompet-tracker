import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import TactileButton from '../components/ui/TactileButton';
import GoalModal from '../components/modals/GoalModal';
import GoalDepositModal from '../components/modals/GoalDepositModal';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDateID } from '../utils/dateHelper';
import { usePrivacy } from '../context/PrivacyContext';
import {
  Target,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

const CATEGORY_LABELS = {
  EMERGENCY: 'Dana Darurat',
  HOLIDAY: 'Liburan & Wisata',
  GADGET: 'Gadget & Elektronik',
  VEHICLE: 'Kendaraan',
  HOUSE: 'Rumah & Properti',
  EDUCATION: 'Pendidikan',
  OTHER: 'Tujuan Lainnya',
};

const GoalsPage = ({ wallets = [] }) => {
  const [goals, setGoals] = useState([]);
  const [totalTarget, setTotalTarget] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [targetGoalForDeposit, setTargetGoalForDeposit] = useState(null);

  const { mask } = usePrivacy();

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/goals');
      setGoals(res.data.data);
      setTotalTarget(res.data.totalTarget);
      setTotalCollected(res.data.totalCollected);
      setOverallProgress(res.data.overallProgress);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Gagal memuat target tabungan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus target tabungan "${name}"?`)) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus target tabungan');
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (filterTab === 'ACTIVE') return !g.isCompleted;
    if (filterTab === 'COMPLETED') return g.isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Goal CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-ink">
        <div>
          <h2 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <span>Target Tabungan Finansial</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-mint text-ink font-bold border border-ink/20">
              Savings Goals
            </span>
          </h2>
          <p className="text-xs text-ink-muted">
            Rencanakan dana darurat, liburan, dan impian finansial Anda secara terukur
          </p>
        </div>

        <TactileButton
          variant="teal"
          size="sm"
          icon={Plus}
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
        >
          Buat Target Baru
        </TactileButton>
      </div>

      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-brand-cream border-2 border-ink rounded-2xl shadow-tactile flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Total Dana Terkumpul
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-ink tabular-nums mt-1">
            {mask(formatRupiah(totalCollected))}
          </div>
          <div className="text-xs text-ink-muted mt-2 font-medium">
            Dari {goals.length} pos impian finansial
          </div>
        </div>

        <div className="p-5 bg-white border-2 border-ink rounded-2xl shadow-tactile flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Total Target Keseluruhan
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-brand-teal tabular-nums mt-1">
            {mask(formatRupiah(totalTarget))}
          </div>
          <div className="text-xs text-ink-muted mt-2 font-medium">
            Sisa target: {mask(formatRupiah(Math.max(0, totalTarget - totalCollected)))}
          </div>
        </div>

        <div className="p-5 bg-white border-2 border-ink rounded-2xl shadow-tactile flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted">
            <span>Rata-Rata Progres</span>
            <span className="font-mono text-brand-coral font-bold">{overallProgress}%</span>
          </div>
          <div className="mt-2">
            <div className="w-full h-3 bg-brand-cream rounded-full overflow-hidden border border-ink/20">
              <div
                className="h-full bg-brand-coral rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-ink-muted mt-2 font-medium">
            {goals.filter((g) => g.isCompleted).length} dari {goals.length} target tercapai
          </div>
        </div>

        <div className="p-5 bg-white border-2 border-ink rounded-2xl shadow-tactile flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Status Keberhasilan
          </span>
          <div className="text-xl sm:text-2xl font-bold text-ink mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-brand-teal shrink-0" />
            <span>
              {goals.filter((g) => g.isCompleted).length} Goal Selesai
            </span>
          </div>
          <div className="text-xs text-ink-muted mt-2 font-medium">
            Disiplin menabung meningkatkan ketahanan finansial
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-ink/15 pb-2">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            filterTab === 'ALL'
              ? 'bg-ink text-brand-cream border-ink shadow-sm'
              : 'bg-white text-ink-muted hover:text-ink border-ink/20'
          }`}
        >
          Semua Target ({goals.length})
        </button>
        <button
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            filterTab === 'ACTIVE'
              ? 'bg-ink text-brand-cream border-ink shadow-sm'
              : 'bg-white text-ink-muted hover:text-ink border-ink/20'
          }`}
        >
          Sedang Berjalan ({goals.filter((g) => !g.isCompleted).length})
        </button>
        <button
          onClick={() => setFilterTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            filterTab === 'COMPLETED'
              ? 'bg-ink text-brand-cream border-ink shadow-sm'
              : 'bg-white text-ink-muted hover:text-ink border-ink/20'
          }`}
        >
          Sudah Tercapai 🎉 ({goals.filter((g) => g.isCompleted).length})
        </button>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGoals.map((g) => {
          const isOverdue = g.daysRemaining < 0 && !g.isCompleted;

          return (
            <div
              key={g._id}
              className={`bg-white border-2 border-ink rounded-3xl p-5 shadow-tactile flex flex-col justify-between transition-all hover:translate-y-[-2px] relative overflow-hidden ${
                g.isCompleted ? 'ring-2 ring-emerald-500/30' : ''
              }`}
            >
              {/* Completed Watermark Badge */}
              {g.isCompleted && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Tercapai 100%</span>
                </div>
              )}

              <div>
                {/* Header: Icon, Category & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl border-2 border-ink flex items-center justify-center font-bold text-ink shadow-sm"
                      style={{ backgroundColor: g.color || '#359FA0' }}
                    >
                      <Target className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-ink text-base tracking-tight leading-tight">
                        {g.name}
                      </h4>
                      <span className="text-[11px] font-semibold text-ink-muted">
                        {CATEGORY_LABELS[g.category] || g.category}
                      </span>
                    </div>
                  </div>

                  {!g.isCompleted && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(g);
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1 text-ink-muted hover:text-ink hover:bg-black/5 rounded"
                        title="Edit Target"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g._id, g.name)}
                        className="p-1 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Visual */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs font-bold text-ink-muted">
                      Terkumpul:
                    </span>
                    <span className="font-mono text-base font-extrabold text-ink tabular-nums">
                      {mask(formatRupiah(g.currentAmount))}
                    </span>
                  </div>

                  <div className="w-full h-3.5 bg-brand-cream border border-ink/20 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(g.percentage, 100)}%`,
                        backgroundColor: g.color || '#359FA0',
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold text-ink-muted mt-1.5">
                    <span>
                      Target: <strong className="font-mono text-ink tabular-nums">{mask(formatRupiah(g.targetAmount))}</strong>
                    </span>
                    <span className="font-mono font-bold text-brand-teal tabular-nums">
                      {g.percentage}%
                    </span>
                  </div>
                </div>

                {/* Deadline & Saving Guidance */}
                <div className="mt-4 p-3 bg-surface-bg rounded-2xl border border-ink/10 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Tenggat:
                    </span>
                    <span className="font-semibold text-ink">
                      {formatDateID(g.targetDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-ink-muted">
                      <Clock className="w-3.5 h-3.5" /> Sisa Waktu:
                    </span>
                    <span
                      className={`font-bold ${
                        isOverdue
                          ? 'text-red-600'
                          : g.daysRemaining <= 30
                          ? 'text-brand-coral'
                          : 'text-brand-teal'
                      }`}
                    >
                      {g.isCompleted
                        ? 'Selesai'
                        : isOverdue
                        ? `Terlambat ${Math.abs(g.daysRemaining)} hari`
                        : `${g.daysRemaining} hari lagi`}
                    </span>
                  </div>

                  {!g.isCompleted && g.recommendedMonthly > 0 && (
                    <div className="pt-1.5 border-t border-ink/10 flex items-center justify-between font-medium">
                      <span className="text-[11px] text-ink-muted">
                        Saran Nabung:
                      </span>
                      <span className="font-mono font-bold text-xs text-brand-teal tabular-nums">
                        {mask(formatRupiah(g.recommendedMonthly))}/bulan
                      </span>
                    </div>
                  )}
                </div>

                {g.notes && (
                  <p className="mt-2.5 text-[11px] text-ink-muted italic px-1 truncate">
                    "{g.notes}"
                  </p>
                )}
              </div>

              {/* Actions Button */}
              <div className="mt-5 pt-3 border-t border-ink/10 flex items-center gap-2">
                <TactileButton
                  variant="coral"
                  size="sm"
                  icon={ArrowDownLeft}
                  onClick={() => {
                    setTargetGoalForDeposit(g);
                    setIsDepositModalOpen(true);
                  }}
                  className="flex-1"
                >
                  + Setor Dana
                </TactileButton>

                {g.currentAmount > 0 && (
                  <TactileButton
                    variant="outline"
                    size="sm"
                    icon={ArrowUpRight}
                    onClick={() => {
                      setTargetGoalForDeposit(g);
                      setIsDepositModalOpen(true);
                    }}
                  >
                    Tarik
                  </TactileButton>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Goal Empty Prompt */}
        {filteredGoals.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 bg-white border-2 border-dashed border-ink/30 rounded-3xl p-6">
            <Target className="w-12 h-12 text-ink-muted mx-auto mb-2" />
            <h4 className="font-bold text-ink text-base">
              Belum ada target tabungan yang sesuai filter
            </h4>
            <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
              Mulai wujudkan resolusi keuangan Anda dengan menetapkan target tabungan hari ini.
            </p>
            <div className="mt-4">
              <TactileButton
                variant="teal"
                size="md"
                icon={Plus}
                onClick={() => {
                  setEditingGoal(null);
                  setIsGoalModalOpen(true);
                }}
              >
                Buat Target Tabungan Pertama
              </TactileButton>
            </div>
          </div>
        )}
      </div>

      {/* Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goal={editingGoal}
        wallets={wallets}
        onSuccess={fetchGoals}
      />

      {/* Goal Deposit Modal */}
      <GoalDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        goal={targetGoalForDeposit}
        wallets={wallets}
        onSuccess={fetchGoals}
      />
    </div>
  );
};

export default GoalsPage;

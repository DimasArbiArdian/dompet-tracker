import React from 'react';
import { formatRupiah } from '../../utils/formatRupiah';
import { AlertCircle, CheckCircle2, AlertTriangle, Trash2, Edit2 } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';

const BudgetProgress = ({
  budget,
  onEdit,
  onDelete,
}) => {
  const { mask } = usePrivacy();
  const { categoryId, amountLimit, spent, remaining, percentage } = budget;
  const categoryName = categoryId?.name || 'Kategori';

  // Determine color and status according to PRD
  let barColor = '#8AD6D1'; // Soft mint for < 75%
  let statusBadge = (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
      <CheckCircle2 className="w-3 h-3" /> Aman ({percentage}%)
    </span>
  );

  if (percentage >= 90) {
    barColor = '#FF8C52'; // Coral orange for >= 90%
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-brand-coral px-2 py-0.5 rounded-md border border-ink shadow-sm">
        <AlertCircle className="w-3 h-3" /> Over Budget ({percentage}%)
      </span>
    );
  } else if (percentage >= 75) {
    barColor = '#359FA0'; // Deep Teal for 75% - 90%
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-teal bg-brand-mint/30 px-2 py-0.5 rounded-md border border-brand-teal/30">
        <AlertTriangle className="w-3 h-3" /> Waspada ({percentage}%)
      </span>
    );
  }

  return (
    <div className="p-4 bg-white border-2 border-ink rounded-2xl shadow-tactile transition-all hover:translate-y-[-1px]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full border border-ink/20"
            style={{ backgroundColor: categoryId?.color || '#359FA0' }}
          />
          <h4 className="font-bold text-ink text-sm sm:text-base tracking-tight">
            {categoryName}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge}
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="p-1 text-ink-muted hover:text-ink hover:bg-black/5 rounded"
              title="Edit Budget"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(budget._id)}
              className="p-1 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded"
              title="Hapus Budget"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Track: Warm Cream #FFF0C5 according to PRD */}
      <div className="w-full h-3 bg-brand-cream border border-ink/20 rounded-full overflow-hidden my-2.5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mt-1">
        <span>
          Terpakai:{' '}
          <strong className="font-mono text-ink tabular-nums">
            {mask(formatRupiah(spent))}
          </strong>
        </span>
        <span>
          Batas:{' '}
          <strong className="font-mono text-ink tabular-nums">
            {mask(formatRupiah(amountLimit))}
          </strong>
        </span>
      </div>

      <div className="mt-2 pt-2 border-t border-ink/10 flex items-center justify-between text-[11px]">
        <span className="text-ink-muted">
          Sisa Anggaran:
        </span>
        <span
          className={`font-mono font-bold tabular-nums ${
            remaining === 0 ? 'text-brand-coral' : 'text-brand-teal'
          }`}
        >
          {mask(formatRupiah(remaining))}
        </span>
      </div>
    </div>
  );
};

export default BudgetProgress;

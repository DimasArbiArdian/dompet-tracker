import React from 'react';

export const TransactionTypeBadge = ({ type }) => {
  switch (type) {
    case 'INCOME':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[#8AD6D1]/30 text-brand-teal border border-brand-teal/30">
          Pemasukan
        </span>
      );
    case 'EXPENSE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[#FF8C52]/20 text-brand-coral border border-brand-coral/30">
          Pengeluaran
        </span>
      );
    case 'TRANSFER':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-ink/10 text-ink border border-ink/20">
          Transfer
        </span>
      );
    default:
      return null;
  }
};

export const WalletTypeBadge = ({ type }) => {
  const map = {
    BANK: { label: 'Bank', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    EWALLET: { label: 'E-Wallet', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    CASH: { label: 'Tunai', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    INVESTMENT: { label: 'Investasi', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  };

  const item = map[type] || { label: type, bg: 'bg-gray-100 text-gray-800 border-gray-300' };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.bg}`}
    >
      {item.label}
    </span>
  );
};

export const BudgetStatusBadge = ({ percentage }) => {
  if (percentage >= 90) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-brand-coral/20 text-brand-coral border border-brand-coral/40">
        Over Budget ({percentage}%)
      </span>
    );
  }
  if (percentage >= 75) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-brand-teal/20 text-brand-teal border border-brand-teal/40">
        Mendekati Batas ({percentage}%)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-brand-mint/30 text-emerald-800 border border-brand-mint/60">
      Aman ({percentage}%)
    </span>
  );
};

import React from 'react';
import { Menu, Plus, ChevronLeft, ChevronRight, Calendar, Eye, EyeOff } from 'lucide-react';
import TactileButton from '../ui/TactileButton';
import { formatMonthYear } from '../../utils/dateHelper';
import { usePrivacy } from '../../context/PrivacyContext';

const Topbar = ({
  onToggleSidebar,
  onOpenQuickAdd,
  selectedMonth,
  selectedYear,
  onChangeMonth,
  title,
}) => {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onChangeMonth(12, selectedYear - 1);
    } else {
      onChangeMonth(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onChangeMonth(1, selectedYear + 1);
    } else {
      onChangeMonth(selectedMonth + 1, selectedYear);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-bg/90 backdrop-blur-md border-b-2 border-ink px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile menu & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl border-2 border-ink bg-white shadow-tactile text-ink"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" strokeWidth={2.2} />
        </button>

        {title && (
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            {title}
          </h2>
        )}
      </div>

      {/* Right: Month Selector & Primary CTA */}
      <div className="flex items-center gap-2 sm:gap-3">
        {selectedMonth && selectedYear && onChangeMonth && (
          <div className="flex items-center bg-white border-2 border-ink rounded-xl px-2 py-1 shadow-tactile">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded text-ink hover:bg-black/5"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-ink px-2 flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-brand-teal hidden sm:inline" />
              {formatMonthYear(selectedMonth, selectedYear)}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded text-ink hover:bg-black/5"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Privacy Mode Toggle */}
        <button
          onClick={togglePrivacyMode}
          title={isPrivacyMode ? 'Tampilkan Nominal (Tekan H)' : 'Sensor Nominal / Mode Privasi (Tekan H)'}
          className={`p-2 rounded-xl border-2 border-ink flex items-center gap-1.5 transition-all text-xs font-bold shadow-tactile ${
            isPrivacyMode
              ? 'bg-brand-coral text-white border-ink'
              : 'bg-white text-ink hover:bg-surface-bg'
          }`}
          aria-label="Mode Privasi"
        >
          {isPrivacyMode ? (
            <EyeOff className="w-4 h-4" strokeWidth={2.2} />
          ) : (
            <Eye className="w-4 h-4" strokeWidth={2.2} />
          )}
          <span className="hidden md:inline font-mono text-[11px] bg-black/10 px-1 py-0.5 rounded">
            H
          </span>
        </button>

        <TactileButton
          variant="coral"
          size="md"
          icon={Plus}
          onClick={onOpenQuickAdd}
          className="whitespace-nowrap"
        >
          <span className="hidden sm:inline">Transaksi Baru</span>
          <span className="sm:hidden">Tambah</span>
        </TactileButton>
      </div>
    </header>
  );
};

export default Topbar;

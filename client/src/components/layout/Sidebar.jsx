import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Target,
  HandCoins,
  CalendarClock,
  Activity,
  FileText,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Dompet Saya', path: '/wallets', icon: Wallet },
  { name: 'Anggaran (Budget)', path: '/budgets', icon: PiggyBank },
  { name: 'Target Tabungan', path: '/goals', icon: Target },
  { name: 'Hutang & Piutang', path: '/debts', icon: HandCoins },
  { name: 'Tagihan Rutin', path: '/recurring', icon: CalendarClock },
  { name: 'Kesehatan Finansial', path: '/health', icon: Activity },
  { name: 'Laporan Resmi (PDF)', path: '/report', icon: FileText },
];

const Sidebar = ({ isOpen, onClose, onQuickAdd }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r-2 border-ink flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b-2 border-ink flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-teal border-2 border-ink flex items-center justify-center text-brand-cream shadow-tactile">
                <Wallet className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-ink tracking-tight leading-none">
                  Dompet<span className="text-brand-coral">Tracker</span>
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase text-brand-teal">
                  Finance Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-75 ${
                      isActive
                        ? 'bg-brand-cream text-ink border-2 border-ink shadow-tactile'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-bg border-2 border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Keyboard shortcut promo */}
          <div className="px-4 py-2 space-y-2">
            <div className="p-3 bg-brand-cream/60 border border-ink/20 rounded-xl text-xs">
              <div className="flex items-center justify-between font-bold text-ink mb-1">
                <span>Pencatatan Kilat</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-ink/30 rounded font-mono text-[11px] font-bold shadow-sm">
                  N
                </kbd>
              </div>
              <p className="text-[11px] text-ink-muted">
                Tekan <span className="font-bold text-ink">N</span> kapan saja untuk input transaksi.
              </p>
            </div>

            <div className="p-3 bg-brand-mint/20 border border-ink/20 rounded-xl text-xs">
              <div className="flex items-center justify-between font-bold text-ink mb-1">
                <span>Mode Privasi</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-ink/30 rounded font-mono text-[11px] font-bold shadow-sm">
                  H
                </kbd>
              </div>
              <p className="text-[11px] text-ink-muted">
                Tekan <span className="font-bold text-ink">H</span> untuk menyembunyikan nominal saldo di tempat umum.
              </p>
            </div>
          </div>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t-2 border-ink bg-surface-bg/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-brand-mint border-2 border-ink flex items-center justify-center font-bold text-ink text-sm shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-sm font-bold text-ink truncate leading-tight">
                  {user?.name || 'Pengguna'}
                </div>
                <div className="text-[11px] text-ink-muted truncate">
                  {user?.email || ''}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Keluar"
              className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

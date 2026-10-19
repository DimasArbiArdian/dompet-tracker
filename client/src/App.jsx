import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import QuickAddTransactionModal from './components/modals/QuickAddTransactionModal';
import WalletModal from './components/modals/WalletModal';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import WalletsPage from './pages/WalletsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import DebtsPage from './pages/DebtsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import FinancialHealthPage from './pages/FinancialHealthPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import api from './api/axios';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Month & Year state for global workspace
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Shared wallets and categories
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  const fetchCommonData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [wRes, cRes] = await Promise.all([
        api.get('/wallets'),
        api.get('/categories'),
      ]);
      setWallets(wRes.data.data);
      setCategories(cRes.data.data);
    } catch (err) {
      console.error('Failed to load shared common data:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCommonData();
  }, [fetchCommonData]);

  // Global Keyboard Shortcut: Press "N" to trigger Quick Add Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing inside an input/textarea/select
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
        e.target.isContentEditable
      ) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-ink-muted">
            Memuat Dompet Tracker...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-bg text-ink flex flex-col lg:flex-row">
      {/* Sidebar navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChangeMonth={(m, y) => {
            setSelectedMonth(m);
            setSelectedYear(y);
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                  onOpenAddWallet={() => {
                    setEditingWallet(null);
                    setIsWalletModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/transactions"
              element={
                <TransactionsPage
                  wallets={wallets}
                  categories={categories}
                />
              }
            />
            <Route
              path="/wallets"
              element={
                <WalletsPage
                  wallets={wallets}
                  onRefresh={fetchCommonData}
                  onOpenAddWallet={() => {
                    setEditingWallet(null);
                    setIsWalletModalOpen(true);
                  }}
                  onOpenEditWallet={(w) => {
                    setEditingWallet(w);
                    setIsWalletModalOpen(true);
                  }}
                  onOpenTransfer={() => setIsQuickAddOpen(true)}
                />
              }
            />
            <Route
              path="/budgets"
              element={
                <BudgetsPage
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  categories={categories}
                />
              }
            />
            <Route
              path="/goals"
              element={<GoalsPage wallets={wallets} />}
            />
            <Route
              path="/debts"
              element={<DebtsPage wallets={wallets} />}
            />
            <Route
              path="/recurring"
              element={<SubscriptionsPage wallets={wallets} categories={categories} />}
            />
            <Route
              path="/health"
              element={<FinancialHealthPage />}
            />
            <Route
              path="/report"
              element={<ReportPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <QuickAddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        wallets={wallets}
        categories={categories}
        onSuccess={() => {
          fetchCommonData();
          // Dispatch custom event to notify current active page to refresh
          window.dispatchEvent(new CustomEvent('transaction-updated'));
        }}
      />

      {/* Global Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        wallet={editingWallet}
        onSuccess={fetchCommonData}
      />
    </div>
  );
};

const App = () => {
  return (
    <PrivacyProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </PrivacyProvider>
  );
};

export default App;

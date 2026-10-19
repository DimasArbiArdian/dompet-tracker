import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TactileButton from '../components/ui/TactileButton';
import { Wallet, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Mohon isi email dan password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login gagal. Periksa kembali email & password Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@dompet.id');
    setPassword('demo123456');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-teal border-2 border-ink flex items-center justify-center text-brand-cream shadow-tactile-teal">
            <Wallet className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Masuk ke <span className="text-brand-coral">Dompet Tracker</span>
        </h2>
        <p className="mt-1 text-center text-xs text-ink-muted">
          Pusat kendali arus kas & perencanaan finansial harian Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border-2 border-ink rounded-3xl shadow-tactile">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
              />
            </div>

            <div className="pt-2">
              <TactileButton
                type="submit"
                variant="coral"
                size="lg"
                loading={loading}
                icon={ArrowRight}
                className="w-full"
              >
                Masuk ke Dashboard
              </TactileButton>
            </div>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-6 pt-5 border-t border-ink/10">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-brand-teal/50 bg-brand-mint/15 text-xs font-bold text-brand-teal hover:bg-brand-mint/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Gunakan Akun Percobaan (Demo)</span>
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-ink-muted">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="font-bold text-brand-teal underline underline-offset-4 hover:text-ink transition-colors"
            >
              Daftar akun baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

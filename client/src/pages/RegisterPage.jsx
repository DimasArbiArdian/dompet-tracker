import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TactileButton from '../components/ui/TactileButton';
import { Wallet, Check, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Mohon isi semua data pendaftaran');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Pendaftaran gagal. Silakan coba kembali.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-coral border-2 border-ink flex items-center justify-center text-white shadow-tactile-coral">
            <Wallet className="w-7 h-7" strokeWidth={2.2} />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Buat Akun <span className="text-brand-teal">Dompet Tracker</span>
        </h2>
        <p className="mt-1 text-center text-xs text-ink-muted">
          Mulai catat transaksi & rancang anggaran bulanan Anda sekarang
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
                Nama Lengkap / Panggilan
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dimas Arbi"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
              />
            </div>

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
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-ink rounded-xl text-sm font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-teal shadow-tactile"
              />
            </div>

            <div className="p-3 bg-brand-cream/60 border border-ink/20 rounded-xl text-xs space-y-1 text-ink">
              <div className="font-bold">Otomatis Disediakan:</div>
              <div className="flex items-center gap-1.5 text-ink-muted">
                <Check className="w-3.5 h-3.5 text-brand-teal" />
                <span>2 Dompet awal (Tunai & Rekening Bank)</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-muted">
                <Check className="w-3.5 h-3.5 text-brand-teal" />
                <span>13 Kategori bawaan (Pemasukan & Pengeluaran)</span>
              </div>
            </div>

            <div className="pt-2">
              <TactileButton
                type="submit"
                variant="teal"
                size="lg"
                loading={loading}
                icon={ArrowRight}
                className="w-full"
              >
                Daftar & Masuk
              </TactileButton>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-ink-muted">
            Sudah punya akun?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-teal underline underline-offset-4 hover:text-ink transition-colors"
            >
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

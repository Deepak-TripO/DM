import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (email.trim().toLowerCase() === 'admin@dm.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/files', { replace: true });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl neu-circle text-[var(--color-primary)]">
            <span className="text-2xl font-black">DM</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">Welcome Back</h1>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">Sign in to access your files</p>
        </div>

        <div className="rounded-3xl neu-flat p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl neu-pressed p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                {error.toLowerCase().includes('rate limit')
                  ? 'Email rate limit reached on your Supabase project. If you already created an account, try signing in directly with your email and password.'
                  : error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl neu-input py-3 pl-10 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className="w-full rounded-xl neu-input py-3 pl-10 pr-10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-[var(--color-text-secondary)]">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-bold text-[var(--color-primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

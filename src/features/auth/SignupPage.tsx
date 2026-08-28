import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, fullName);
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else if (result.autoLoggedIn) {
      navigate('/tasks', { replace: true });
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg)] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-3xl neu-flat p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl neu-circle text-[var(--color-primary)]">
              <Mail className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Check your email</h2>
            <p className="mt-2 text-xs font-medium text-[var(--color-text-secondary)]">
              We sent a verification link to <strong>{email}</strong>. Please verify your email to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl neu-circle p-2">
            <img src="/dm-logo.png" alt="DM Logo" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">Create Account</h1>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">Get started with your cloud storage</p>
        </div>

        <div className="rounded-3xl neu-flat p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl neu-pressed p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full rounded-xl neu-input py-3 pl-10 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>
            </div>

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
                  placeholder="Min. 6 characters"
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

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                  className="w-full rounded-xl neu-input py-3 pl-10 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-[var(--color-text-secondary)]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

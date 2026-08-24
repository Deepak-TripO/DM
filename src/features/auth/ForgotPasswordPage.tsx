import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl neu-circle text-[var(--color-primary)]">
            <span className="text-2xl font-black">DM</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">Reset Password</h1>
          <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">We'll send you a recovery link</p>
        </div>

        <div className="rounded-3xl neu-flat p-7">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl neu-circle text-[var(--color-primary)]">
                <Mail className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Check your email</h2>
              <p className="mt-2 text-xs font-medium text-[var(--color-text-secondary)]">
                We sent a password reset link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl neu-pressed p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Enter your email address and we will send you a link to reset your password.
              </p>

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

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl neu-btn-primary px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60 mt-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] neu-btn px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

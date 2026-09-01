import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { Loader2, Clock, LogOut } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isPendingApproval, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isPendingApproval) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--neu-bg)]">
        <div className="w-full max-w-md rounded-3xl neu-card p-8 text-center space-y-6 shadow-2xl border border-[var(--color-border-light)]/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full neu-circle text-amber-500 bg-amber-500/10">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-[var(--color-text-primary)]">
              Account Pending Approval
            </h2>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] leading-relaxed">
              Your account is pending admin approval. Please wait for an administrator to approve your account access.
            </p>
          </div>

          <div className="p-3 rounded-2xl neu-pressed text-xs font-bold text-amber-500 border border-amber-500/30">
            Status: Pending Admin Approval
          </div>

          <div className="pt-2">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl neu-btn text-xs font-black text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--neu-bg)] p-4 text-center">
      <div className="w-full max-w-md rounded-3xl neu-flat p-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl neu-circle text-[var(--color-danger)]">
          <ShieldAlert className="h-8 w-8 text-[var(--color-danger)]" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-[var(--color-text-primary)]">Access Denied</h1>
        <p className="mb-6 text-xs font-semibold text-[var(--color-text-secondary)]">
          You do not have permission to access the administration dashboard.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-xl neu-btn-primary px-5 py-3 text-sm font-bold text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

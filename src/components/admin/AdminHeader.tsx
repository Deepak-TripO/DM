import { useAuth } from '@/features/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ArrowLeft, Shield } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between neu-flat px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl neu-circle text-[var(--color-primary)] font-bold text-xs">
            <Shield className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <div>
            <img src="/dm-logo.png" alt="DM Logo" className="h-5 w-auto inline-block object-contain" />
            <span className="ml-1 text-xs font-bold text-[var(--color-text-tertiary)]">Administration</span>
          </div>
        </div>
        <span className="text-[var(--color-text-tertiary)] opacity-40">|</span>
        <h1 className="text-base font-bold text-[var(--color-text-primary)]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="hidden items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] sm:flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to App
        </button>

        <div className="flex items-center gap-2 rounded-xl neu-pressed px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full neu-circle bg-[var(--color-primary)] text-white text-xs font-bold">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="hidden text-xs font-semibold text-[var(--color-text-primary)] md:inline">
            {user?.email || 'Admin'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)] hover:text-[var(--color-danger)]"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

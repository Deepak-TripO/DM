import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, User, LogOut, Upload, CheckSquare } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  onUploadClick?: () => void;
  onSearch?: (query: string) => void;
  onLogoClick?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onUploadClick, onLogoClick, sidebarOpen }: HeaderProps) {
  const { isAdmin } = useAdmin();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-[var(--header-height)] items-center justify-between gap-3 bg-[var(--neu-bg)] px-4 md:px-6 neu-flat z-20 sticky top-0 rounded-b-2xl border-b border-[var(--color-border-light)]/40 shadow-xs">
      {/* Top-Left Branding Logo — DM anchored on top-left for Mobile & Desktop */}
      <div className="flex items-center gap-2">
        {/* Mobile: DM logo is always anchored at top-left */}
        <button
          onClick={() => navigate('/home')}
          className="text-lg font-black tracking-tight text-[var(--color-text-primary)] md:hidden cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
          aria-label="DM logo"
        >
          DM
        </button>

        {/* Desktop: DM logo visible when sidebar is toggled closed */}
        {!sidebarOpen && (
          <button
            onClick={onLogoClick}
            className="hidden md:block text-xl font-black tracking-tight text-[var(--color-text-primary)] cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
            aria-label="DM logo"
            title={onLogoClick ? "Toggle navigation sidebar" : "DM"}
          >
            DM
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Task Access */}
        <button
          onClick={() => navigate('/tasks')}
          className={cn(
            'flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold transition-all hover:scale-[1.02]',
            location.pathname.startsWith('/tasks')
              ? 'neu-pressed text-[var(--color-primary)] font-extrabold'
              : 'text-[var(--color-text-primary)]'
          )}
          aria-label="Task"
        >
          <CheckSquare className="h-4 w-4 text-[#4D94E8]" />
          <span className="hidden sm:inline">Task</span>
        </button>

        {/* Admin Dashboard Access */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] transition-all hover:scale-[1.02]"
            aria-label="Admin Dashboard"
          >
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </button>
        )}

        {/* Upload Button */}
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 rounded-xl neu-btn-primary px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-sm hover:scale-[1.02]"
            aria-label="Upload file"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        )}

        {/* Profile Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-text-primary)] transition-all hover:scale-[1.02]"
          aria-label="Profile"
        >
          <User className="h-4 w-4 text-[var(--color-primary)]" />
          <span className="hidden sm:inline">Profile</span>
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-1.5 text-xs font-bold text-[var(--color-danger)] transition-all hover:bg-red-500/10 hover:scale-[1.02]"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4 text-[var(--color-danger)]" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

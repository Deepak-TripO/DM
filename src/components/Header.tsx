import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, LogOut, Upload } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/features/auth/AuthProvider';

interface HeaderProps {
  title: string;
  onUploadClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ title, onUploadClick }: HeaderProps) {
  const { isAdmin } = useAdmin();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-[var(--header-height)] items-center gap-3 bg-[var(--neu-bg)] px-4 md:px-6 neu-flat z-20">
      {/* Branding & Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-black tracking-tight text-[var(--color-text-primary)] md:text-xl">DM</span>
        <span className="text-sm font-semibold text-[var(--color-text-tertiary)]">/</span>
        <h1 className="text-sm md:text-base font-bold tracking-tight text-[var(--color-text-primary)]">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
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

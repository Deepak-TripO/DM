import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, X, User, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onUploadClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ title, onUploadClick, onSearch }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex h-[var(--header-height)] items-center gap-4 bg-[var(--neu-bg)] px-4 md:px-6 neu-flat z-20">
      <h1 className="shrink-0 text-lg font-bold tracking-tight text-[var(--color-text-primary)] md:text-xl">{title}</h1>

      {/* Search */}
      <div className="relative mx-auto hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search files and folders..."
          className={cn(
            'w-full rounded-xl neu-input py-2 pl-10 pr-8 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-all',
            searchFocused && 'ring-2 ring-[var(--color-primary)]'
          )}
          aria-label="Search files and folders"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); onSearch?.(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Admin Dashboard Quick Access Button for Admin Users */}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 rounded-xl neu-btn px-3 py-2 text-xs font-bold text-[var(--color-primary)] transition-all"
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
            className="flex items-center gap-2 rounded-xl neu-btn-primary px-4 py-2 text-sm font-semibold text-white transition-all md:px-5"
            aria-label="Upload file"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden md:inline">Upload</span>
          </button>
        )}

        {/* Profile Menu */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full neu-circle text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
            aria-label="Profile menu"
          >
            <User className="h-4 w-4" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-60 rounded-2xl neu-dropdown p-2 shadow-2xl">
              <div className="px-3 py-2.5 neu-pressed-deep rounded-xl mb-2">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] truncate">{user?.email}</p>
              </div>

              {isAdmin && (
                <>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-primary)] neu-btn mb-1.5"
                  >
                    <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                    Admin Dashboard
                  </button>
                </>
              )}

              <button
                onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--color-text-secondary)] neu-btn mb-1.5 hover:text-[var(--color-text-primary)]"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--color-text-secondary)] neu-btn mb-1.5 hover:text-[var(--color-text-primary)]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--color-danger)] neu-btn hover:text-[var(--color-danger)]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

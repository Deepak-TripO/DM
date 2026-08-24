import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, X, ShieldCheck } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onUploadClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ title, onUploadClick, onSearch }: HeaderProps) {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
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
      </div>
    </header>
  );
}

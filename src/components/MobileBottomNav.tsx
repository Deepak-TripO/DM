import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Folder,
  Share2,
  Trash2,
  MoreHorizontal,
  Clock,
  Settings,
  User,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/features/auth/AuthProvider';

export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setMoreOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleNavigate = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  const isPathActive = (path: string) => {
    const p = location.pathname;
    if (path === '/home') {
      return p === '/home' || p === '/' || p.startsWith('/tasks');
    }
    if (path === '/files') {
      return p.startsWith('/files') || p.startsWith('/folders');
    }
    return p.startsWith(path);
  };

  const isMoreActive =
    moreOpen ||
    location.pathname.startsWith('/recent') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/settings');

  const primaryNavItems = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/files', label: 'My Files', icon: Folder },
    { to: '/shared', label: 'Shared', icon: Share2 },
    { to: '/trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar — Mobile Only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[var(--neu-bg)] border-t border-[var(--color-border-light)]/60 shadow-lg px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden"
        aria-label="Mobile bottom navigation"
      >
        {primaryNavItems.map((item) => {
          const active = isPathActive(item.to);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-150 flex-1 min-w-0',
                active
                  ? 'neu-pressed text-[var(--color-primary)] font-black'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]')} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setMoreOpen((prev) => !prev)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-150 flex-1 min-w-0',
            isMoreActive
              ? 'neu-pressed text-[var(--color-primary)] font-black'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
          )}
          aria-label="More options"
        >
          <MoreHorizontal className={cn('h-5 w-5 shrink-0', isMoreActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]')} />
          <span className="truncate max-w-[64px]">More</span>
        </button>
      </nav>

      {/* More Options Bottom Sheet Modal */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-150">
          {/* Backdrop Click */}
          <div className="flex-1" onClick={() => setMoreOpen(false)} />

          {/* Bottom Sheet Content */}
          <div className="relative w-full rounded-t-3xl bg-[var(--neu-bg)] border-t border-[var(--color-border-light)] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-[var(--color-border-light)]/40">
              <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">More Options</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-full neu-circle p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation List inside More Menu */}
            <div className="space-y-2">
              {/* Recent */}
              <button
                onClick={() => handleNavigate('/recent')}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                  location.pathname.startsWith('/recent')
                    ? 'neu-pressed text-[var(--color-primary)] font-extrabold'
                    : 'neu-btn text-[var(--color-text-primary)]'
                )}
              >
                <Clock className="h-5 w-5 text-[#E59A32]" />
                <span>Recent</span>
              </button>

              {/* Admin Dashboard — Only rendered for authorized admins */}
              {isAdmin && (
                <button
                  onClick={() => handleNavigate('/admin')}
                  className={cn(
                    'flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                    location.pathname.startsWith('/admin')
                      ? 'neu-pressed text-[var(--color-primary)] font-extrabold'
                      : 'neu-btn text-[var(--color-primary)]'
                  )}
                >
                  <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
                  <span>Admin Dashboard</span>
                </button>
              )}

              {/* Settings / Profile */}
              <button
                onClick={() => handleNavigate('/profile')}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                  location.pathname.startsWith('/profile')
                    ? 'neu-pressed text-[var(--color-primary)] font-extrabold'
                    : 'neu-btn text-[var(--color-text-primary)]'
                )}
              >
                <User className="h-5 w-5 text-[var(--color-primary)]" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => handleNavigate('/profile')}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                  location.pathname.startsWith('/settings')
                    ? 'neu-pressed text-[var(--color-primary)] font-extrabold'
                    : 'neu-btn text-[var(--color-text-primary)]'
                )}
              >
                <Settings className="h-5 w-5 text-[var(--color-text-secondary)]" />
                <span>Settings</span>
              </button>

              <div className="my-2 h-px bg-[var(--color-border-light)]/40" />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-danger)] neu-btn hover:bg-red-500/10 transition-all"
              >
                <LogOut className="h-5 w-5 text-[var(--color-danger)]" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

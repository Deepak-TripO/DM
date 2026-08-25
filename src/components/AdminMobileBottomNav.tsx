import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderTree,
  CheckSquare,
  MoreHorizontal,
  HardDrive,
  FileText,
  Link2,
  Activity,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminPrimaryItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true, color: '#3B82F6', activeBg: 'rgba(59, 130, 246, 0.14)', activeText: '#2563EB' },
  { to: '/admin/users', label: 'Users', icon: Users, exact: false, color: '#10B981', activeBg: 'rgba(16, 185, 129, 0.14)', activeText: '#059669' },
  { to: '/admin/categories', label: 'Category', icon: FolderTree, exact: false, color: '#18AFAF', activeBg: 'rgba(24, 175, 175, 0.14)', activeText: '#0F766E' },
  { to: '/admin/tasks', label: 'Task', icon: CheckSquare, exact: false, color: '#6366F1', activeBg: 'rgba(99, 102, 241, 0.14)', activeText: '#4F46E5' },
];

const adminMoreConfig = {
  label: 'More',
  icon: MoreHorizontal,
  color: '#F97316',
  activeBg: 'rgba(249, 115, 22, 0.14)',
  activeText: '#EA580C',
};

const moreMenuItems = [
  { to: '/admin/storage', label: 'Storage', icon: HardDrive, color: '#18AFAF' },
  { to: '/admin/files', label: 'Files', icon: FileText, color: '#8A63D2' },
  { to: '/admin/shared-links', label: 'Shared Links', icon: Link2, color: '#159A8A' },
  { to: '/admin/activity', label: 'Activity', icon: Activity, color: '#E59A32' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, color: '#65758B' },
];

export function AdminMobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (item: { to: string; exact?: boolean }) => {
    if (item.exact) {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(item.to);
  };

  const isMoreActive =
    moreOpen ||
    moreMenuItems.some((m) => location.pathname.startsWith(m.to));

  const handleNavigate = (path: string) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Mobile Admin Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[var(--neu-bg)] border-t border-[var(--color-border-light)]/60 shadow-lg px-1.5 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:hidden"
        aria-label="Mobile Admin bottom navigation"
      >
        {adminPrimaryItems.map((item) => {
          const active = isPathActive(item);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => setMoreOpen(false)}
              style={active ? { backgroundColor: item.activeBg, color: item.activeText } : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-all duration-150 flex-1 min-w-0',
                active
                  ? 'neu-pressed font-black shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <Icon
                className={cn('h-5 w-5 shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-70')}
                style={{ color: item.color }}
              />
              <span className="truncate max-w-[64px]" style={active ? { color: item.activeText } : undefined}>
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setMoreOpen((prev) => !prev)}
          style={isMoreActive ? { backgroundColor: adminMoreConfig.activeBg, color: adminMoreConfig.activeText } : undefined}
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-all duration-150 flex-1 min-w-0 cursor-pointer',
            isMoreActive
              ? 'neu-pressed font-black shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
          aria-label="More admin options"
        >
          <MoreHorizontal
            className={cn('h-5 w-5 shrink-0 transition-opacity', isMoreActive ? 'opacity-100' : 'opacity-70')}
            style={{ color: adminMoreConfig.color }}
          />
          <span className="truncate max-w-[64px]" style={isMoreActive ? { color: adminMoreConfig.activeText } : undefined}>
            More
          </span>
        </button>
      </nav>

      {/* More Options Bottom Sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-150">
          <div className="flex-1" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full rounded-t-3xl bg-[var(--neu-bg)] border-t border-[var(--color-border-light)] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-[var(--color-border-light)]/40">
              <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">Admin Management</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-full neu-circle p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {moreMenuItems.map((m) => {
                const Icon = m.icon;
                const active = location.pathname.startsWith(m.to);
                return (
                  <button
                    key={m.to}
                    onClick={() => handleNavigate(m.to)}
                    className={cn(
                      'flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all cursor-pointer',
                      active
                        ? 'neu-pressed text-[var(--color-primary)] font-extrabold'
                        : 'neu-btn text-[var(--color-text-primary)]'
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: m.color }} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
